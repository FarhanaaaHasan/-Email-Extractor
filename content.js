let isScanning = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_SCAN') {
        startScanning();
    } else if (request.action === 'STOP_SCAN') {
        isScanning = false;
    }
});

async function startScanning() {
    if (isScanning) return;
    isScanning = true;

    try {
        // 1. Find all profile links on the page
        // Common LMS selectors (Moodle, Canvas, etc.)
        const links = Array.from(document.querySelectorAll('a'))
            .filter(a => {
                const href = a.href;
                return (href.includes('/user/view.php') || // Moodle
                    href.includes('/courses/') && href.includes('/users/') || // Canvas
                    href.includes('/profile/') ||
                    href.includes('userId='));
            })
            .map(a => ({
                url: a.href,
                name: a.innerText.trim()
            }))
            // Deduplicate by URL
            .filter((v, i, a) => a.findIndex(t => t.url === v.url) === i)
            // Filter out empty names or non-profile links
            .filter(p => p.name.length > 2 && !p.name.includes('\n'));

        if (links.length === 0) {
            chrome.runtime.sendMessage({
                type: 'SCAN_ERROR',
                error: 'No participant links found. Are you on the right page?'
            });
            isScanning = false;
            return;
        }

        const results = [];

        for (let i = 0; i < links.length; i++) {
            if (!isScanning) break;

            const profile = links[i];

            // Update progress
            chrome.runtime.sendMessage({
                type: 'SCAN_PROGRESS',
                current: i + 1,
                total: links.length,
                lastFound: profile.name
            });

            try {
                // Fetch the profile page
                const response = await fetch(profile.url);
                const html = await response.text();

                // Parse the email
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Strategy 1: Look for mailto links
                let email = doc.querySelector('a[href^="mailto:"]')?.href.replace('mailto:', '').split('?')[0];

                // Strategy 2: Look for specific elements (Moodle style)
                if (!email) {
                    const emailElement = Array.from(doc.querySelectorAll('dd, .email, td, a'))
                        .find(el => {
                            const text = el.innerText || '';
                            return text.includes('@') && (text.includes('.edu') || text.includes('.com') || text.includes('.ac.bd'));
                        });
                    if (emailElement) email = emailElement.innerText.trim();
                }

                // Strategy 3: Regex match if still not found
                if (!email) {
                    const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                    if (emailMatch) email = emailMatch[0];
                }

                if (email) {
                    // IMPORTANT: Decode URL encoded characters (like %61 -> a)
                    try {
                        email = decodeURIComponent(email);
                        // Some LMS might encode twice or use weird formats
                        if (email.includes('%')) email = decodeURIComponent(email);
                    } catch (e) {
                        console.error("Decoding failed", e);
                    }

                    results.push({
                        name: profile.name.replace(/^[- \d]+/, '').trim(), // Clean up leading IDs/dashes
                        email: email.trim().toLowerCase()
                    });
                }
            } catch (err) {
                console.error(`Failed to fetch ${profile.url}`, err);
            }

            // Small delay to avoid hammering the server
            await new Promise(r => setTimeout(r, 300));
        }

        chrome.runtime.sendMessage({
            type: 'SCAN_COMPLETE',
            data: results
        });

    } catch (error) {
        chrome.runtime.sendMessage({
            type: 'SCAN_ERROR',
            error: error.message
        });
    } finally {
        isScanning = false;
    }
}
