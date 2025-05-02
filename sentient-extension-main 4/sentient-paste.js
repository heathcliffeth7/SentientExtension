// sentient-paste-enhanced.js (Universal Selectors - Works with any Sentient site structure)
// Works on chat.sentient.xyz, Discord, Google, Twitter and any other site with text input

(function() {
    console.log("Sentient Paste script loaded (Universal Selectors - Works with any site structure).");

    // *** UPDATED: Universal selectors for Sentient site and other platforms ***
    const SENTIENT_SELECTORS = [
        // Original selectors
        'textarea[data-testid="query#input"]', 
        'textarea[data-testid="chat.query#input"]',
        'textarea.sentient-chat-input',
        'div[role="textbox"][contenteditable="true"].sentient-chat-input',
        'textarea[placeholder*="Send a message"]',
        'div[contenteditable="true"][placeholder*="Send a message"]',
        
        // New universal selectors for any Sentient site structure
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="mesaj"]',
        'div[contenteditable="true"][placeholder*="message"]',
        'div[contenteditable="true"][placeholder*="mesaj"]',
        'div[role="textbox"]',
        'div.chat-input',
        'div[class*="chat-input"]',
        'div[class*="message-input"]',
        'div[class*="sentient"]',
        'textarea[class*="sentient"]',
        'textarea[class*="chat"]',
        'textarea[class*="message"]',
        
        // Extremely generic fallbacks (lowest priority, but will work on almost any chat interface)
        'textarea',
        'div[contenteditable="true"]',
        'div[role="textbox"][contenteditable="true"]'
    ];
    
    const DISCORD_SELECTORS = [
        'div[role="textbox"][contenteditable="true"][class*="slateTextArea"]',
        'div[role="textbox"][aria-multiline="true"][contenteditable="true"][data-slate-editor="true"]',
        'div[role="textbox"][aria-multiline="true"][aria-label*="Message"][contenteditable="true"]'
    ];
    
    const GOOGLE_SELECTORS = [
        'textarea[name="q"]', 
        'input[name="q"]', 
        'textarea[aria-label*="Search"]'
    ];
    
    const TWITTER_SELECTORS = [
        'input[data-testid="SearchBox_Search_Input"]',
        'div[data-testid="tweetTextarea_0"][role="textbox"]',
        'div[role="textbox"][aria-label*="Tweet text"]',
        'div[role="textbox"][aria-label*="Add text"]'
    ];
    
    // Combine all selectors
    const ALL_SELECTORS = [...SENTIENT_SELECTORS, ...DISCORD_SELECTORS, ...GOOGLE_SELECTORS, ...TWITTER_SELECTORS];
    const INPUT_SELECTOR = ALL_SELECTORS.join(', ');
    
    console.log("Input selector to use:", INPUT_SELECTOR); // Log selector

    // Visual feedback helper function (Optional)
    function visualFeedback(element, success) {
        if (!element) return;
        const originalBorder = element.style.border;
        element.style.border = success ? "2px solid lightgreen" : "2px solid red";
        console.log(`Sentient Paste: Visual feedback ${success ? 'success (green)' : 'failed (red)'}.`);
        setTimeout(() => {
            try { element.style.border = originalBorder; } catch(e) { /* ignore */ }
        }, 1000);
    }

    // Enhanced function to find input field with multiple strategies
    async function findInputField(prioritySelectors) {
        console.log("Sentient Paste: Starting enhanced input field search");
        let targetInput = null;
        
        // Enhanced retry settings
        let maxRetries = 25; // Significantly increased for resilience
        let retries = maxRetries;
        let initialRetryDelay = 100; // Start with a very short delay
        let currentRetryDelay = initialRetryDelay;
        let maxRetryDelay = 1200; // Increased maximum delay cap
        
        // Strategy 1: Try priority selectors immediately
        for (const selector of prioritySelectors) {
            targetInput = document.querySelector(selector);
            if (targetInput) {
                console.log(`Sentient Paste: Input found immediately with selector: ${selector}`);
                return targetInput;
            }
        }
        
        // Strategy 2: Try focused element if it's editable
        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement instanceof HTMLInputElement || 
            activeElement instanceof HTMLTextAreaElement || 
            activeElement.isContentEditable
        )) {
            console.log("Sentient Paste: Using currently focused element as input");
            return activeElement;
        }
        
        // Strategy 3: Adaptive retry with multiple selector approaches
        while (retries > 0) {
            // Try each priority selector first
            for (const selector of prioritySelectors) {
                targetInput = document.querySelector(selector);
                if (targetInput) {
                    console.log(`Sentient Paste: Input found with priority selector: ${selector}`);
                    return targetInput;
                }
            }
            
            // Try all selectors combined
            targetInput = document.querySelector(INPUT_SELECTOR);
            if (targetInput) {
                console.log("Sentient Paste: Input found with combined selectors");
                return targetInput;
            }
            
            // Strategy 4: Try finding any visible input element
            const allInputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
            for (const input of allInputs) {
                if (input.checkVisibility && input.checkVisibility()) {
                    console.log("Sentient Paste: Input found by scanning all visible inputs");
                    return input;
                }
            }
            
            console.log(`Sentient Paste: Target input not found, retrying (${retries} left) with delay ${currentRetryDelay}ms...`);
            retries--;
            
            if (retries > 0) {
                // Wait with adaptive delay
                await new Promise(resolve => setTimeout(resolve, currentRetryDelay));
                
                // Adaptive delay strategy: increase delay with each retry but cap at maximum
                currentRetryDelay = Math.min(currentRetryDelay * 1.2, maxRetryDelay);
            }
        }
        
        console.error("Sentient Paste: Failed to find input field after all strategies");
        return null;
    }

    // Async function to read clipboard and paste to target input
    async function pasteFromClipboard() {
        console.log("Sentient Paste: Message-triggered 'pasteFromClipboard' function started.");
        
        try {
            // Use a user-gesture-triggered approach to access clipboard
            return new Promise((resolve) => {
                console.log("Sentient Paste: Using improved clipboard access approach");
                improvedClipboardAccess(resolve);
            });
        } catch (error) {
            console.error("Sentient Paste: Error in clipboard handling:", error);
            return { success: false, reason: "Clipboard handling error", message: error.message };
        }
    }
    
    // Improved clipboard access function with better fallbacks
    async function improvedClipboardAccess(resolve) {
        console.log("Sentient Paste: Using improved clipboard access approach");
        try {
            // Try multiple clipboard access methods in sequence
            
            // Method 1: Check permissions and use Clipboard API if available
            if (navigator.clipboard && navigator.clipboard.readText) {
                try {
                    // Check if we have permission to read clipboard
                    let permissionStatus;
                    try {
                        permissionStatus = await navigator.permissions.query({name: 'clipboard-read'});
                        console.log(`Sentient Paste: Clipboard permission status: ${permissionStatus.state}`);
                    } catch (permError) {
                        console.warn("Sentient Paste: Permission query not supported:", permError);
                        // Some browsers don't support permission query for clipboard
                        // We'll try to read anyway and catch any errors
                    }
                    
                    // Only try to read if permission is granted or we couldn't check
                    if (!permissionStatus || permissionStatus.state !== 'denied') {
                        try {
                            const text = await navigator.clipboard.readText();
                            if (text) {
                                console.log("Sentient Paste: Text read from clipboard via Clipboard API");
                                processClipboardText(text, resolve);
                                return;
                            }
                        } catch (readError) {
                            console.warn("Sentient Paste: Clipboard API read failed:", readError);
                            // Continue to next method
                        }
                    }
                } catch (clipError) {
                    console.warn("Sentient Paste: Clipboard API access failed:", clipError);
                    // Continue to next method
                }
            }
            
            // Method 2: Use execCommand with temporary textarea
            console.log("Sentient Paste: Trying execCommand fallback");
            try {
                const textArea = document.createElement('textarea');
                textArea.style.position = 'fixed';
                textArea.style.top = '0';
                textArea.style.left = '0';
                textArea.style.width = '2em';
                textArea.style.height = '2em';
                textArea.style.opacity = '0';
                textArea.style.padding = '0';
                textArea.style.border = 'none';
                textArea.style.outline = 'none';
                textArea.style.boxShadow = 'none';
                textArea.style.background = 'transparent';
                document.body.appendChild(textArea);
                textArea.focus();
                
                let success = false;
                try {
                    success = document.execCommand('paste');
                } catch (e) {
                    console.warn("Sentient Paste: execCommand paste failed:", e);
                }
                
                const text = textArea.value;
                document.body.removeChild(textArea);
                
                if (success && text) {
                    console.log("Sentient Paste: Text read from clipboard via execCommand");
                    processClipboardText(text, resolve);
                    return;
                }
            } catch (execError) {
                console.warn("Sentient Paste: execCommand method failed:", execError);
                // Continue to next method
            }
            
            // Method 3: Try to use background script via message passing
            console.log("Sentient Paste: Trying background script clipboard access");
            try {
                chrome.runtime.sendMessage({action: "getClipboardText"}, response => {
                    if (response && response.text) {
                        console.log("Sentient Paste: Text received from background script");
                        processClipboardText(response.text, resolve);
                        return;
                    } else {
                        console.warn("Sentient Paste: Background script clipboard access failed");
                        // Continue to next method
                        trySimulatedPaste(resolve);
                    }
                });
                
                // Set a timeout in case the background script doesn't respond
                setTimeout(() => {
                    console.warn("Sentient Paste: Background script timeout, trying simulated paste");
                    trySimulatedPaste(resolve);
                }, 1000);
                
            } catch (bgError) {
                console.warn("Sentient Paste: Background script method failed:", bgError);
                // Continue to next method
                trySimulatedPaste(resolve);
            }
        } catch (error) {
            console.error("Sentient Paste: All clipboard access methods failed:", error);
            resolve({ 
                success: false, 
                reason: "All clipboard access methods failed. Please try manually pasting or check browser permissions."
            });
        }
    }
    
    // Helper function for simulated paste as last resort
    async function trySimulatedPaste(resolve) {
        console.log("Sentient Paste: Trying simulated paste as last resort");
        try {
            // Create a dummy input field
            const dummyInput = document.createElement('textarea');
            dummyInput.style.position = 'fixed';
            dummyInput.style.top = '0';
            dummyInput.style.left = '0';
            dummyInput.style.opacity = '0';
            document.body.appendChild(dummyInput);
            dummyInput.focus();
            
            // Simulate Ctrl+V keyboard shortcut
            const pasteEvent = new KeyboardEvent('keydown', {
                key: 'v',
                code: 'KeyV',
                ctrlKey: true,
                metaKey: true, // For Mac
                bubbles: true
            });
            dummyInput.dispatchEvent(pasteEvent);
            
            // Give it a moment to process
            setTimeout(() => {
                const simulatedText = dummyInput.value;
                document.body.removeChild(dummyInput);
                
                if (simulatedText) {
                    console.log("Sentient Paste: Text read via simulated keyboard shortcut");
                    processClipboardText(simulatedText, resolve);
                } else {
                    console.error("Sentient Paste: All clipboard access methods failed");
                    // Inform user about the issue
                    resolve({ 
                        success: false, 
                        reason: "All clipboard access methods failed. Please try manually pasting or check browser permissions."
                    });
                }
            }, 100);
        } catch (simulationError) {
            console.error("Sentient Paste: Simulated paste failed:", simulationError);
            resolve({ 
                success: false, 
                reason: "All clipboard access methods failed. Please try manually pasting or check browser permissions."
            });
        }
    }
    
    // Helper function to process clipboard text and find input field
    async function processClipboardText(text, resolve) {
        if (!text) {
            console.log("Sentient Paste: Clipboard empty, no paste performed.");
            resolve({ success: false, reason: "Clipboard empty" });
            return;
        }
        
        let textToPaste = text;

        // Determine which platform we're on
        const hostname = window.location.hostname;
        let prioritySelectors = SENTIENT_SELECTORS; // Default to Sentient
        
        if (hostname.includes('discord.com')) {
            prioritySelectors = DISCORD_SELECTORS;
        } else if (hostname.includes('google.')) {
            prioritySelectors = GOOGLE_SELECTORS;
        } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            prioritySelectors = TWITTER_SELECTORS;
        }
        
        // Use enhanced input field finder
        targetInput = await findInputField(prioritySelectors);

        if (!targetInput) {
            console.error(`Sentient Paste: Target input field not found.`);
            return { success: false, reason: "Input not found" };
        }

        // If input found, continue...
        console.log("Sentient Paste: Input field found:", targetInput);
        let pasteAttemptSuccess = false;
        try {
            console.log("Sentient Paste: Attempting paste and event triggering...");
            targetInput.focus();
            console.log("Sentient Paste: Focused.");

            if (targetInput.tagName === 'TEXTAREA' || targetInput.tagName === 'INPUT') {
                targetInput.value = textToPaste;
            } else if (targetInput.isContentEditable) {
                targetInput.textContent = textToPaste;
            }
            console.log("Sentient Paste: Value/textContent set.");

            targetInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            console.log("Sentient Paste: Input event triggered.");
            targetInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            console.log("Sentient Paste: Change event triggered.");
            targetInput.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
            console.log("Sentient Paste: Blur event triggered.");

            if (targetInput.setSelectionRange) {
                targetInput.setSelectionRange(targetInput.value.length, targetInput.value.length);
                console.log("Sentient Paste: setSelectionRange called.");
            }

            console.log("Sentient Paste: Paste and events successfully triggered.");
            pasteAttemptSuccess = true;

        } catch(pasteError) {
            console.error("Sentient Paste: Error during paste or event triggering:", pasteError);
            pasteAttemptSuccess = false;
        }

        visualFeedback(targetInput, pasteAttemptSuccess);
        console.log(`Sentient Paste: pasteFromClipboard function finished (Success: ${pasteAttemptSuccess}).`);
        return { success: pasteAttemptSuccess };
    }

    // Direct paste function that can be called with text
    async function pasteText(text) {
        console.log("Sentient Paste: Direct paste function called with text.");
        
        // Determine which platform we're on
        const hostname = window.location.hostname;
        let prioritySelectors = SENTIENT_SELECTORS; // Default to Sentient
        
        if (hostname.includes('discord.com')) {
            prioritySelectors = DISCORD_SELECTORS;
        } else if (hostname.includes('google.')) {
            prioritySelectors = GOOGLE_SELECTORS;
        } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            prioritySelectors = TWITTER_SELECTORS;
        }
        
        // Use enhanced input field finder
        const targetInput = await findInputField(prioritySelectors);

        if (!targetInput) {
            console.error(`Sentient Paste: Target input field not found.`);
            return { success: false, reason: "Input not found" };
        }

        // If input found, continue...
        console.log("Sentient Paste: Input field found:", targetInput);
        let pasteAttemptSuccess = false;
        try {
            console.log("Sentient Paste: Attempting paste and event triggering...");
            targetInput.focus();
            console.log("Sentient Paste: Focused.");

            if (targetInput.tagName === 'TEXTAREA' || targetInput.tagName === 'INPUT') {
                targetInput.value = text;
            } else if (targetInput.isContentEditable) {
                targetInput.textContent = text;
            }
            console.log("Sentient Paste: Value/textContent set.");

            targetInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            console.log("Sentient Paste: Input event triggered.");
            targetInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            console.log("Sentient Paste: Change event triggered.");
            targetInput.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
            console.log("Sentient Paste: Blur event triggered.");

            if (targetInput.setSelectionRange) {
                targetInput.setSelectionRange(targetInput.value.length, targetInput.value.length);
                console.log("Sentient Paste: setSelectionRange called.");
            }

            console.log("Sentient Paste: Paste and events successfully triggered.");
            pasteAttemptSuccess = true;

        } catch(pasteError) {
            console.error("Sentient Paste: Error during paste or event triggering:", pasteError);
            pasteAttemptSuccess = false;
        }

        visualFeedback(targetInput, pasteAttemptSuccess);
        console.log(`Sentient Paste: pasteText function finished (Success: ${pasteAttemptSuccess}).`);
        return { success: pasteAttemptSuccess };
    }

    // Only listen to messages from background.js
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Sentient Paste: Message received:", message);
        
        try {
            if (message.action === "pasteClipboardContent") {
                console.log("Sentient Paste: 'pasteClipboardContent' message received, attempting paste...");
                
                // Send immediate acknowledgment to prevent channel closing
                sendResponse({ received: true, status: "processing" });
                
                // Process the paste request asynchronously
                pasteFromClipboard().then(result => {
                    console.log("Sentient Paste: Paste attempt result:", result);
                    // No need to send response here as we already acknowledged receipt
                }).catch(error => {
                    console.error("Sentient Paste: Unexpected error in pasteFromClipboard:", error);
                });
                
                return true; // Asynchronous response
            } else if (message.action === "pasteText") {
                console.log("Sentient Paste: 'pasteText' message received, attempting paste...");
                
                // Send immediate acknowledgment to prevent channel closing
                sendResponse({ received: true, status: "processing" });
                
                // Process the paste request asynchronously
                pasteText(message.text).then(result => {
                    console.log("Sentient Paste: Paste attempt result:", result);
                    // No need to send response here as we already acknowledged receipt
                }).catch(error => {
                    console.error("Sentient Paste: Unexpected error in pasteText:", error);
                });
                
                return true; // Asynchronous response
            } else {
                console.log("Sentient Paste: Unknown message action:", message.action);
                return false;
            }
        } catch (error) {
            console.error("Sentient Paste: Error handling message:", error);
            sendResponse({ error: error.message });
            return false;
        }
    });
    
    // Also listen for direct custom events (fallback mechanism)
    document.addEventListener('sentient_paste_request', (event) => {
        console.log("Sentient Paste: Received direct paste request via custom event", event.detail);
        pasteFromClipboard().then(result => {
            console.log("Sentient Paste: Direct paste operation completed:", result);
        }).catch(error => {
            console.error("Sentient Paste: Error in direct paste operation:", error);
        });
    });
    
    console.log("Sentient Paste: Message listener and custom event listener active.");
})(); // IIFE End
