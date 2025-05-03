// background.js (Right-click menu "Send to New Chat" added + Send Sentient Button)

// --- Variables ---
let sentientPopupId = null;
const sentientBaseUrl = "https://chat.sentient.xyz/";
const sentientChatUrlPattern = "https://chat.sentient.xyz/c/";
const defaultPopupState = { width: 450, height: 700, top: 10, left: 10 };
let pendingPasteInfo = null; // { windowId: number, tabId: number | null }
let menuCounter = 0; // Global counter to ensure unique IDs even when called in quick succession
let activeMenuItems = []; // Track active menu items

// Force create context menu on startup
chrome.runtime.onStartup.addListener(() => {
    console.log("Extension starting up, creating context menus...");
    // Force reset any stuck flags
    resetContextMenuFlag();
    // Load settings and setup context menus
    chrome.storage.sync.get({
        showContextMenu: true,
        showSummarize: true,
        showExplain: true,
        showNewChat: true,
        showSendSentient: true,
        customCommands: [],
        selectedLanguage: ''
    }, function(items) {
        console.log("Startup settings loaded:", items);
        if (items.showContextMenu) {
            // Force create menus with a small delay to ensure browser is ready
            setTimeout(() => {
                forceCreateContextMenus();
            }, 1000);
        }
    });
});

// Function to force create context menus regardless of flag state
function forceCreateContextMenus() {
    console.log("Force creating context menus...");
    // Reset flag first
    resetContextMenuFlag();
    // Then create menus
    setupContextMenus();
}

// --- Setup/Update ---
chrome.runtime.onInstalled.addListener((details) => {
    console.log(`Extension ${details.reason}.`);
    
    // Force reset any stuck flags
    resetContextMenuFlag();
    
    // Load settings and setup context menus
    chrome.storage.sync.get({
        showContextMenu: true,
        showSummarize: true,
        showExplain: true,
        showNewChat: true,
        showSendSentient: true,
        customCommands: [],
        selectedLanguage: ''
    }, function(items) {
        console.log("Initial settings loaded:", items);
        if (items.showContextMenu) {
            // Force create menus with a small delay to ensure browser is ready
            setTimeout(() => {
                forceCreateContextMenus();
            }, 1000);
        }
        
        // Open options page when extension is installed or updated
        if (details.reason === "install" || details.reason === "update") {
            console.log("Opening options page after install/update");
            chrome.runtime.openOptionsPage();
        }
    });
});

// Listen for storage changes to update context menus when settings change
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        console.log("Storage changes detected:", changes);
        
        // Get all current settings to make a decision
        chrome.storage.sync.get({
            showContextMenu: true,
            showSummarize: true,
            showExplain: true,
            showNewChat: true,
            showSendSentient: true,
            customCommands: [],
            selectedLanguage: ''
        }, function(items) {
            console.log("Current settings:", items);
            
            // If context menu setting changed
            if (changes.showContextMenu) {
                console.log("Context menu setting changed:", changes.showContextMenu.newValue);
                
                if (changes.showContextMenu.newValue) {
                    // If enabled, setup context menus
                    setupContextMenus();
                } else {
                    // If disabled, remove all context menus
                    removeAllContextMenus(() => {
                        console.log("Context menus removed due to setting change.");
                    });
                }
            } 
            // If any feature setting changed or custom commands changed or language changed
            else if (changes.showSummarize || changes.showExplain || changes.showNewChat || 
                     changes.showSendSentient || changes.customCommands || changes.selectedLanguage) {
                
                console.log("Feature settings, custom commands, or language changed");
                
                // Only update if context menu is enabled
                if (items.showContextMenu) {
                    setupContextMenus();
                }
            }
        });
    }
});

// --- Improved Context Menu Management ---

// Global flag to prevent multiple simultaneous context menu operations
let isUpdatingContextMenus = false;

// Safety timeout to reset the flag if it gets stuck
function resetContextMenuFlag() {
    console.log("Force resetting isUpdatingContextMenus flag");
    isUpdatingContextMenus = false;
}

