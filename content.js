// content.js (With Bug Fixes - isDiscord, sendWithRetry, Auto /st Completion, Focus Fixes, data-testid Fix - Final Version + Discord Cleanup Removed + BUTTON ADDITION FIX + Send Sentient Button + Language Translation)

(function() {
    console.log("Sentient content script v1.19 (With fixed /st command and improved input detection) loaded.");

    // --- Settings and State Variables ---
    let settings = {
        showFloatingButton: true,
        showContextMenu: true,
        showSelectionMenu: true,
        showSummarize: true,
        showExplain: true,
        showNewChat: true,
        showSendSentient: true,
        customCommands: [],
        selectedLanguage: ''
    };
    
    // Load settings from storage
    chrome.storage.sync.get({
        showFloatingButton: true,
        showContextMenu: true,
        showSelectionMenu: true,
        showSummarize: true,
        showExplain: true,
        showNewChat: true,
        showSendSentient: true,
        customCommands: [],
        selectedLanguage: ''
    }, function(items) {
        settings = items;
        updateUIBasedOnSettings();
    });
    
    // Listen for settings changes
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === 'settingsUpdated') {
            settings = message.settings;
            updateUIBasedOnSettings();
        }
        return false;
    });
    
    // Update UI based on settings
    function updateUIBasedOnSettings() {
        // Handle floating button visibility
        const button = document.getElementById('sentient-logo-button');
        if (button) {
            button.style.display = settings.showFloatingButton ? 'block' : 'none';
        }
        
        // Update selection menu if it exists
        updateSelectionMenu();
    }

    // --- Floating Button and Drag Logic ---
    const buttonId = 'sentient-logo-button';
    let button = document.getElementById(buttonId);
    if (!button) {
        button = document.createElement('button');
        button.id = buttonId;
        // Add button to body element (if exists) or html element (if no body)
        (document.body || document.documentElement).appendChild(button);
        // Apply initial visibility based on settings
        if (button && !settings.showFloatingButton) {
            button.style.display = 'none';
        }
        console.log("Sentient logo button created and added.");
    }
    let isDragging = false;
    let wasPotentiallyDragging = false;
    let dragStartTime = 0;
    let startX = 0, startY = 0;
    const CLICK_THRESHOLD_PX = 5;
    let offsetX, offsetY;
    if (button) {
        button.onmousedown = function(e) {
            if (e.button !== 0) return;
            wasPotentiallyDragging = true;
            dragStartTime = Date.now();
            startX = e.clientX;
            startY = e.clientY;
            const rect = button.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            e.preventDefault();
        };
    } else {
        console.error("Sentient button element not found for mousedown listener.");
    }
    document.onmousemove = function(e) {
        if (wasPotentiallyDragging && !isDragging) {
            const moveX = Math.abs(e.clientX - startX);
            const moveY = Math.abs(e.clientY - startY);
            if (moveX > CLICK_THRESHOLD_PX || moveY > CLICK_THRESHOLD_PX) {
                isDragging = true;
                if (button) button.style.cursor = 'grabbing';
            }
        }
        if (!isDragging || !button) return;
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;
        const BORDER_MARGIN = 10;
        newX = Math.max(BORDER_MARGIN, Math.min(newX, window.innerWidth - button.offsetWidth - BORDER_MARGIN));
        newY = Math.max(BORDER_MARGIN, Math.min(newY, window.innerHeight - button.offsetHeight - BORDER_MARGIN));
        button.style.left = newX + 'px';
        button.style.top = newY + 'px';
    };
    document.onmouseup = function(e) {
        if (e.button !== 0 || !wasPotentiallyDragging) return;
        if (!isDragging) {
            console.log("Sentient logo button clicked.");
            try {
                if (chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ action: "openSentientPopup" }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Error sending popup open message:", chrome.runtime.lastError.message);
                        } else if (response) {
                            console.log("Popup open request sent, response:", response);
                        }
                    });
                } else {
                    console.warn("chrome.runtime or sendMessage not available.");
                }
            } catch (error) {
                console.error("JS error calling sendMessage:", error);
            }
        } else if (button) {
            button.style.cursor = 'pointer';
        }
        isDragging = false;
        wasPotentiallyDragging = false;
    };
    // --- Floating Button End ---

    // --- Selection Menu Logic ---
    let selectionMenu = null;
    let selectionTimeout = null;
    
    // Create selection menu if it doesn't exist
    function createSelectionMenu() {
        if (selectionMenu) return;
        
        selectionMenu = document.createElement('div');
        selectionMenu.id = 'sentient-selection-menu';
        selectionMenu.className = 'sentient-selection-menu';
        selectionMenu.style.display = 'none';
        
        // Create logo container
        const logoContainer = document.createElement('div');
        logoContainer.className = 'sentient-logo-container';
        
        // Create logo image
        const logoImg = document.createElement('img');
        logoImg.src = chrome.runtime.getURL('images/sentient-logo.png');
        logoImg.className = 'sentient-logo';
        logoImg.alt = 'Sentient Logo';
        
        // Add logo to container
        logoContainer.appendChild(logoImg);
        
        // Add logo to menu
        selectionMenu.appendChild(logoContainer);
        
        // Create and add standard buttons based on settings
        if (settings.showSummarize) {
            const summarizeBtn = createButton('Summarize', handleSummarize);
            summarizeBtn.id = 'summarize-button';
            selectionMenu.appendChild(summarizeBtn);
        }
        
        if (settings.showExplain) {
            const explainBtn = createButton('Explain', handleExplain);
            explainBtn.id = 'explain-button';
            selectionMenu.appendChild(explainBtn);
        }
        
        if (settings.showNewChat) {
            const newChatBtn = createButton('New Chat', handleNewChat);
            newChatBtn.id = 'newchat-button';
            selectionMenu.appendChild(newChatBtn);
        }
        
        if (settings.showSendSentient) {
            const sendSentientBtn = createButton('Send Sentient', handleSendSentient);
            sendSentientBtn.id = 'sendsentient-button';
            selectionMenu.appendChild(sendSentientBtn);
        }
        
        // Add custom command buttons
        if (settings.customCommands && settings.customCommands.length > 0) {
            settings.customCommands.forEach((command, index) => {
                // <selectedtext> yer tutucusunu tamamen kaldır
                const displayCommand = command.replace(/<selectedtext>/g, "");
                
                const customBtn = createButton(displayCommand, function() {
                    handleCustomCommand(command);
                });
                customBtn.id = `custom-command-${index}`;
                selectionMenu.appendChild(customBtn);
            });
        }
        
        // Add translation button if language is selected
        if (settings.selectedLanguage) {
            const translateBtn = createButton(`Translate to ${settings.selectedLanguage}`, handleTranslate);
            translateBtn.id = 'translate-button';
            selectionMenu.appendChild(translateBtn);
        }
        
        // Add menu to document
        (document.body || document.documentElement).appendChild(selectionMenu);
        
        // Add CSS for menu
        const style = document.createElement('style');
        style.textContent = `
            .sentient-selection-menu {
                position: absolute;
                display: flex;
                flex-wrap: wrap;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 9999999;
                padding: 8px;
                max-width: 400px;
            }
            .sentient-logo-container {
                width: 100%;
                display: flex;
                justify-content: center;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid #eee;
            }
            .sentient-logo {
                width: 40px;
                height: 40px;
                object-fit: contain;
            }
            .sentient-selection-btn {
                background: #FFFFFF;
                color: #000000;
                font-weight: bold;
                border: 1px solid #CCCCCC;
                border-radius: 4px;
                padding: 8px 12px;
                margin: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            .sentient-selection-btn:hover {
                background: #F5F5F5;
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update selection menu based on settings
    function updateSelectionMenu() {
        if (!selectionMenu) return;
        
        // Remove all buttons except logo container
        const logoContainer = selectionMenu.querySelector('.sentient-logo-container');
        while (selectionMenu.lastChild !== logoContainer) {
            selectionMenu.removeChild(selectionMenu.lastChild);
        }
        
        // Add standard buttons based on settings
        if (settings.showSummarize) {
            const summarizeBtn = createButton('Summarize', handleSummarize);
            summarizeBtn.id = 'summarize-button';
            selectionMenu.appendChild(summarizeBtn);
        }
        
        if (settings.showExplain) {
            const explainBtn = createButton('Explain', handleExplain);
            explainBtn.id = 'explain-button';
            selectionMenu.appendChild(explainBtn);
        }
        
        if (settings.showNewChat) {
            const newChatBtn = createButton('New Chat', handleNewChat);
            newChatBtn.id = 'newchat-button';
            selectionMenu.appendChild(newChatBtn);
        }
        
        if (settings.showSendSentient) {
            const sendSentientBtn = createButton('Send Sentient', handleSendSentient);
            sendSentientBtn.id = 'sendsentient-button';
            selectionMenu.appendChild(sendSentientBtn);
        }
        
        // Add custom command buttons
        if (settings.customCommands && settings.customCommands.length > 0) {
            settings.customCommands.forEach((command, index) => {
                // <selectedtext> yer tutucusunu tamamen kaldır
                const displayCommand = command.replace(/<selectedtext>/g, "");
                
                const customBtn = createButton(displayCommand, function() {
                    handleCustomCommand(command);
                });
                customBtn.id = `custom-command-${index}`;
                selectionMenu.appendChild(customBtn);
            });
        }
        
        // Add translation button if language is selected
        if (settings.selectedLanguage) {
            const translateBtn = createButton(`Translate to ${settings.selectedLanguage}`, handleTranslate);
            translateBtn.id = 'translate-button';
            selectionMenu.appendChild(translateBtn);
        }
    }
    
    // Helper to create a button
    function createButton(text, handler) {
        const btn = document.createElement('button');
        btn.className = 'sentient-selection-btn';
        btn.textContent = text;
        btn.addEventListener('click', handler);
        return btn;
    }
    
    // Show menu at position
    function showSelectionMenu(x, y) {
        if (!selectionMenu) createSelectionMenu();
        
        // Position menu
        selectionMenu.style.left = `${x}px`;
        selectionMenu.style.top = `${y}px`;
        selectionMenu.style.display = 'flex';
        
        // Hide menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', hideSelectionMenuOnClickOutside);
        }, 10);
    }
    
    // Hide menu
    function hideSelectionMenu() {
        if (selectionMenu) {
            selectionMenu.style.display = 'none';
            document.removeEventListener('click', hideSelectionMenuOnClickOutside);
        }
    }
    
    // Hide menu when clicking outside
    function hideSelectionMenuOnClickOutside(e) {
        if (selectionMenu && !selectionMenu.contains(e.target)) {
            hideSelectionMenu();
        }
    }
    
    // Handle selection change
    document.addEventListener('selectionchange', function() {
        // Clear any pending timeout
        if (selectionTimeout) {
            clearTimeout(selectionTimeout);
            selectionTimeout = null;
        }
        
        // Hide menu
        hideSelectionMenu();
        
        // Check if selection menu is enabled in settings
        if (!settings.showSelectionMenu) {
            return;
        }
        
        // Check if there's a selection
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
            return;
        }
        
        // Set timeout to show menu
        selectionTimeout = setTimeout(() => {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Position menu above selection
            const x = rect.left + window.scrollX + (rect.width / 2) - 100; // Center menu
            const y = rect.top + window.scrollY - 40; // Position above selection
            
            showSelectionMenu(x, y);
        }, 500); // Show after 500ms
    });
    
    // Handle button clicks
    function handleSummarize() {
        const selection = window.getSelection().toString().trim();
        if (!selection) return;
        
        hideSelectionMenu();
        sendMessageWithRetry({ 
            action: "processSelectionAction", 
            type: "summarize", 
            text: selection 
        });
    }
    
    // Handle custom command
    function handleCustomCommand(command) {
        const selection = window.getSelection().toString().trim();
        if (!selection) return;
        
        hideSelectionMenu();
        sendMessageWithRetry({ 
            action: "processSelectionAction", 
            type: "custom", 
            text: selection,
            command: command
        });
    }
    
    function handleExplain() {
        const selection = window.getSelection().toString().trim();
        if (!selection) return;
        
        hideSelectionMenu();
        sendMessageWithRetry({ 
            action: "processSelectionAction", 
            type: "explain", 
            text: selection 
        });
    }
    
    function handleNewChat() {
        const selection = window.getSelection().toString().trim();
        if (!selection) return;
        
        hideSelectionMenu();
        sendMessageWithRetry({ 
            action: "processSelectionAction", 
            type: "newchat", 
            text: selection 
        });
    }
    
    function handleSendSentient() {
        const selection = window.getSelection().toString().trim();
        if (!selection) return;
        
        hideSelectionMenu();
        sendMessageWithRetry({ 
            action: "processSelectionAction", 
            type: "sendsentient", 
            text: selection 
        });
    }
    
    function handleTranslate() {
        const selection = window.getSelection().toString().trim();
        if (!selection) return;
        
        hideSelectionMenu();
        sendMessageWithRetry({ 
            action: "processSelectionAction", 
            type: "translate", 
            text: selection 
        });
    }
    
    // Message to background function (Standalone)
    const sendMessageWithRetry = (message, callback, retryCount = 3) => {
        setTimeout(() => {
            try {
                // Make sure we're in a valid extension context
                if (chrome && chrome.runtime && chrome.runtime.id) {
                    chrome.runtime.sendMessage(message, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(`Message error:`, chrome.runtime.lastError.message);
                            if (retryCount > 0) {
                                console.log("sendMessage error, retrying...");
                                setTimeout(() => sendMessageWithRetry(message, callback, retryCount - 1), 100);
                            } else {
                                console.error("sendMessage failed.");
                                if (callback) callback({ status: "Error: sendMessage failed after retries." });
                            }
                        } else {
                            if (callback) callback(response);
                        }
                    });
                } else {
                    console.warn("chrome.runtime unavailable or invalid extension context.");
                    if (callback) callback({ status: "Error: chrome.runtime unavailable." });
                }
            } catch (error) {
                console.error("JS error calling sendMessage:", error);
                if (retryCount > 0) {
                    console.log("sendMessage JS error, retrying...");
                    setTimeout(() => sendMessageWithRetry(message, callback, retryCount - 1), 100);
                } else {
                    console.error("sendMessage failed after JS error retries.");
                    if (callback) callback({ status: "Error: sendMessage failed after retries." });
                }
            }
        }, 0);
    };
    // --- Selection Menu Logic End ---

    // --- Clipboard Access ---
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "copyToClipboard") {
            console.log("Content script received copyToClipboard request");
            
            // Create a temporary textarea element
            const textarea = document.createElement('textarea');
            textarea.value = message.text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            
            // Select and copy the text
            textarea.select();
            let success = false;
            try {
                success = document.execCommand('copy');
                console.log("execCommand copy result:", success);
            } catch (err) {
                console.error("execCommand copy error:", err);
            }
            
            // Remove the textarea
            document.body.removeChild(textarea);
            
            // Send response
            sendResponse({ success: success });
            return true;
        } else if (message.action === "pasteClipboardContent") {
            console.log("Content script received pasteClipboardContent request");
            
            // Check if we're on a Sentient chat page
            if (window.location.href.includes("chat.sentient.xyz")) {
                console.log("On Sentient chat page, attempting to paste");
                
                // Try to find the input field
                const inputField = findSentientInputField();
                if (inputField) {
                    console.log("Found input field, focusing");
                    inputField.focus();
                    
                    // Try to paste using document.execCommand
                    let execCommandSuccess = false;
                    try {
                        execCommandSuccess = document.execCommand('paste');
                        console.log("execCommand paste result:", execCommandSuccess);
                    } catch (err) {
                        console.error("execCommand paste error:", err);
                    }
                    
                    // If execCommand failed, try to get clipboard content from background script
                    if (!execCommandSuccess) {
                        console.log("execCommand paste failed, requesting clipboard content from background");
                        chrome.runtime.sendMessage({ action: "getClipboardContent" }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("Error getting clipboard content:", chrome.runtime.lastError);
                                return;
                            }
                            
                            if (response && response.success) {
                                console.log("Got clipboard content from background, setting input value");
                                inputField.value = response.text;
                                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                            } else if (response && response.fallbackNeeded) {
                                console.log("Background clipboard access failed, trying local storage fallback");
                                // Try to get from local storage
                                chrome.storage.local.get(['clipboardText'], function(result) {
                                    if (chrome.runtime.lastError) {
                                        console.error("Error getting from local storage:", chrome.runtime.lastError);
                                        return;
                                    }
                                    
                                    if (result && result.clipboardText) {
                                        console.log("Got clipboard text from local storage");
                                        inputField.value = result.clipboardText;
                                        inputField.dispatchEvent(new Event('input', { bubbles: true }));
                                    } else {
                                        console.warn("No clipboard text found in local storage");
                                    }
                                });
                            } else {
                                console.warn("Failed to get clipboard content");
                            }
                        });
                    }
                } else {
                    // Silently ignore instead of showing warning
                    console.log("Input field not found, will try again later");
                }
            } else {
                console.log("Not on Sentient chat page, paste request ignored");
            }
            
            sendResponse({ status: "Paste request processed" });
            return true;
        }
        
        return false;
    });
    
    // Function to find Sentient input field with improved detection
    function findSentientInputField() {
        // Log the current URL for debugging
        console.log("Current URL:", window.location.href);
        
        // Special handling for specific sites
        if (window.location.href.includes("chat.sentient.xyz")) {
            // Direct DOM traversal for Sentient's own site
            console.log("On Sentient's own site, using direct DOM traversal");
            
            // Try to find the main chat container first
            const chatContainers = document.querySelectorAll('.chat-container, .message-container, .conversation-container, main, [role="main"]');
            for (const container of chatContainers) {
                if (isElementVisible(container)) {
                    // Look for textareas or contenteditable divs within the container
                    const inputElements = container.querySelectorAll('textarea, div[contenteditable="true"], div[role="textbox"]');
                    for (const input of inputElements) {
                        if (isElementVisible(input)) {
                            console.log("Found input field in chat container:", input);
                            return input;
                        }
                    }
                    
                    // If no input found in container, try to find it by looking at the bottom of the container
                    const containerRect = container.getBoundingClientRect();
                    const bottomY = containerRect.bottom - 50; // 50px from bottom
                    const centerX = containerRect.left + (containerRect.width / 2);
                    
                    // Get elements at this position
                    const elementsAtBottom = document.elementsFromPoint(centerX, bottomY);
                    for (const element of elementsAtBottom) {
                        if (element.tagName === 'TEXTAREA' || 
                            element.getAttribute('contenteditable') === 'true' || 
                            element.getAttribute('role') === 'textbox') {
                            if (isElementVisible(element)) {
                                console.log("Found input field at bottom of chat container:", element);
                                return element;
                            }
                        }
                    }
                }
            }
            
            // If we still can't find the input field, try a more aggressive approach
            // Look for any element that might be an input at the bottom of the page
            const viewportHeight = window.innerHeight;
            const bottomY = viewportHeight - 50; // 50px from bottom of viewport
            
            // Try multiple horizontal positions
            const horizontalPositions = [
                window.innerWidth / 2,           // Center
                window.innerWidth / 2 - 100,     // Left of center
                window.innerWidth / 2 + 100      // Right of center
            ];
            
            for (const xPos of horizontalPositions) {
                const elementsAtBottom = document.elementsFromPoint(xPos, bottomY);
                for (const element of elementsAtBottom) {
                    // Check if element itself is an input
                    if (element.tagName === 'TEXTAREA' || 
                        element.getAttribute('contenteditable') === 'true' || 
                        element.getAttribute('role') === 'textbox') {
                        if (isElementVisible(element)) {
                            console.log("Found input field at bottom of viewport:", element);
                            return element;
                        }
                    }
                    
                    // Check if element contains an input
                    const inputs = element.querySelectorAll('textarea, div[contenteditable="true"], div[role="textbox"]');
                    for (const input of inputs) {
                        if (isElementVisible(input)) {
                            console.log("Found input field within element at bottom of viewport:", input);
                            return input;
                        }
                    }
                }
            }
            
            // Try to find by specific Sentient selectors
            const sentientSpecificSelectors = [
                'textarea[placeholder="Message Sentient..."]',
                'textarea[placeholder="Send a message"]',
                'textarea[aria-label="Chat input"]',
                'div[contenteditable="true"][aria-label="Chat input"]',
                'div[role="textbox"][aria-label="Chat input"]',
                'form textarea',
                '.chat-input textarea',
                '.message-input textarea'
            ];
            
            for (const selector of sentientSpecificSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (isElementVisible(element)) {
                        console.log("Found input field by Sentient-specific selector:", selector);
                        return element;
                    }
                }
            }
        }
        
        // Try various selectors that might match the input field
        const selectors = [
            // Standard selectors
            'textarea[placeholder="Send a message"]',
            'textarea[data-testid="chat-input"]',
            'textarea.chat-input',
            'textarea[role="textbox"]',
            'div[contenteditable="true"]',
            
            // Additional selectors for Sentient's interface
            'textarea[placeholder*="message"]',
            'textarea[placeholder*="Type"]',
            'textarea[placeholder*="Ask"]',
            'textarea[placeholder*="Write"]',
            'textarea[aria-label*="chat"]',
            'textarea[aria-label*="message"]',
            'div[role="textbox"]',
            'div[contenteditable="plaintext-only"]',
            'div[data-slate-editor="true"]',
            
            // More generic fallbacks
            'form textarea',
            '.chat-input-container textarea',
            '.message-input textarea',
            '.input-area textarea',
            
            // Last resort - any textarea that's visible
            'textarea'
        ];
        
        // First try the most specific approach - look for elements at the bottom of the page
        const viewportHeight = window.innerHeight;
        const bottomThreshold = viewportHeight * 0.7; // Consider elements in bottom 30% of screen
        
        // Find all potential input elements
        const potentialInputs = [];
        
        // Collect all textareas and contenteditable divs
        document.querySelectorAll('textarea, div[contenteditable="true"], div[role="textbox"], input[type="text"]').forEach(el => {
            const rect = el.getBoundingClientRect();
            // Check if element is in the bottom part of the viewport and is visible
            if (rect.top > bottomThreshold && isElementVisible(el)) {
                potentialInputs.push({
                    element: el,
                    position: rect.top, // Higher value means lower on the page
                    width: rect.width   // Wider elements are more likely to be the main input
                });
            }
        });
        
        // Sort by position (bottom-most first) and then by width (widest first)
        potentialInputs.sort((a, b) => {
            if (Math.abs(a.position - b.position) < 50) { // If they're roughly at the same height
                return b.width - a.width; // Prefer wider elements
            }
            return b.position - a.position; // Prefer lower elements
        });
        
        // Return the best match if found
        if (potentialInputs.length > 0) {
            console.log("Found input field by position and size:", potentialInputs[0].element);
            return potentialInputs[0].element;
        }
        
        // If no elements found by position, try selectors
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (isElementVisible(element)) {
                    console.log("Found input field by selector:", selector);
                    return element;
                }
            }
        }
        
        // Look for send buttons and try to find nearby input fields
        const sendButtons = Array.from(document.querySelectorAll('button, div[role="button"]')).filter(button => {
            // Check if button has text that suggests it's a send button
            const text = button.textContent?.toLowerCase() || '';
            
            // Check if button has an icon that suggests it's a send button
            const hasIcon = button.querySelector('svg, img') !== null && 
                           (button.ariaLabel?.toLowerCase().includes('send') || 
                            button.title?.toLowerCase().includes('send'));
            
            return text.includes('send') || text.includes('submit') || hasIcon;
        });
        
        for (const button of sendButtons) {
            if (isElementVisible(button)) {
                console.log("Found send button, looking for nearby input field");
                
                // Look for input fields near the send button
                const buttonRect = button.getBoundingClientRect();
                
                // Try multiple positions around the button
                const positions = [
                    { x: buttonRect.left - 50, y: buttonRect.top },     // Left
                    { x: buttonRect.left - 100, y: buttonRect.top },    // Further left
                    { x: buttonRect.left, y: buttonRect.top - 30 },     // Above
                    { x: buttonRect.left, y: buttonRect.top + 30 }      // Below
                ];
                
                for (const pos of positions) {
                    const nearbyElements = document.elementsFromPoint(pos.x, pos.y);
                    
                    for (const element of nearbyElements) {
                        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' || 
                            element.getAttribute('contenteditable') === 'true' || 
                            element.getAttribute('role') === 'textbox') {
                            if (isElementVisible(element)) {
                                console.log("Found input field near send button:", element);
                                return element;
                            }
                        }
                        
                        // Also check children of this element
                        const childInputs = element.querySelectorAll('textarea, input[type="text"], div[contenteditable], [role="textbox"]');
                        for (const childInput of childInputs) {
                            if (isElementVisible(childInput)) {
                                console.log("Found input field in child of element near send button:", childInput);
                                return childInput;
                            }
                        }
                    }
                }
                
                // If we still can't find an input, look for the closest input to the button
                const allInputs = document.querySelectorAll('textarea, input[type="text"], div[contenteditable], [role="textbox"]');
                let closestInput = null;
                let closestDistance = Infinity;
                
                for (const input of allInputs) {
                    if (isElementVisible(input)) {
                        const inputRect = input.getBoundingClientRect();
                        const distance = Math.sqrt(
                            Math.pow(buttonRect.left - inputRect.left, 2) + 
                            Math.pow(buttonRect.top - inputRect.top, 2)
                        );
                        
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestInput = input;
                        }
                    }
                }
                
                if (closestInput && closestDistance < 200) { // Only use if within reasonable distance
                    console.log("Found closest input to send button:", closestInput);
                    return closestInput;
                }
            }
        }
        
        // Last resort: Try to find any form element and look for inputs inside it
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            if (isElementVisible(form)) {
                const formInputs = form.querySelectorAll('textarea, input[type="text"], div[contenteditable], [role="textbox"]');
                for (const input of formInputs) {
                    if (isElementVisible(input)) {
                        console.log("Found input field inside form:", input);
                        return input;
                    }
                }
            }
        }
        
        console.log("Could not find any input field");
        return null;
    }
    
    // Helper function to check if an element is visible
    function isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            return false;
        }
        
        // Check if element is in viewport
        if (rect.bottom < 0 || rect.top > window.innerHeight || 
            rect.right < 0 || rect.left > window.innerWidth) {
            return false;
        }
        
        // Check if element has any size constraints that would make it unusable
        if (parseInt(style.maxHeight) === 0 || parseInt(style.maxWidth) === 0) {
            return false;
        }
        
        // Check if element is actually interactive
        if (style.pointerEvents === 'none') {
            return false;
        }
        
        // Check if element or any parent has overflow: hidden and element is outside that container
        let parent = element.parentElement;
        while (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.overflow === 'hidden' || parentStyle.overflowY === 'hidden') {
                const parentRect = parent.getBoundingClientRect();
                if (rect.bottom > parentRect.bottom || rect.top < parentRect.top) {
                    return false;
                }
            }
            parent = parent.parentElement;
        }
        
        return true;
    }
    
    // --- /st Command Logic (UNIVERSAL - Enter Trigger + Auto-Completion + Focus Fixes) ---
    console.log("Sentient Universal /st (Enter) command listener active.");

    const ST_COMMAND = "/st ";
    const SENTIENT_CHAT_URL_PATTERN = "https://chat.sentient.xyz/c/"; // Must match sentient-paste.js
    // Keep specific site selectors for backward compatibility
    const targetSites = {
        "google": ['textarea[name="q"]', 'input[name="q"]', 'textarea[aria-label*="Search"]', 'textarea[aria-label*="Ara"]'],
        "twitter": ['input[data-testid="SearchBox_Search_Input"]', 'div[data-testid="tweetTextarea_0"][role="textbox"]', 'div[role="textbox"][aria-label*="Tweet text"]', 'div[role="textbox"][aria-label*="Add text"]', 'div[role="textbox"][aria-label*="Metin ekle"]'],
        "discord": ['div[role="textbox"][contenteditable="true"][class*="slateTextArea"]', 'div[role="textbox"][aria-multiline="true"][contenteditable="true"][data-slate-editor="true"][class*="slateTextArea_"]', 'div[role="textbox"][aria-multiline="true"][aria-label*="kanalına mesaj gönder"][contenteditable="true"][data-slate-editor="true"]', 'div[role="textbox"][aria-multiline="true"][aria-label*="Message #"][contenteditable="true"][data-slate-editor="true"]']
    };
    // Universal selectors for all sites
    const universalSelectors = [
        'input[type="text"]', 
        'input[type="search"]', 
        'textarea', 
        'div[role="textbox"]', 
        'div[contenteditable="true"]',
        '[contenteditable="true"]'
    ];
    let commandProcessed = new WeakSet();
    let lastStCommand = ""; // Variable to store last /st command

    document.addEventListener('input', function(e) {
        const target = e.target;
        const isEditable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLDivElement && target.isContentEditable);
        if (!isEditable || !target.checkVisibility()) {
            return;
        }

        const currentValue = target.value !== undefined ? target.value : target.textContent;

        if (currentValue && currentValue.startsWith(ST_COMMAND)) {
            if (currentValue.trim() !== ST_COMMAND.trim()) {
                lastStCommand = currentValue;
            }
            // Auto-completion disabled as requested
        }

        // Try to focus the input field
        if (isEditable) {
            target.focus();
        }
    });

    document.addEventListener('keydown', function(e) {
        const target = e.target;
        const isEditable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLDivElement && target.isContentEditable);
        if (!isEditable || !target.checkVisibility()) {
            return;
        }

        const hostname = window.location.hostname;
        const isDiscord = hostname.includes('discord.com');
        let selectors = null;
        let isContentEditableTarget = false;

        if (e.key !== 'Enter') {
            const currentValueCheck = target.value !== undefined ? target.value : target.textContent;
            if (commandProcessed.has(target) && (!currentValueCheck || !currentValueCheck.startsWith(ST_COMMAND))) {
                commandProcessed.delete(target);
            }
            return;
        }

        // ---- Enter key pressed ----

        // Determine if target is content editable
        if (target instanceof HTMLDivElement && target.isContentEditable) {
            isContentEditableTarget = true;
        } else if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            isContentEditableTarget = false;
        } else if (target.isContentEditable) {
            isContentEditableTarget = true;
        } else {
            return; // Not a supported editable element
        }

        // Check if element matches any of our selectors (site-specific or universal)
        let matchesSelector = false;
        
        // First check site-specific selectors for backward compatibility
        if (hostname.includes('google.')) {
            selectors = targetSites.google;
            if (target.matches(selectors.join(','))) {
                matchesSelector = true;
            }
        } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            selectors = targetSites.twitter;
            if (target.matches(selectors.join(','))) {
                matchesSelector = true;
            }
        } else if (isDiscord) {
            selectors = targetSites.discord;
            if (target.matches(selectors.join(','))) {
                matchesSelector = true;
            }
        }
        
        // If not matched by site-specific selectors, try universal selectors
        if (!matchesSelector) {
            if (target.matches(universalSelectors.join(','))) {
                matchesSelector = true;
            }
        }
        
        // If element doesn't match any selector, return
        if (!matchesSelector) {
            return;
        }

        const currentValue = isContentEditableTarget ? target.textContent : target.value;

        if (currentValue && currentValue.startsWith(ST_COMMAND)) {
            const query = currentValue.substring(ST_COMMAND.length).trim();

            if (query) {
                if (commandProcessed.has(target)) {
                    console.log("Command already processing, Enter ignored.");
                    e.preventDefault(); e.stopImmediatePropagation(); return;
                }
                console.log(`/st command triggered by Enter (${hostname}). Query: "${query}"`);
                e.preventDefault(); e.stopImmediatePropagation();
                commandProcessed.add(target);

                sendMessageWithRetry({ action: "processStCommand", query: query }, (response) => {
                    commandProcessed.delete(target); // Remove flag when done
                    if (response && !response.status?.startsWith("Error:")) {
                        // Don't clear the input field after pressing Enter as requested by user
                        console.log("Message retained after Enter as requested.");
                        
                        // Still dispatch events to ensure proper UI updates
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log("Input/Change events triggered.");
                    } else {
                        console.error("Received error or invalid response from background for /st processing:", response);
                    }
                });

            } else { // Empty query
                // Only prevent Enter
                e.preventDefault(); e.stopImmediatePropagation();
                console.log("/st triggered by Enter but query was empty.");
            }
        }
        // If not starting with /st, Enter works normally (do nothing)

    }, true); // Capturing phase

    // --- /st Command Logic End ---

    // --- Keyboard Shortcut Handling ---
    document.addEventListener('keydown', function(e) {
        // Check for Ctrl+Space (Windows/Linux) or Cmd+Space (Mac)
        if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
            console.log("Ctrl/Cmd+Space detected");
            
            // Prevent default behavior (like browser's search)
            e.preventDefault();
            
            // Send message to background script to paste clipboard content
            sendMessageWithRetry({ 
                action: "pasteClipboardContentOnFocus"
            });
        }
    });
})();
