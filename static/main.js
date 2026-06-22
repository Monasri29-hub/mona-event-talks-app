// State Management
let allReleases = [];
let selectedUpdate = null;
let currentTone = 'professional';
const activeHashtags = new Set(['#BigQuery', '#GoogleCloud']);

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const cacheDot = document.getElementById('cache-dot');
const cacheStatusText = document.getElementById('cache-status-text');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const notesContainer = document.getElementById('notes-container');
const resultsCount = document.getElementById('results-count');
const feedLoading = document.getElementById('feed-loading');
const feedError = document.getElementById('feed-error');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');

// Share Builder Elements
const shareEmpty = document.getElementById('share-empty');
const shareBuilder = document.getElementById('share-builder');
const builderTag = document.getElementById('builder-tag');
const builderDate = document.getElementById('builder-date');
const builderSourceText = document.getElementById('builder-source-text');
const toneButtons = document.querySelectorAll('.tone-btn');
const hashtagToggles = document.querySelectorAll('.hashtag-pill');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const limitWarning = document.getElementById('limit-warning');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const tweetBtn = document.getElementById('tweet-btn');
const actionToast = document.getElementById('action-toast');

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    fetchReleases(false);
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh feed
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    retryBtn.addEventListener('click', () => fetchReleases(true));
    
    // Search input
    searchInput.addEventListener('input', filterAndRenderReleases);
    
    // Filter type buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            filterAndRenderReleases();
        });
    });
    
    // Tone customizer
    toneButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toneButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentTone = e.currentTarget.dataset.tone;
            generateTweet();
        });
    });
    
    // Hashtags customizer
    hashtagToggles.forEach(label => {
        const checkbox = label.querySelector('input');
        label.addEventListener('click', (e) => {
            // Prevent double triggers since label clicks click the hidden checkbox
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            
            const value = checkbox.value;
            if (checkbox.checked) {
                label.classList.add('checked');
                activeHashtags.add(value);
            } else {
                label.classList.remove('checked');
                activeHashtags.delete(value);
            }
            generateTweet();
        });
    });
    
    // Manual text modification
    tweetTextarea.addEventListener('input', updateCharCount);
    
    // Actions
    copyTweetBtn.addEventListener('click', copyTweetToClipboard);
    tweetBtn.addEventListener('click', postTweetToX);
}