// Function to safely remove all context menus with verification
function removeAllContextMenus(callback) {
    // If already updating, queue the operation
    if (isUpdatingContextMenus) {
        console.log("Context menu update already in progress, queueing this operation");
        setTimeout(() => removeAllContextMenus(callback), 500);
        return;
    }
    
    // Set flag to prevent concurrent operations
    isUpdatingContextMenus = true;
    
    // Clear our tracking array first
    activeMenuItems = [];
    
    // Then remove all context menus
    chrome.contextMenus.removeAll(() => {
        console.log("All context menus removed successfully");
        
        // Verify removal by trying to get all context menus (only works in Chrome MV3)
        try {
            chrome.contextMenus.getAll((menuItems) => {
                if (menuItems && menuItems.length > 0) {
                    console.warn(`${menuItems.length} menu items still exist after removeAll. Retrying...`);
                    // If items still exist, try again after a longer delay
                    setTimeout(() => {
                        chrome.contextMenus.removeAll(() => {
                            console.log("Second attempt to remove all context menus completed");
                            isUpdatingContextMenus = false;
                            if (callback) callback();
                        });
                    }, 500);
                } else {
                    console.log("Verified all context menus are removed");
                    isUpdatingContextMenus = false;
                    if (callback) callback();
                }
            });
        } catch (error) {
            // If getAll is not supported, just assume it worked
            console.log("Could not verify menu removal, assuming success");
            isUpdatingContextMenus = false;
            if (callback) callback();
        }
    });
}

