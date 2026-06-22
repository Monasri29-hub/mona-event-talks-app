# 📊 BigQuery Release Notes Share Dashboard

A premium, modern web application built using **Python Flask** and vanilla **HTML, CSS, and JavaScript** that fetches the official Google Cloud BigQuery release notes XML feed, parses the contents into segmented interactive cards, and lets you custom-draft and post updates to X (formerly Twitter) in one click.

---

## ✨ Features

- 🔄 **Live Atom Feed Parsing**: Automatically fetches and parses Google's raw XML release feed dynamically.
- 🧩 **BeautifulSoup Segmentation**: Intelligently decomposes date-based entry feeds into distinct, single-topic updates (e.g. separates individual *Features*, *Changes*, and *Deprecations* under a single date block) so you can interact with them individually.
- ⚡ **Performance Caching**: Features a 5-minute in-memory caching mechanism to optimize feed requests and ensure sub-second page loads.
- 🎨 **Premium Glassmorphic UI**: High-end dark mode layout styled with raw Vanilla CSS, featuring custom HSL colors, responsive design, smooth hover cards, and background glow decor.
- 🔍 **Live Search & Filters**: Search through updates in real-time or filter them instantly by type (Features, Changes, Deprecations).
- 🐦 **Mock X/Twitter Card & Builder**:
  - Toggles active hashtags (`#BigQuery`, `#GoogleCloud`, `#GCP`, `#DataEngineering`).
  - Crafts different post tones dynamically (💼 *Tech Pro*, ⚡ *Enthusiastic*, 📊 *Analytical*, ✏️ *Minimal*).
  - Smart Truncation: Auto-calculates character remaining counts and truncates the body text to precisely stay under X's **280-character limit** without breaking hashtags or links.
- 📋 **One-Click Actions**: Single-click buttons to copy the generated text to the clipboard or open the Web Intent tweet scheduler.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.14+ (Flask)
- **XML/HTML Parsing**: Beautiful Soup 4, XML ElementTree, Requests
- **Frontend**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3
- **Design & Typography**: Google Fonts (Plus Jakarta Sans, JetBrains Mono)

---

## 📂 Project Structure

```text
├── static/
│   ├── main.js        # Frontend state management, filters, and Tweet builders
│   └── style.css      # Custom HSL variables, glassmorphic card stylings, and animations
├── templates/
│   └── index.html     # HTML structure with modern layouts and responsive columns
├── .gitignore         # Configured Python and IDE git exclusions
├── app.py             # Flask application entry point with caching and feed services
├── README.md          # Project documentation (this file)
└── requirements.txt   # Declared Python dependencies
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Python 3.8+** and `pip` installed.

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/Monasri29-hub/mona-event-talks-app.git
cd mona-event-talks-app
pip install -r requirements.txt
```

### 2. Launch the Application
Run the Flask development server:
```bash
python app.py
```

### 3. Open in Browser
Visit **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your preferred browser.

---

## 🔒 License
Distributed under the MIT License. See `LICENSE` (if created) for more information.