// Fetch Release Notes from Backend API
async function fetchReleases(force = false) {
    // UI Loading state
    feedLoading.classList.remove('hidden');
    feedError.classList.add('hidden');
    notesContainer.classList.add('hidden');
    refreshIcon.classList.add('rotating');
    refreshBtn.disabled = true;
    
    try {
        const response = await fetch(`/api/releases?force=${force}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        allReleases = data.releases || [];
        
        // Update Cache status display
        const lastFetchedDate = new Date(data.last_fetched * 1000);
        const formattedTime = lastFetchedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (data.cached) {
            cacheDot.className = 'status-dot cached';
            cacheStatusText.textContent = `Cached (Synced ${formattedTime})`;
        } else {
            cacheDot.className = 'status-dot active';
            cacheStatusText.textContent = `Live (Synced ${formattedTime})`;
        }
        
        filterAndRenderReleases();
        
    } catch (error) {
        console.error("Error loading releases:", error);
        errorMessage.textContent = error.message || "Failed to fetch release notes from BigQuery Feed.";
        feedError.classList.remove('hidden');
    } finally {
        feedLoading.classList.add('hidden');
        refreshIcon.classList.remove('rotating');
        refreshBtn.disabled = false;
    }
}

// Filter and Render Logic
function filterAndRenderReleases() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const selectedType = activeFilterBtn ? activeFilterBtn.dataset.type : 'all';
    
    notesContainer.innerHTML = '';
    let totalCount = 0;
    
    allReleases.forEach(release => {
        // Filter updates inside each entry date group
        const filteredUpdates = release.updates.filter(update => {
            // Type Match
            const updateType = update.type.toLowerCase();
            let matchesType = false;
            
            if (selectedType === 'all') {
                matchesType = true;
            } else if (selectedType === 'feature') {
                matchesType = updateType.includes('feature') || updateType.includes('new');
            } else if (selectedType === 'changed') {
                matchesType = updateType.includes('changed') || updateType.includes('modified') || updateType.includes('notice');
            } else if (selectedType === 'deprecated') {
                matchesType = updateType.includes('deprecated') || updateType.includes('removed');
            } else if (selectedType === 'other') {
                matchesType = !updateType.includes('feature') && !updateType.includes('new') && 
                              !updateType.includes('changed') && !updateType.includes('modified') && 
                              !updateType.includes('notice') && !updateType.includes('deprecated') && 
                              !updateType.includes('removed');
            }
            
            // Search Match
            const textMatchContent = update.text_content.toLowerCase();
            const textMatchType = update.type.toLowerCase();
            const matchesSearch = textMatchContent.includes(searchTerm) || textMatchType.includes(searchTerm);
            
            return matchesType && matchesSearch;
        });
        
        if (filteredUpdates.length > 0) {
            totalCount += filteredUpdates.length;
            
            // Create Date Group Container
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'date-group-header';
            groupHeader.textContent = release.date;
            dateGroup.appendChild(groupHeader);
            
            filteredUpdates.forEach(update => {
                const updateCard = document.createElement('div');
                updateCard.className = 'update-card';
                
                // Track selected state visually
                if (selectedUpdate && selectedUpdate.id === `${release.date}-${update.type}-${update.text_content.substring(0,20)}`) {
                    updateCard.classList.add('selected');
                }
                
                // Assign unique identifier for selection
                const updateId = `${release.date}-${update.type}-${update.text_content.substring(0,20)}`;
                
                // Map update types to styling class
                let tagClass = 'tag-other';
                const lowerType = update.type.toLowerCase();
                if (lowerType.includes('feature') || lowerType.includes('new')) {
                    tagClass = 'tag-feature';
                } else if (lowerType.includes('changed') || lowerType.includes('modified') || lowerType.includes('notice')) {
                    tagClass = 'tag-changed';
                } else if (lowerType.includes('deprecated') || lowerType.includes('removed')) {
                    tagClass = 'tag-deprecated';
                }
                
                updateCard.innerHTML = `
                    <div class="update-card-header">
                        <div class="update-card-meta">
                            <span class="tag ${tagClass}">${update.type}</span>
                            <span class="date-text">${release.date}</span>
                        </div>
                        <div class="update-select-indicator">
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div class="update-card-body">
                        ${update.content}
                    </div>
                `;
                
                // Card click event (Select update to share)
                updateCard.addEventListener('click', () => {
                    document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
                    updateCard.classList.add('selected');
                    
                    selectedUpdate = {
                        id: updateId,
                        date: release.date,
                        type: update.type,
                        link: release.link,
                        text: update.text_content
                    };
                    
                    activateShareBuilder();
                });
                
                dateGroup.appendChild(updateCard);
            });
            
            notesContainer.appendChild(dateGroup);
        }
    });
    
    resultsCount.textContent = `${totalCount} update${totalCount !== 1 ? 's' : ''}`;
    
    if (totalCount === 0) {
        notesContainer.innerHTML = `
            <div class="error-state">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>No Updates Found</h3>
                <p>No release notes matched your active filters or search terms.</p>
            </div>
        `;
    }
    
    notesContainer.classList.remove('hidden');
}

// Share Builder Activation
function activateShareBuilder() {
    if (!selectedUpdate) return;
    
    // Hide empty state, show builder
    shareEmpty.classList.add('hidden');
    shareBuilder.classList.remove('hidden');
    
    // Populate preview details
    builderDate.textContent = selectedUpdate.date;
    builderTag.textContent = selectedUpdate.type;
    
    // Apply tag style
    builderTag.className = 'tag';
    const lowerType = selectedUpdate.type.toLowerCase();
    if (lowerType.includes('feature') || lowerType.includes('new')) {
        builderTag.classList.add('tag-feature');
    } else if (lowerType.includes('changed') || lowerType.includes('modified') || lowerType.includes('notice')) {
        builderTag.classList.add('tag-changed');
    } else if (lowerType.includes('deprecated') || lowerType.includes('removed')) {
        builderTag.classList.add('tag-deprecated');
    } else {
        builderTag.classList.add('tag-other');
    }
    
    // Source text snippet
    builderSourceText.textContent = selectedUpdate.text;
    
    // Build the tweet draft
    generateTweet();
}

// Generate Tweet Draft Based on Option Settings
function generateTweet() {
    if (!selectedUpdate) return;
    
    const maxTweetLength = 280;
    const typeLabel = selectedUpdate.type.toUpperCase();
    const cleanText = selectedUpdate.text.trim();
    const sourceLink = selectedUpdate.link;
    
    // Get active hashtag string
    const hashtagString = Array.from(activeHashtags).join(' ');
    
    // Base templates by tone
    let tweetDraft = "";
    
    if (currentTone === 'professional') {
        tweetDraft = `Google Cloud BigQuery Update (${selectedUpdate.date}) 🚀\n\n[TEXT]\n\nDetails here: ${sourceLink}\n\n${hashtagString}`;
    } else if (currentTone === 'excited') {
        tweetDraft = `Check out this cool new BigQuery update! 🔥\n\n[TEXT]\n\nRead more details in the docs: ${sourceLink}\n\n${hashtagString}`;
    } else if (currentTone === 'analytical') {
        tweetDraft = `BigQuery Update Analysis 📊\nType: ${typeLabel}\n\n[TEXT]\n\nLink to official release: ${sourceLink}\n\n${hashtagString}`;
    } else if (currentTone === 'minimal') {
        tweetDraft = `BigQuery: [TEXT] ${sourceLink} ${hashtagString}`;
    }
    
    // Calculate space remaining for text
    const placeholderLength = "[TEXT]".length;
    const structureLength = tweetDraft.length - placeholderLength;
    const availableTextLength = maxTweetLength - structureLength;
    
    let processedText = cleanText;
    
    // Intelligent truncation of the body text if it overflows the limit
    if (processedText.length > availableTextLength) {
        // Keep some padding for ellipsis
        processedText = processedText.substring(0, availableTextLength - 4).trim() + "...";
    }
    
    // Assemble final output
    const finalTweet = tweetDraft.replace('[TEXT]', processedText);
    
    // Update text area
    tweetTextarea.value = finalTweet;
    updateCharCount();
}

// Update Character count UI
function updateCharCount() {
    const textLength = tweetTextarea.value.length;
    charCounter.textContent = `${textLength} / 280`;
    
    if (textLength > 280) {
        charCounter.style.color = 'var(--color-deprecated)';
        limitWarning.classList.remove('hidden');
    } else {
        charCounter.style.color = 'var(--text-muted)';
        limitWarning.classList.add('hidden');
    }
}

// Clipboard Copy Operation
async function copyTweetToClipboard() {
    const text = tweetTextarea.value;
    try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!");
    } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback method
        tweetTextarea.select();
        document.execCommand('copy');
        showToast("Copied to clipboard!");
    }
}

// Open Twitter Intent Dialog
function postTweetToX() {
    const text = encodeURIComponent(tweetTextarea.value);
    const xUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
}

// Utility Toast Alert
function showToast(message) {
    actionToast.textContent = message;
    actionToast.classList.remove('hidden');
    actionToast.style.opacity = '1';
    
    setTimeout(() => {
        actionToast.style.opacity = '0';
        setTimeout(() => {
            actionToast.classList.add('hidden');
        }, 300);
    }, 2000);
}
