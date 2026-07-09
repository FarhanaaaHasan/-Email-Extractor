document.addEventListener('DOMContentLoaded', () => {
    const setupView = document.getElementById('setup-view');
    const scanningView = document.getElementById('scanning-view');
    const resultsView = document.getElementById('results-view');

    const startBtn = document.getElementById('start-scan');
    const stopBtn = document.getElementById('stop-scan');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');

    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const progressCount = document.getElementById('progress-count');
    const totalFound = document.getElementById('total-found');

    let scannedData = [];

    startBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes('http')) {
            alert('Please navigate to your LMS website first.');
            return;
        }

        setupView.classList.add('hidden');
        scanningView.classList.remove('hidden');

        // Reset progress
        progressBar.style.width = '0%';
        progressCount.innerText = 'Initializing...';

        // Start scanning in the content script
        chrome.tabs.sendMessage(tab.id, { action: 'START_SCAN' }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script might not be loaded, inject it
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }, () => {
                    chrome.tabs.sendMessage(tab.id, { action: 'START_SCAN' });
                });
            }
        });
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SCAN_PROGRESS') {
            const { current, total, lastFound } = message;
            const percent = Math.round((current / total) * 100);
            progressBar.style.width = `${percent}%`;
            progressCount.innerText = `${current} / ${total} members processed`;
            statusText.innerText = lastFound ? `Found: ${lastFound}` : 'Scanning profiles...';
        }

        if (message.type === 'SCAN_COMPLETE') {
            scannedData = message.data;
            scanningView.classList.add('hidden');
            resultsView.classList.remove('hidden');
            totalFound.innerText = scannedData.length;
        }

        if (message.type === 'SCAN_ERROR') {
            alert('Error during scan: ' + message.error);
            resetUI();
        }
    });

    copyBtn.addEventListener('click', () => {
        // Only copy the email addresses, separated by commas for easy mailing
        const emailsOnly = scannedData.map(p => p.email).join(', ');
        navigator.clipboard.writeText(emailsOnly);
        copyBtn.innerText = 'Emails Copied!';
        setTimeout(() => copyBtn.innerHTML = '<span class="icon">📋</span> Copy List', 2000);
    });

    downloadBtn.addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8,Name,Email\n"
            + scannedData.map(p => `"${p.name}","${p.email}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lms_participants.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    resetBtn.addEventListener('click', resetUI);
    stopBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            chrome.tabs.sendMessage(tab.id, { action: 'STOP_SCAN' });
        });
        resetUI();
    });

    function resetUI() {
        resultsView.classList.add('hidden');
        scanningView.classList.add('hidden');
        setupView.classList.remove('hidden');
        scannedData = [];
    }
});
