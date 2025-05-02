// options.js - Handles settings functionality for Sentient is Everywhere

document.addEventListener('DOMContentLoaded', function() {
  // Get UI elements
  const floatingButtonToggle = document.getElementById('floatingButton');
  const contextMenuToggle = document.getElementById('contextMenu');
  const selectionMenuToggle = document.getElementById('selectionMenu');
  const showSummarizeToggle = document.getElementById('showSummarize');
  const showExplainToggle = document.getElementById('showExplain');
  const showNewChatToggle = document.getElementById('showNewChat');
  const showSendSentientToggle = document.getElementById('showSendSentient');
  const buttonSizeSelect = document.getElementById('buttonSize');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');
  const customCommandsContainer = document.getElementById('customCommandsContainer');
  const newCommandInput = document.getElementById('newCommandInput');
  const addCommandButton = document.getElementById('addCommand');
  
  // Load saved settings
  loadSettings();
  
  // Add event listener for save button
  saveButton.addEventListener('click', saveSettings);
  
  // Function to load settings from storage
  function loadSettings() {
    chrome.storage.sync.get({
      // Default values
      showFloatingButton: true,
      showContextMenu: true,
      showSelectionMenu: true,
      showSummarize: true,
      showExplain: true,
      showNewChat: true,
      showSendSentient: true,
      buttonSize: 'medium',
      customCommands: []
    }, function(items) {
      // Update UI with saved values
      floatingButtonToggle.checked = items.showFloatingButton;
      contextMenuToggle.checked = items.showContextMenu;
      selectionMenuToggle.checked = items.showSelectionMenu;
      showSummarizeToggle.checked = items.showSummarize;
      showExplainToggle.checked = items.showExplain;
      showNewChatToggle.checked = items.showNewChat;
      showSendSentientToggle.checked = items.showSendSentient;
      buttonSizeSelect.value = items.buttonSize;
      
      // Load custom commands
      renderCustomCommands(items.customCommands);
    });
  }
  
  // Function to save settings to storage
  function saveSettings() {
    // Get current values from UI
    const showFloatingButton = floatingButtonToggle.checked;
    const showContextMenu = contextMenuToggle.checked;
    const showSelectionMenu = selectionMenuToggle.checked;
    const showSummarize = showSummarizeToggle.checked;
    const showExplain = showExplainToggle.checked;
    const showNewChat = showNewChatToggle.checked;
    const showSendSentient = showSendSentientToggle.checked;
    const buttonSize = buttonSizeSelect.value;
    
    // Get custom commands from the UI
    const customCommands = getCustomCommandsFromUI();
    
    // Save to storage
    chrome.storage.sync.set({
      showFloatingButton: showFloatingButton,
      showContextMenu: showContextMenu,
      showSelectionMenu: showSelectionMenu,
      showSummarize: showSummarize,
      showExplain: showExplain,
      showNewChat: showNewChat,
      showSendSentient: showSendSentient,
      buttonSize: buttonSize,
      customCommands: customCommands
    }, function() {
      // Show success message
      showStatus('Settings saved successfully!', 'success');
      
      // Notify content scripts about settings change
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: {
              showFloatingButton: showFloatingButton,
              showContextMenu: showContextMenu,
              showSelectionMenu: showSelectionMenu,
              showSummarize: showSummarize,
              showExplain: showExplain,
              showNewChat: showNewChat,
              showSendSentient: showSendSentient,
              buttonSize: buttonSize,
              customCommands: customCommands
            }
          }).catch(() => {
            // Ignore errors from tabs that don't have content scripts
          });
        });
      });
    });
  }
  
  // Function to render custom commands in the UI
  function renderCustomCommands(commands) {
    // Clear existing commands
    customCommandsContainer.innerHTML = '';
    
    // Add each command to the container
    commands.forEach(function(command, index) {
      const commandItem = document.createElement('div');
      commandItem.className = 'custom-command-item';
      commandItem.dataset.index = index;
      
      const commandName = document.createElement('span');
      commandName.className = 'command-name';
      commandName.textContent = command;
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-command';
      deleteButton.textContent = '×';
      deleteButton.title = 'Delete command';
      deleteButton.addEventListener('click', function() {
        deleteCustomCommand(index);
      });
      
      commandItem.appendChild(commandName);
      commandItem.appendChild(deleteButton);
      customCommandsContainer.appendChild(commandItem);
    });
  }
  
  // Function to get custom commands from the UI
  function getCustomCommandsFromUI() {
    const commands = [];
    const commandItems = customCommandsContainer.querySelectorAll('.custom-command-item');
    
    commandItems.forEach(function(item) {
      const commandName = item.querySelector('.command-name').textContent;
      commands.push(commandName);
    });
    
    return commands;
  }
  
  // Function to delete a custom command
  function deleteCustomCommand(index) {
    chrome.storage.sync.get({
      customCommands: []
    }, function(items) {
      const commands = items.customCommands;
      
      // Remove the command at the specified index
      if (index >= 0 && index < commands.length) {
        commands.splice(index, 1);
        
        // Save the updated commands
        chrome.storage.sync.set({
          customCommands: commands
        }, function() {
          // Re-render the commands
          renderCustomCommands(commands);
          
          // Show status message
          showStatus('Command removed successfully!', 'success');
        });
      }
    });
  }
  
  // Add event listener for adding a new command
  addCommandButton.addEventListener('click', function() {
    const newCommand = newCommandInput.value.trim();
    
    if (newCommand) {
      chrome.storage.sync.get({
        customCommands: []
      }, function(items) {
        const commands = items.customCommands;
        
        // Add the new command if it doesn't already exist
        if (!commands.includes(newCommand)) {
          commands.push(newCommand);
          
          // Save the updated commands
          chrome.storage.sync.set({
            customCommands: commands
          }, function() {
            // Clear the input field
            newCommandInput.value = '';
            
            // Re-render the commands
            renderCustomCommands(commands);
            
            // Show success message with hint about placeholder if applicable
            if (newCommand.includes('<selectedtext>')) {
              showStatus('Custom command with placeholder added successfully!', 'success');
            } else {
              showStatus('Custom command added successfully!', 'success');
            }
          });
        } else {
          // Show error if command already exists
          showStatus('Command already exists!', 'error');
        }
      });
    }
  });
  
  // Function to show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status-text ' + type;
    statusDiv.style.display = 'block';
    
    // Position above save button
    const saveButton = document.getElementById('save');
    if (saveButton) {
      const saveButtonRect = saveButton.getBoundingClientRect();
      statusDiv.style.position = 'absolute';
      statusDiv.style.right = '0';
      statusDiv.style.top = '-30px';
    }
    
    // Hide after 3 seconds
    setTimeout(function() {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});