// --- Right-click Menu Setup ---
// *** FIXED: Completely redesigned to prevent duplicate ID errors and ensure reliable menu management ***
function setupContextMenus() {
    console.log("Setting up context menus...");
    
    // Force reset the flag if it's been set for more than 10 seconds
    // This prevents the flag from getting permanently stuck
    if (isUpdatingContextMenus) {
        console.log("Context menu update flag is already set, checking if it's stuck...");
        resetContextMenuFlag();
    }
    
    // Set flag to prevent concurrent operations
    isUpdatingContextMenus = true;
    
    // Set a safety timeout to reset the flag after 10 seconds no matter what
    const safetyTimeout = setTimeout(() => {
        console.log("Safety timeout triggered - resetting context menu flag");
        isUpdatingContextMenus = false;
    }, 10000);
    
    try {
        // First remove all existing context menus to prevent duplicates
        chrome.contextMenus.removeAll(() => {
            console.log("Previous right-click menus removed, creating new menus...");
            
            // Get all settings to determine which menu items to create
            chrome.storage.sync.get({
                showContextMenu: true,
                showSummarize: true,
                showExplain: true,
                showNewChat: true,
                showSendSentient: true,
                customCommands: [],
                selectedLanguage: ''
            }, function(items) {
                console.log("Creating menus with settings:", items);
                
                // If context menu is disabled, don't create any menus
                if (!items.showContextMenu) {
                    console.log("Context menu is disabled, not creating any menus");
                    clearTimeout(safetyTimeout);
                    isUpdatingContextMenus = false;
                    return;
                }
                
                // Create a queue of menu items to create
                const menuItemsToCreate = [];
                
                // Add standard menu items based on settings with consistent IDs
                if (items.showSummarize) {
                    menuItemsToCreate.push({
                        id: 'sum',
                        title: "Summarize with AI",
                        contexts: ["selection"]
                    });
                }
                
                if (items.showExplain) {
                    menuItemsToCreate.push({
                        id: 'exp',
                        title: "Explain with AI",
                        contexts: ["selection"]
                    });
                }
                
                if (items.showNewChat) {
                    menuItemsToCreate.push({
                        id: 'newchat',
                        title: "Send Selection to New Chat",
                        contexts: ["selection"]
                    });
                }
                
                if (items.showSendSentient) {
                    menuItemsToCreate.push({
                        id: 'send',
                        title: "Send Text",
                        contexts: ["selection"]
                    });
                }
                
                // Add custom command menu items with consistent IDs
                if (items.customCommands && items.customCommands.length > 0) {
                    items.customCommands.forEach((command, index) => {
                        // Completely remove <selectedtext> placeholder instead of replacing it
                        const displayTitle = command.replace(/<selectedtext>/g, "");
                        
                        menuItemsToCreate.push({
                            id: `custom_${index}`,
                            title: displayTitle,
                            contexts: ["selection"]
                        });
                    });
                }
                
                // Add translation option if language is selected
                if (items.selectedLanguage) {
                    let translationTitle = "";
                    if (items.selectedLanguage === "Turkish") {
                        translationTitle = "Türkçeye çevir";
                    } else {
                        translationTitle = `Translate to ${items.selectedLanguage}`;
                    }
                    
                    menuItemsToCreate.push({
                        id: 'translate',
                        title: translationTitle,
                        contexts: ["selection"]
                    });
                }
                
                console.log(`Creating ${menuItemsToCreate.length} menu items`);
                
                // If no menu items to create, we're done
                if (menuItemsToCreate.length === 0) {
                    console.log("No menu items to create");
                    clearTimeout(safetyTimeout);
                    isUpdatingContextMenus = false;
                    return;
                }
                
                let createdCount = 0;
                const totalCount = menuItemsToCreate.length;
                
                // Create all menu items immediately
                for (const menuItem of menuItemsToCreate) {
                    try {
                        chrome.contextMenus.create(menuItem, () => {
                            if (chrome.runtime.lastError) {
                                console.error(`Error creating menu item ${menuItem.title}:`, chrome.runtime.lastError);
                            } else {
                                console.log(`Created menu item: ${menuItem.title} with ID: ${menuItem.id}`);
                                // Track successfully created menu items
                                activeMenuItems.push(menuItem.id);
                            }
                            
                            // Count created items and reset flag when all are done
                            createdCount++;
                            if (createdCount >= totalCount) {
                                console.log("All menu items created, resetting flag");
                                clearTimeout(safetyTimeout);
                                isUpdatingContextMenus = false;
                            }
                        });
                    } catch (error) {
                        console.error(`Exception creating menu item ${menuItem.title}:`, error);
                        createdCount++;
                        if (createdCount >= totalCount) {
                            console.log("All menu items processed (with some errors), resetting flag");
                            clearTimeout(safetyTimeout);
                            isUpdatingContextMenus = false;
                        }
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error in setupContextMenus:", error);
        clearTimeout(safetyTimeout);
        isUpdatingContextMenus = false;
    }
}

// --- Event Listeners ---

// Extension Icon Click
chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked.");
    openSentientPopup({ requestPaste: false, source: 'manual' });
});

// Context Menu Click Handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const menuId = info.menuItemId;
    const selectedText = info.selectionText;
    
    console.log(`Context menu clicked: ${menuId}`);
    
    // Handle based on menu ID prefix
    if (menuId.startsWith('sum_')) {
        console.log("Summarize option clicked");
        // Handle summarize action
    } else if (menuId.startsWith('exp_')) {
        console.log("Explain option clicked");
        // Handle explain action
    } else if (menuId.startsWith('newchat_')) {
        console.log("New chat option clicked");
        // Handle new chat action
    } else if (menuId.startsWith('send_')) {
        console.log("Send text option clicked");
        // Handle send text action
    } else if (menuId.startsWith('custom_')) {
        console.log("Custom command clicked");
        // Handle custom command
    } else if (menuId.startsWith('translate_')) {
        console.log("Translate option clicked");
        // Handle translation
    }
});

// Add clipboard access handler for content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background: Message received:", message.action);
    
    switch (message.action) {
        case "getClipboardContent":
            console.log("Background: Received clipboard content request from tab", sender.tab?.id);
            
            // Use a more reliable method to read clipboard
            try {
                // Background scripts cannot access document or DOM directly
                // Only try navigator.clipboard API which is available in background context
                if (navigator.clipboard && navigator.clipboard.readText) {
                    console.log("Background: Trying navigator.clipboard API");
                    
                    // Set a timeout to ensure we don't hang indefinitely
                    const timeoutId = setTimeout(() => {
                        console.warn("Background: Clipboard read timeout");
                        sendResponse({ 
                            success: false, 
                            error: "Clipboard read timeout", 
                            fallbackNeeded: true 
                        });
                    }, 2000);
                    
                    navigator.clipboard.readText()
                        .then(text => {
                            clearTimeout(timeoutId);
                            console.log("Background: Clipboard read success:", text ? text.substring(0, 20) + "..." : "empty");
                            sendResponse({ success: true, text: text || "" });
                        })
                        .catch(err => {
                            clearTimeout(timeoutId);
                            console.error("Background: Clipboard read error:", err);
                            sendResponse({ 
                                success: false, 
                                error: err.message, 
                                fallbackNeeded: true 
                            });
                        });
                    
                    return true; // Indicate async response
                } else {
                    console.warn("Background: navigator.clipboard.readText not available");
                    sendResponse({ 
                        success: false, 
                        error: "Clipboard API not available", 
                        fallbackNeeded: true 
                    });
                }
            } catch (error) {
                console.error("Background: Error accessing clipboard:", error);
                sendResponse({ 
                    success: false, 
                    error: error.message, 
                    fallbackNeeded: true 
                });
            }
            break;
            
        case "openSentientPopup":
            console.log("Background: Received popup open request");
            openSentientPopup({ requestPaste: false, source: 'manual' });
            sendResponse({ status: "Popup open request received" });
            break;
            
        case "processStCommand":
            console.log("Background: Received /st command:", message.query);
            
            // Copy the query to clipboard
            copyToClipboardAndThen(message.query, sender.tab?.id, () => {
                // Then open popup and paste
                openSentientPopup({ requestPaste: true, source: 'command' });
            });
            
            sendResponse({ status: "/st command received" });
            break;
            
        case "processSelectionAction":
            console.log(`Background: Received selection action (${message.type}):`, message.text?.substring(0, 20) + "...");
            
            const senderTabId2 = sender.tab?.id;
            let textToSend = "";
            let source = 'context'; // Default to current chat
            
            // Process based on action type
            switch (message.type) {
                case "summarize":
                    textToSend = `${message.text.trim()},Summarize`;
                    // Check if popup is already open
                    if (sentientPopupId) {
                        source = 'context'; // Use current chat if popup is open
                    } else {
                        source = 'context_new'; // Open new chat if popup is not open
                    }
                    break;
                case "explain":
                    textToSend = `${message.text.trim()},Explain`;
                    // Check if popup is already open
                    if (sentientPopupId) {
                        source = 'context'; // Use current chat if popup is open
                    } else {
                        source = 'context_new'; // Open new chat if popup is not open
                    }
                    break;
                case "newchat":
                    textToSend = message.text.trim(); // No prefix
                    source = 'context_new'; // Force new chat
                    break;
                case "sendsentient":
                    textToSend = message.text.trim(); // No prefix
                    // Check if popup is already open
                    if (sentientPopupId) {
                        source = 'context'; // Use current chat if popup is open
                    } else {
                        source = 'context_new'; // Open new chat if popup is not open
                    }
                    break;
                case "custom":
                    // Check if command contains <selectedtext> placeholder
                    if (message.command && message.command.includes('<selectedtext>')) {
                        // Replace placeholder with selected text
                        textToSend = message.command.replace(/<selectedtext>/g, message.text.trim());
                    } else {
                        // Format text without quotes
                        textToSend = `${message.text.trim()},${message.command}`;
                    }
                    // Check if popup is already open
                    if (sentientPopupId) {
                        source = 'context'; // Use current chat if popup is open
                    } else {
                        source = 'context_new'; // Open new chat if popup is not open
                    }
                    break;
                case "translate":
                    textToSend = message.text.trim(); // Keep the text with translation instruction
                    // Check if popup is already open
                    if (sentientPopupId) {
                        source = 'context'; // Use current chat if popup is open
                    } else {
                        source = 'context_new'; // Open new chat if popup is not open
                    }
                    break;
                default:
                    console.warn("Unknown selection action type:", message.type);
                    sendResponse({ status: "Error: Unknown action type" });
                    return false;
            }
            
            copyToClipboardAndThen(textToSend, senderTabId2, () => {
                console.log(`Selection action (${message.type}): Requesting popup open/focus AND paste.`);
                if (message.type === "translate") {
                    console.log(`Translation requested. Popup status: ${sentientPopupId ? 'open' : 'closed'}`);
                    if (sentientPopupId) {
                        console.log("Popup is already open, using existing chat for translation.");
                        openSentientPopup({ requestPaste: true, source: 'context' });
                    } else {
                        console.log("Popup is not open, creating new chat for translation.");
                        openSentientPopup({ requestPaste: true, source: 'context_new' });
                    }
                } else {
                    openSentientPopup({ requestPaste: true, source: source });
                }
            });
            sendResponse({ status: "Selection action request received, trying copy/open" });
            return true; // Asynchronous
            
        case "pasteClipboardContentOnFocus": // /st space paste
            console.log("Background: Paste request received from content.js.");
            if (sentientPopupId) {
                chrome.windows.get(sentientPopupId, { populate: true }, (existingWindow) => {
                    if (chrome.runtime.lastError || !existingWindow) { console.warn(`Popup ID (${sentientPopupId}) not found/error.`); sentientPopupId = null; return; }
                    const activeTab = existingWindow.tabs?.find(t => t.active);
                    if (activeTab?.id) {
                        console.log(`Background: Forwarding paste request to popup (${sentientPopupId}), tab (${activeTab.id}).`);
                        chrome.tabs.sendMessage(activeTab.id, { action: "pasteClipboardContent" });
                    } else { console.warn("Active popup tab not found."); }
                });
            } else { console.log("Popup not open, /st space paste not processed."); }
            sendResponse({ status: "Paste request being processed." });
            break;

        default:
            console.log("Unknown message action:", message.action);
            sendResponse({ status: "Unknown action" });
            return false;
    }
    
    return true; // Indicate async response
});

