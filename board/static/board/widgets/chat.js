// ===== Chat Widget (solo test implementation) =====
Widget.builders.chat = function (props = {}) {
  const el = document.createElement("div");
  el.className = "widget chat-widget";
  el.dataset.type = "chat";
  el.innerHTML = `
    <div class="header">
      <div>💬 Chat</div>
      <button class="close" title="Remove">&times;</button>
    </div>
    <div class="body">
      <div class="chat-messages" id="chat-messages">
        <div class="system-message">Chat started. Type a message below!</div>
      </div>
      <div class="chat-input-area">
        <div class="username-input">
          <label for="chat-username">Name:</label>
          <input type="text" id="chat-username" class="username" value="Player" maxlength="20" />
        </div>
        <div class="message-input-container">
          <input type="text" class="message-input" placeholder="Type your message..." maxlength="500" />
          <button class="send-btn">Send</button>
        </div>
      </div>
    </div>
  `;

  // Make draggable via header
  makeDraggable(el, el.querySelector(".header"));

  // Set initial size
  el.style.width = props.width ? props.width + "px" : "280px"; // Match standard widget width
  el.style.height = props.height ? props.height + "px" : "400px";
  el.style.minWidth = "260px"; // Match standard widget width
  el.style.minHeight = "250px";
  el.style.resize = "both";
  el.style.overflow = "hidden";

  // Get elements
  const messagesContainer = el.querySelector(".chat-messages");
  const messageInput = el.querySelector(".message-input");
  const sendBtn = el.querySelector(".send-btn");
  const usernameInput = el.querySelector(".username");

  // Chat message storage (for this widget instance)
  let messageHistory = props.messages || [];

  // Helper function to format timestamp
  function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Helper function to sanitize HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to add a message to the chat
  function addMessage(username, message, isSystem = false) {
    const messageEl = document.createElement("div");
    messageEl.className = isSystem ? "system-message" : "chat-message";
    
    if (isSystem) {
      messageEl.innerHTML = `<span class="system-text">${escapeHtml(message)}</span>`;
    } else {
      const timestamp = getTimestamp();
      messageEl.innerHTML = `
        <div class="message-header">
          <span class="username">${escapeHtml(username)}</span>
          <span class="timestamp">${timestamp}</span>
        </div>
        <div class="message-text">${escapeHtml(message)}</div>
      `;
      
      // Store in history
      messageHistory.push({
        username: username,
        message: message,
        timestamp: new Date().toISOString()
      });
    }

    messagesContainer.appendChild(messageEl);
    
    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Function to send a message
  function sendMessage() {
    const message = messageInput.value.trim();
    const username = usernameInput.value.trim() || "Player";

    if (!message) return;

    addMessage(username, message);
    messageInput.value = "";
  }

  // Function to clear chat
  function clearChat() {
    messagesContainer.innerHTML = '<div class="system-message">Chat cleared.</div>';
    messageHistory = [];
  }

  // Event listeners
  sendBtn.addEventListener("click", sendMessage);

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      messageInput.focus();
    }
  });

  // Close button
  el.querySelector(".close").addEventListener("click", () => {
    el.remove();
  });

  // Load existing messages if any
  if (messageHistory.length > 0) {
    messagesContainer.innerHTML = '<div class="system-message">Chat restored.</div>';
    messageHistory.forEach(msg => {
      addMessage(msg.username, msg.message);
    });
  }

  // Focus message input when widget is created
  setTimeout(() => {
    messageInput.focus();
  }, 100);

  // Expose message history for save/load functionality
  el.getChatData = function() {
    return {
      messages: messageHistory,
      username: usernameInput.value
    };
  };

  el.setChatData = function(data) {
    if (data.messages) {
      messageHistory = data.messages;
      clearChat();
      data.messages.forEach(msg => {
        addMessage(msg.username, msg.message);
      });
    }
    if (data.username) {
      usernameInput.value = data.username;
    }
  };

  return el;
};