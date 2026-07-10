#   Email Extractor

A powerful, modern Chrome Extension designed to help  quickly collect email addresses.
##  Key Features
- **Smart Extraction:** Automatically identifies participant profile links.
- **Multi-Strategy Scraping:** Uses three different methods (mailto links, selector matching, and Regex) to ensure no email is missed.
- **Progress Tracking:** Real-time progress bar and status updates while scanning.
- **Easy Export:** Copy all emails to your clipboard or download them as a professional CSV file.
- **Premium Design:** Beautiful, glassmorphic UI built with modern CSS and Google Fonts (Outfit).

##  Installation & Usage

### 1. Download the Project
Clone this repository or download it as a ZIP file and extract it.

### 2. Open Chrome Extensions
- Open Google Chrome.
- Go to `chrome://extensions/`.
- Turn on **Developer mode** (top-right corner).

### 3. Load the Extension
- Click **Load unpacked**.
- Select the project folder containing the extension files.
- The extension will now appear in your Chrome toolbar.

### 4. Use the Extension
1. Open the LMS page that contains the list of participants.
2. Click the **Email Extractor** extension icon.
3. Click **Start Scanning**.
4. Wait for the scan to finish.
5. Copy the extracted email addresses or download them as a CSV file.



| File | Description |
| :--- | :--- |
| `manifest.json` | The "**brain**" of the extension. It tells Chrome what the extension is, what permissions it needs (like accessing tabs), and which files to use. |
| `content.js` | The "**worker**" script. It runs directly on the LMS webpage to find links to student profiles and scan them for email addresses using background fetching. |
| `popup.html` | The "**skeleton**" of the extension's UI. It defines the layout, buttons, and views (Setup, Scanning, and Results). |
| `popup.css` | The "**skin**" of the extension. It provides the premium look using glassmorphism effects, smooth animations, and a modern color palette. |
| `popup.js` | The "**nervous system**". It handles button clicks, talks to the worker script (`content.js`), and manages the downloading/copying of data. |
| `icons/` | Contains the icons that appear in the Chrome toolbar. |

##  How It Works

1.  **Detection:** When you click "Start Scanning", the UI asks the background worker to start looking for students.
2.  **Mapping:** The extension finds every link on the page that looks like a student profile (Moodle, Canvas, etc.).
3.  **Extraction:** It visits each profile link in the "background" (you don't see it happening) and searches for an email using three layers of logic:
    -   Looking for `mailto:` links.
    -   Looking for specific HTML labels (like "Email").
    -   Using a **Regex** (Regular Expression) to find text that matches the pattern of an email address.
4.  **Reporting:** You see a live progress bar as it works through the list.
5.  **Completion:** Once finished, you can copy the list for Messenger groups or download a **CSV** (Excel file) for your records.

##  Technical Details
- **Version:** Manifest V3 (Latest Chrome standard).
- **Core Tech:** HTML5, CSS3, Vanilla JavaScript (No heavy libraries, making it lightning fast).
- **Security:** Requires minimal permissions (`activeTab`) to protect user privacy.

---