// --- Helper Functions ---

// Function to copy text to clipboard and then execute a callback
function copyToClipboardAndThen(text, senderTabId, callback) {
    console.log("Copying to clipboard:", text ? text.substring(0, 20) + "..." : "empty");
    
    // Use navigator.clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log("Clipboard write success");
                if (callback) callback();
            })
            .catch(err => {
                console.error("Clipboard write error:", err);
                // Try fallback method
                console.log("Trying fallback clipboard method...");
                copyToClipboardFallback(text, senderTabId, callback);
            });
    } else {
        console.warn("navigator.clipboard.writeText not available");
        // Use fallback method
        copyToClipboardFallback(text, senderTabId, callback);
    }
}

// Fallback method for copying to clipboard
function copyToClipboardFallback(text, senderTabId, callback) {
    console.log("Using clipboard fallback method");
    
    // Store the text in local storage for the content script to access
    chrome.storage.local.set({ 'clipboardText': text }, function() {
        if (chrome.runtime.lastError) {
            console.error("Error storing clipboard text:", chrome.runtime.lastError);
            if (callback) callback(); // Still try to continue
            return;
        }
        
        console.log("Text stored in local storage for clipboard access");
        
        // If we have a sender tab ID, try to use it to copy via content script
        if (senderTabId) {
            try {
                chrome.tabs.sendMessage(senderTabId, { action: "copyToClipboard", text: text }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Error sending copy message to tab:", chrome.runtime.lastError);
                    } else {
                        console.log("Copy message sent to tab, response:", response);
                    }
                    if (callback) callback(); // Continue regardless
                });
            } catch (error) {
                console.error("Error sending message to tab:", error);
                if (callback) callback(); // Still try to continue
            }
        } else {
            console.log("No sender tab ID available for content script clipboard access");
            if (callback) callback(); // Continue anyway
        }
    });
}

