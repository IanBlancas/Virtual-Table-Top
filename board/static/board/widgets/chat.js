// ===== Global Chat Panel =====
(function () {
  const PANEL_ID = 'global-chat-panel';
  const STYLE_ID = 'global-chat-panel-style';
  let panel = null;
  let messageHistory = [];
  let usernameValue = window.currentUser?.username || 'Player';

  function addChatMessage(username, message, timestamp = null) {
    if (!panel) return;
    const messagesContainer = panel.querySelector('.chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    const ts = timestamp || getTimestamp();
    messageEl.innerHTML = `
      <div class="message-header">
        <span class="username">${escapeHtml(username)}:</span>
        <span class="message-text">${escapeHtml(message)}</span>
        <span class="timestamp">${ts}</span>
      </div>
    `;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    messageHistory.push({ username, message, timestamp: timestamp || new Date().toISOString() });
    
    // Keep only the 50 most recent messages
    if (messageHistory.length > 50) {
      messageHistory = messageHistory.slice(-50);
      // Update DOM to show only last 50 messages
      const allMessages = messagesContainer.querySelectorAll('.chat-message, .system-message');
      if (allMessages.length > 50) {
        for (let i = 0; i < allMessages.length - 50; i++) {
          allMessages[i].remove();
        }
      }
    }
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function createStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .global-chat-panel {
        position: fixed;
        right: 16px;
        bottom: 16px;
        max-width: 400px;
        min-width: 280px;
        height: 280px;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(15, 23, 42, 0.12); /* Subtle dark blue-gray border */
        background: rgba(255, 255, 255, 0.85); /* Semi-transparent white background */
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18); /* Soft shadow with dark blue-gray tint */
        border-radius: 18px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(14px);
        transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
        z-index: 9999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .global-chat-panel.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      .global-chat-panel .chat-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid #e2e8f0; /* Light gray border */
        background: rgba(248, 250, 252, 0.41); /* Very light gray background */
        border-radius: 18px 18px 0 0;
        font-weight: 700;
        color: #111827; /* Dark gray text */
      }
      .global-chat-panel .chat-panel-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 12px 16px 16px;
        overflow: hidden; /* Prevent the body itself from scrolling */
        min-height: 0;
      }
      .global-chat-panel .chat-messages {
        flex: 1; /* Grow to fill available space */
        min-height: 0; /* CRITICAL: allows flex child to shrink below content size */
        overflow-y: auto; /* Enable internal scrollbar */
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-right: 4px;
      }
      .global-chat-panel .chat-message,
      .global-chat-panel .system-message {
        max-width: 100%;
        word-break: break-word;
        border-radius: 8px;
        padding: 6px 10px;
        margin-bottom: 4px;
        font-size: 0.85rem;
      }
      .global-chat-panel .chat-message {
        background: rgba(238, 242, 255, 0.60); /* Light blue background for user messages */
        color: #0f172a; /* Dark blue-gray text */
      }
      .global-chat-panel .system-message {
        background: rgba(248, 250, 252, 0.44); /* Light gray background for system messages */
        color: #475569; /* Medium gray text */
        font-size: 0.8rem;
      }
      .global-chat-panel .message-header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 4px;
        font-size: 0.75rem;
        color: #334155; /* Medium gray text for message headers */
        flex-wrap: wrap;
      }
      .global-chat-panel .username {
        font-weight: 600;
        flex-shrink: 0;
      }
      .global-chat-panel .message-text {
        flex: 1;
        line-height: 1.3;
        white-space: pre-wrap;
        font-size: 0.85rem;
        min-width: 0;
        word-break: break-word;
      }
      .global-chat-panel .timestamp {
        color: #64748b; /* Light gray text for timestamps */
        font-size: 0.7rem;
        flex-shrink: 0;
        margin-left: auto;
      }
      .global-chat-panel .chat-input-area {
        display: flex;
        gap: 10px;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0; /* Light gray border above input */
        flex: 0 0 auto; /* Don't grow or shrink - keep at bottom */
      }
      .global-chat-panel .chat-message-input {
        flex: 1;
        border: 1px solid #cbd5e1; /* Light gray border */
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
        background: #ffffff; /* White background */
        color: #0f172a; /* Dark blue-gray text */
        outline: none;
      }
      .global-chat-panel .chat-message-input:focus {
        border-color: #7c3aed; /* Purple border on focus */
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.16); /* Purple glow */
      }
      .global-chat-panel .chat-send-btn {
        border: none;
        border-radius: 999px;
        padding: 0 18px;
        background: #4f46e5; /* Indigo background */
        color: #ffffff; /* White text */
        cursor: pointer;
        height: 42px;
        font: inherit;
      }
      .global-chat-panel .chat-send-btn:hover {
        background: #4338ca; /* Darker indigo on hover */
      }
      .global-chat-panel .chat-panel-close {
        border: none;
        background: transparent;
        color: #475569; /* Medium gray */
        font-size: 26px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
      }
      .global-chat-panel .chat-panel-close:hover {
        color: #0f172a; /* Darker gray on hover */
      }
      /* Custom scrollbar for chat panel body */
      .global-chat-panel .chat-panel-body::-webkit-scrollbar {
        width: 8px;
      }
      .global-chat-panel .chat-panel-body::-webkit-scrollbar-track {
        background: transparent;
      }
      .global-chat-panel .chat-panel-body::-webkit-scrollbar-thumb {
        background: #cbd5e1; /* Light gray thumb */
        border-radius: 4px;
      }
      .global-chat-panel .chat-panel-body::-webkit-scrollbar-thumb:hover {
        background: #94a3b8; /* Darker gray on hover */
      }
      .global-chat-panel.minimized .chat-panel-body {
        display: none;
      }
      .global-chat-panel.minimized {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        height: auto;
        bottom: 10px;
      }
    `;

    document.head.appendChild(style);
  }

  function createPanel() {
    if (panel) return panel;

    createStyle();

    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'global-chat-panel';
    panel.innerHTML = `
      <div class="chat-panel-header">
        <div>💬 Chat</div>
        <button type="button" class="chat-panel-close" title="Minimize chat">&times;</button>
      </div>
      <div class="chat-panel-body">
        <div class="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" class="chat-message-input" placeholder="Type your message..." maxlength="500" />
          <button type="button" class="chat-send-btn">Send</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    const messagesContainer = panel.querySelector('.chat-messages');
    const messageInput = panel.querySelector('.chat-message-input');
    const sendBtn = panel.querySelector('.chat-send-btn');
    const closeBtn = panel.querySelector('.chat-panel-close');
    const header = panel.querySelector('.chat-panel-header');

    function addSystemMessage(text) {
      const messageEl = document.createElement('div');
      messageEl.className = 'system-message';
      messageEl.textContent = text;
      messagesContainer.appendChild(messageEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function sendMessage() {
      const message = messageInput.value.trim();
      const username = usernameValue;

      if (!message) return;

      console.log('Chat: Sending message:', { username, message });

      // Send message via WebSocket
      if (window.sendLobbyMessage) {
        console.log('Chat: WebSocket available, sending message');
        window.sendLobbyMessage({
          type: "chat_message",
          username: username,
          message: message,
          timestamp: getTimestamp()
        });
      } else {
        console.error('Chat: WebSocket not available, falling back to local display');
      }

      // Always add the message locally for immediate feedback
      addChatMessage(username, message);

      // Show the panel if not already open
      if (!panel.classList.contains('open')) {
        panel.classList.add('open');
      }

      messageInput.value = '';
      messageInput.focus();
    }

    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    closeBtn.addEventListener('click', minimizePanel);

    header.addEventListener('click', (e) => {
      if (panel.classList.contains('minimized') && e.target !== closeBtn) {
        showPanel();
      }
    });

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        minimizePanel();
      }
    });

    addSystemMessage('Chat ready. Press Esc to close.');
    return panel;
  }

  function showPanel() {
    const currentPanel = createPanel();
    currentPanel.classList.remove('minimized');
    currentPanel.classList.add('open');
    const messageInput = currentPanel.querySelector('.chat-message-input');
    if (messageInput) messageInput.focus();
  }

  function minimizePanel() {
    if (!panel) return;
    panel.classList.remove('open');
    panel.classList.add('minimized');
  }

  function openChatPanel() {
    showPanel();
  }

  // Expose functions globally
  window.openChatPanel = openChatPanel;
  window.closeChatPanel = minimizePanel;
  window.ChatPanel = {
    addMessage: function(username, message, timestamp) {
      console.log('Chat: Received message:', { username, message, timestamp });
      // Create panel if it doesn't exist yet
      if (!panel) createPanel();
      addChatMessage(username, message, timestamp);
      // Show the panel if it's not already open
      if (!panel.classList.contains('open')) {
        panel.classList.add('open');
      }
    }
  };

  // Initialize panel on load (but keep hidden)
  document.addEventListener('DOMContentLoaded', () => {
    createPanel();
  });

  window.addEventListener('keydown', (e) => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;

    if (typing) return;
    if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openChatPanel();
    }
  });
})();
