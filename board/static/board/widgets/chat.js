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
    
    // Keep only the 3 most recent messages
    if (messageHistory.length > 3) {
      messageHistory = messageHistory.slice(-3);
      // Update DOM to show only last 3 messages
      const allMessages = messagesContainer.querySelectorAll('.chat-message, .system-message');
      if (allMessages.length > 3) {
        for (let i = 0; i < allMessages.length - 3; i++) {
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
        border: 1px solid rgba(15, 23, 42, 0.12);
        background: rgba(255, 255, 255, 0.85);
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
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
        border-bottom: 1px solid #e2e8f0;
        background: rgba(248, 250, 252, 0.41);
        border-radius: 18px 18px 0 0;
        font-weight: 700;
        color: #111827;
      }
      .global-chat-panel .chat-panel-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 12px 16px 16px;
      }
      .global-chat-panel .chat-messages {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
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
        background: rgba(238, 242, 255, 0.41);
        color: #0f172a;
      }
      .global-chat-panel .system-message {
        background: rgba(248, 250, 252, 0.44);
        color: #475569;
        font-size: 0.8rem;
      }
      .global-chat-panel .message-header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 4px;
        font-size: 0.75rem;
        color: #334155;
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
        color: #64748b;
        font-size: 0.7rem;
        flex-shrink: 0;
        margin-left: auto;
      }
      .global-chat-panel .chat-input-area {
        display: flex;
        gap: 10px;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .global-chat-panel .chat-message-input {
        flex: 1;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
        background: #ffffff;
        color: #0f172a;
        outline: none;
      }
      .global-chat-panel .chat-message-input:focus {
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.16);
      }
      .global-chat-panel .chat-send-btn {
        border: none;
        border-radius: 999px;
        padding: 0 18px;
        background: #4f46e5;
        color: #ffffff;
        cursor: pointer;
        height: 42px;
        font: inherit;
      }
      .global-chat-panel .chat-send-btn:hover {
        background: #4338ca;
      }
      .global-chat-panel .chat-panel-close {
        border: none;
        background: transparent;
        color: #475569;
        font-size: 26px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
      }
      .global-chat-panel .chat-panel-close:hover {
        color: #0f172a;
      }
      @media (max-width: 680px) {
        .global-chat-panel {
          left: 10px;
          right: 10px;
          bottom: 10px;
          max-width: calc(100% - 20px);
          min-width: auto;
          height: 50vh;
        }
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
        <button type="button" class="chat-panel-close" title="Close chat">&times;</button>
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

    closeBtn.addEventListener('click', hidePanel);

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        hidePanel();
      }
    });

    addSystemMessage('Chat ready. Press Esc to close.');
    return panel;
  }

  function showPanel() {
    const currentPanel = createPanel();
    currentPanel.classList.add('open');
    const messageInput = currentPanel.querySelector('.chat-message-input');
    if (messageInput) messageInput.focus();
  }

  function hidePanel() {
    if (!panel) return;
    panel.classList.remove('open');
  }

  function openChatPanel() {
    showPanel();
  }

  // Expose functions globally
  window.openChatPanel = openChatPanel;
  window.closeChatPanel = hidePanel;
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