// Function to open Sentient popup
function openSentientPopup(options = { requestPaste: false, source: 'manual' }) {
    console.log(`Opening Sentient popup (paste: ${options.requestPaste}, source: ${options.source})`);
    
    // Check if popup is already open
    if (sentientPopupId) {
        console.log(`Popup already open (${sentientPopupId}), focusing...`);
        
        chrome.windows.get(sentientPopupId, { populate: true }, (existingWindow) => {
            if (chrome.runtime.lastError || !existingWindow) {
                console.warn(`Popup ID (${sentientPopupId}) not found/error:`, chrome.runtime.lastError?.message || "Window not found");
                sentientPopupId = null;
                // Reopen popup since the ID is invalid
                createNewPopup(options);
                return;
            }
            
            // Focus the existing window
            chrome.windows.update(sentientPopupId, { focused: true }, (updatedWindow) => {
                if (chrome.runtime.lastError) {
                    console.warn("Error focusing popup:", chrome.runtime.lastError);
                    // Try to reopen if focus fails
                    sentientPopupId = null;
                    createNewPopup(options);
                    return;
                }
                
                console.log("Existing popup focused");
                
                // If paste is requested, send message to active tab in popup
                if (options.requestPaste) {
                    const activeTab = existingWindow.tabs?.find(t => t.active);
                    if (activeTab?.id) {
                        console.log(`Sending paste request to popup tab (${activeTab.id})`);
                        
                        // Set a small delay to ensure window is focused before paste
                        setTimeout(() => {
                            chrome.tabs.sendMessage(activeTab.id, { action: "pasteClipboardContent" }, (response) => {
                                if (chrome.runtime.lastError) {
                                    console.warn("Error sending paste message:", chrome.runtime.lastError);
                                } else {
                                    console.log("Paste message sent, response:", response);
                                }
                            });
                        }, 300);
                    } else {
                        console.warn("No active tab found in popup");
                    }
                }
            });
        });
    } else {
        console.log("No existing popup, creating new one...");
        createNewPopup(options);
    }
}

