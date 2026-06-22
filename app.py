import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache
cache = {
    "data": None,
    "last_fetched": 0
}
CACHE_DURATION_SECS = 300  # 5 minutes cache

def parse_html_content(html_content):
    if not html_content:
        return []
        
    soup = BeautifulSoup(html_content, 'html.parser')
    updates = []
    
    current_type = "Update"
    current_blocks = []
    
    # Get all direct children elements
    elements = soup.find_all(recursive=False)
    for element in elements:
        if element.name == 'h3':
            # Save previous update if it has content
            if current_blocks:
                updates.append({
                    "type": current_type,
                    "content": "".join(str(b) for b in current_blocks),
                    "text_content": "".join(b.get_text() for b in current_blocks).strip()
                })
                current_blocks = []
            current_type = element.get_text().strip()
        else:
            current_blocks.append(element)
            
    # Append the last update
    if current_blocks:
        updates.append({
            "type": current_type,
            "content": "".join(str(b) for b in current_blocks),
            "text_content": "".join(b.get_text() for b in current_blocks).strip()
        })
        
    # Fallback if no structured updates were parsed but HTML content is not empty
    if not updates and html_content.strip():
        updates.append({
            "type": "Update",
            "content": html_content,
            "text_content": soup.get_text().strip()
        })
        
    return updates

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        xml_data = response.content
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return None

    # Parse XML
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return None

    entries = []
    for entry in root.findall('atom:entry', namespaces):
        title = entry.find('atom:title', namespaces)
        title_text = title.text if title is not None else "Unknown Date"
        
        updated = entry.find('atom:updated', namespaces)
        updated_text = updated.text if updated is not None else ""
        
        link = entry.find('atom:link', namespaces)
        link_href = link.attrib.get('href', '') if link is not None else ""
        
        content = entry.find('atom:content', namespaces)
        content_html = content.text if content is not None else ""
        
        sub_updates = parse_html_content(content_html)
        
        entries.append({
            "date": title_text,
            "updated": updated_text,
            "link": link_href,
            "updates": sub_updates
        })
        
    return entries

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    force_refresh = request.args.get("force", "false").lower() == "true"
    current_time = time.time()
    
    if force_refresh or not cache["data"] or (current_time - cache["last_fetched"] > CACHE_DURATION_SECS):
        data = fetch_and_parse_feed()
        if data is not None:
            cache["data"] = data
            cache["last_fetched"] = current_time
        elif not cache["data"]:
            return jsonify({"error": "Failed to fetch release notes and no cached data available"}), 500
            
    return jsonify({
        "releases": cache["data"],
        "last_fetched": cache["last_fetched"],
        "cached": not force_refresh and (current_time - cache["last_fetched"] <= CACHE_DURATION_SECS)
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