// Function to create a new popup window
function createNewPopup(options) {
    console.log("Creating new popup window...");
    
    // Determine URL based on source
    let popupUrl = sentientBaseUrl;
    if (options.source === 'context_new') {
        popupUrl = sentientBaseUrl + "?new=1"; // Force new chat
    }
    
    // Create popup window
    chrome.windows.create({
        url: popupUrl,
        type: 'popup',
        width: defaultPopupState.width,
        height: defaultPopupState.height,
        top: defaultPopupState.top,
        left: defaultPopupState.left
    }, (newWindow) => {
        if (chrome.runtime.lastError || !newWindow) {
            console.error("Error creating popup:", chrome.runtime.lastError?.message || "Window creation failed");
            return;
        }
        
        console.log(`New popup created with ID: ${newWindow.id}`);
        sentientPopupId = newWindow.id;
        
        // If paste is requested, store the info for later
        if (options.requestPaste && newWindow.tabs && newWindow.tabs[0]) {
            console.log(`Storing paste request for tab: ${newWindow.tabs[0].id}`);
            pendingPasteInfo = {
                windowId: newWindow.id,
                tabId: newWindow.tabs[0].id
            };
            
            // Set up listener for tab updates to detect when page is loaded
            chrome.tabs.onUpdated.addListener(function pasteOnLoad(tabId, changeInfo, tab) {
                // Check if this is our tab and it's done loading
                if (pendingPasteInfo && tabId === pendingPasteInfo.tabId && changeInfo.status === 'complete') {
                    console.log(`Tab ${tabId} loaded, attempting paste...`);
                    
                    // Set a small delay to ensure page is fully initialized
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, { action: "pasteClipboardContent" }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.warn("Error sending paste message:", chrome.runtime.lastError);
                            } else {
                                console.log("Paste message sent, response:", response);
                            }
                            
                            // Clear pending paste info
                            pendingPasteInfo = null;
                            
                            // Remove this listener
                            chrome.tabs.onUpdated.removeListener(pasteOnLoad);
                        });
                    }, 1000);
                }
            });
        }
    });
}

// Track popup window closure
chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === sentientPopupId) {
        console.log(`Popup window (${windowId}) closed`);
        sentientPopupId = null;
        pendingPasteInfo = null;
    }
});

// --- Omnibox Integration ---
chrome.omnibox.onInputEntered.addListener((text) => {
    console.log("Omnibox command entered:", text);
    
    // Copy text to clipboard
    copyToClipboardAndThen(text, null, () => {
        // Open popup and paste
        openSentientPopup({ requestPaste: true, source: 'omnibox' });
    });
});

// Set default suggestion
chrome.omnibox.setDefaultSuggestion({
    description: 'Send text to Sentient'
});

// --- Initialization ---
console.log("Background script initialized.");
