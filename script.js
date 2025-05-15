document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearBtn = document.querySelector('.clear-btn');
    const attachmentBtn = document.querySelector('.attachment-btn');
    const voiceBtn = document.querySelector('.voice-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHistory = document.getElementById('chat-history');
    const currentChatTitle = document.getElementById('current-chat-title');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sidebar = document.querySelector('.sidebar');

    // State management
    let chats = [];
    let currentChatId = null;
    let isDarkTheme = true;

    // Initialize app
    initApp();
    
    // Initialize syntax highlighting
    hljs.configure({
        languages: ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'markdown']
    });
    
    // Initialize theme
    loadTheme();

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    clearBtn.addEventListener('click', clearCurrentChat);
    attachmentBtn.addEventListener('click', handleAttachment);
    voiceBtn.addEventListener('click', handleVoice);
    newChatBtn.addEventListener('click', createNewChat);
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Auto resize textarea as user types
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
    });

    // Functions
    function initApp() {
        // Load chats from localStorage
        loadChats();

        // If no chats exist, create a new one
        if (chats.length === 0) {
            createNewChat();
        } else {
            // Load the most recent chat
            loadChat(chats[0].id);
        }

        // Render chat history sidebar
        renderChatHistory();
    }

    function loadChats() {
        const savedChats = localStorage.getItem('genosChats');
        if (savedChats) {
            chats = JSON.parse(savedChats);
        }
    }

    function saveChats() {
        localStorage.setItem('genosChats', JSON.stringify(chats));
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('genosTheme');
        if (savedTheme) {
            isDarkTheme = savedTheme === 'dark';
        }
        updateThemeUI();
    }
    
    function saveTheme() {
        localStorage.setItem('genosTheme', isDarkTheme ? 'dark' : 'light');
    }
    
    function toggleTheme() {
        isDarkTheme = !isDarkTheme;
        updateThemeUI();
        saveTheme();
        
        // Add animation
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }
    
    function updateThemeUI() {
        document.body.classList.toggle('light-theme', !isDarkTheme);
        themeToggleBtn.innerHTML = isDarkTheme ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function createNewChat() {
        // Create a new chat object
        const newChat = {
            id: Date.now().toString(),
            title: 'New Conversation',
            messages: [],
            createdAt: new Date().toISOString()
        };

        // Add to the beginning of chats array
        chats.unshift(newChat);
        saveChats();

        // Update UI
        renderChatHistory();
        loadChat(newChat.id);
    }

    function renderChatHistory() {
        chatHistory.innerHTML = '';
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
            chatItem.dataset.id = chat.id;
            
            // Get the title or use the first message content or default
            let title = chat.title;
            if (title === 'New Conversation' && chat.messages.length > 0) {
                // Use first user message as title
                const firstUserMessage = chat.messages.find(msg => msg.sender === 'You');
                if (firstUserMessage) {
                    // Use first sentence or partial sentence for title
                    let messageTitle = firstUserMessage.content.split(/[.!?]/)[0].trim();
                    // Limit to 40 characters max
                    title = messageTitle.substring(0, 40) + (messageTitle.length > 40 ? '...' : '');
                }
            }
            
            chatItem.innerHTML = `
                <div class="chat-item-content">
                    <i class="far fa-comment"></i>
                    <span class="chat-item-title">${title}</span>
                </div>
                <button class="delete-chat-btn" title="Delete conversation">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            // Add click event for selecting the chat
            chatItem.querySelector('.chat-item-content').addEventListener('click', () => {
                loadChat(chat.id);
            });
            
            // Add click event for delete button
            chatItem.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the chat selection
                deleteChat(chat.id);
            });
            
            chatHistory.appendChild(chatItem);
        });
    }

    function loadChat(chatId) {
        // Find the chat
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        // Update current chat
        currentChatId = chatId;
        currentChatTitle.textContent = chat.title;

        // Clear messages area
        chatMessages.innerHTML = '';

        // Display messages
        if (chat.messages.length === 0) {
            // Add welcome header for new chat
            const welcomeHeader = document.createElement('div');
            welcomeHeader.className = 'welcome-header';
            welcomeHeader.innerHTML = '<h1>What can I help with?</h1>';
            chatMessages.appendChild(welcomeHeader);
            
            // Add welcome message if chat is empty
            const welcomeMessage = {
                sender: 'GENOS',
                content: 'Hi, I\'m Genos, your AI assistant. I\'m here to provide information, answer your questions, and assist with tasks.',
                timestamp: new Date().toISOString()
            };
            chat.messages.push(welcomeMessage);
            saveChats();
            addMessageToDOM('GENOS', welcomeMessage.content, 'ai-message', welcomeMessage.timestamp);
        } else {
            // Display existing messages
            chat.messages.forEach(msg => {
                addMessageToDOM(msg.sender, msg.content, msg.sender === 'You' ? 'user-message' : 'ai-message', msg.timestamp);
            });
        }

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Update active state in sidebar
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === chatId);
        });

        // Close mobile sidebar after selection
        sidebar.classList.remove('show');
    }

    // Webhook URL for n8n workflow
    const WEBHOOK_URL = 'https://my-automations.app.n8n.cloud/webhook-test/my-workflow';

    // Function to send message to n8n workflow
    async function sendMessageToAPI(message) {
        try {
            console.log('Sending message to API:', message);
            
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message
                })
            });
            
            // Get response text
            const responseText = await response.text();
            
            // No need to parse as JSON, just return as text
            return { text: responseText };
            
        } catch (error) {
            console.error('Error in sendMessageToAPI:', error);
            throw error;
        }
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Remove welcome header if exists
        const welcomeHeader = document.querySelector('.welcome-header');
        if (welcomeHeader) {
            chatMessages.removeChild(welcomeHeader);
        }

        // Add user message to the chat
        const userMessage = {
            sender: 'You',
            content: message,
            timestamp: new Date().toISOString()
        };
        
        // Add to current chat
        const currentChat = chats.find(c => c.id === currentChatId);
        if (currentChat) {
            currentChat.messages.push(userMessage);
            
            // Update chat title if it's the first message - use a more meaningful title based on message content
            if (currentChat.title === 'New Conversation' && currentChat.messages.length === 1) {
                // Get first sentence or partial sentence for title
                let title = message.split(/[.!?]/)[0].trim();
                // Limit to 40 characters max
                title = title.substring(0, 40) + (title.length > 40 ? '...' : '');
                currentChat.title = title;
                currentChatTitle.textContent = title;
            }
            
            saveChats();
            renderChatHistory();
        }
        
        // Add message to DOM
        addMessageToDOM('You', message, 'user-message');
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Simulate AI thinking with loading indicator
        const loadingEl = document.createElement('div');
        loadingEl.className = 'message ai-message loading';
        loadingEl.innerHTML = `
            <div class="message-header ai-header">
                <i class="fas fa-robot"></i> GENOS
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(loadingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // Show loading state
            const response = await sendMessageToAPI(message);
            
            // Remove loading message
            chatMessages.removeChild(loadingEl);

            // Add AI response to chat history and DOM
            if (response) {
                // Log the response for debugging
                console.log('Processing response:', response);
                
                // Extract the message from the response
                let messageText;
                if (typeof response === 'string') {
                    messageText = response;
                } else if (typeof response === 'object') {
                    // Try different possible response formats
                    messageText = response.text || response.message || response.response || 
                                response.content || response.answer || response.result;
                    
                    // If we still don't have text, stringify the whole response
                    if (!messageText && Object.keys(response).length > 0) {
                        messageText = JSON.stringify(response, null, 2);
                    }
                }
                
                // Fallback if we still don't have a message
                if (!messageText) {
                    messageText = 'Received empty response from server';
                }
                
                const aiMessage = {
                    sender: 'GENOS',
                    content: messageText,
                    timestamp: new Date().toISOString()
                };
                
                // Add to current chat
                const currentChat = chats.find(c => c.id === currentChatId);
                if (currentChat) {
                    currentChat.messages.push(aiMessage);
                    saveChats();
                }
                
                // Add to DOM
                addMessageToDOM('GENOS', messageText, 'ai-message', aiMessage.timestamp);
            } else {
                const errorMessage = 'Sorry, I encountered an error processing your request.';
                addMessageToDOM('GENOS', errorMessage, 'ai-message');
            }
        } catch (error) {
            console.error('Error:', error);
            chatMessages.removeChild(loadingEl);
            const errorMessage = 'Sorry, I encountered an error processing your request.';
            addMessageToDOM('GENOS', errorMessage, 'ai-message');
        }
    }
    
    function addMessageToDOM(sender, content, className, timestamp = null) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${className}`;
        
        const time = timestamp ? new Date(timestamp) : new Date();
        const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let icon = '';
        if (className === 'user-message') {
            icon = '<i class="fas fa-user"></i>';
        } else {
            icon = '<i class="fas fa-robot"></i>';
        }
        
        messageEl.innerHTML = `
            <div class="message-header ${className === 'user-message' ? 'user-header' : 'ai-header'}">
                ${icon} ${sender}
            </div>
            <div class="message-content">${formatMessage(content)}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Apply syntax highlighting to code blocks
        messageEl.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    
    function formatMessage(text) {
        // Convert markdown code blocks
        text = text.replace(/```(\w*)([\s\S]*?)```/g, function(match, language, code) {
            return `<pre><code class="language-${language || 'plaintext'}">${code.trim()}</code></pre>`;
        });
        
        // Convert inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
    
    function clearCurrentChat() {
        if (!currentChatId) return;
        
        // Confirm before clearing
        if (confirm('Are you sure you want to clear this chat?')) {
            const currentChat = chats.find(c => c.id === currentChatId);
            if (currentChat) {
                currentChat.messages = [];
                currentChat.title = 'New Conversation';
                saveChats();
                
                // Update UI
                chatMessages.innerHTML = '';
                
                // Add welcome header for empty chat
                const welcomeHeader = document.createElement('div');
                welcomeHeader.className = 'welcome-header';
                welcomeHeader.innerHTML = '<h1>What can I help with?</h1>';
                chatMessages.appendChild(welcomeHeader);
                
                currentChatTitle.textContent = 'New Conversation';
                renderChatHistory();
            }
        }
    }
    
    function handleAttachment() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.multiple = true;
        fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.png,.gif,.xls,.xlsx,.ppt,.pptx,.zip,.rar';
        
        // Append to body
        document.body.appendChild(fileInput);
        
        // Trigger click to open file dialog
        fileInput.click();
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const fileNames = Array.from(this.files).map(file => file.name).join(', ');
                const message = `I'm attaching: ${fileNames}`;
                
                // Remove welcome header if exists
                const welcomeHeader = document.querySelector('.welcome-header');
                if (welcomeHeader) {
                    chatMessages.removeChild(welcomeHeader);
                }
                
                // Add to current chat and DOM
                const userMessage = {
                    sender: 'You',
                    content: message,
                    timestamp: new Date().toISOString()
                };
                
                const currentChat = chats.find(c => c.id === currentChatId);
                if (currentChat) {
                    currentChat.messages.push(userMessage);
                    
                    // Update chat title if it's the first message
                    if (currentChat.title === 'New Conversation' && currentChat.messages.length === 1) {
                        currentChat.title = `Attachments: ${fileNames.substring(0, 30)}${fileNames.length > 30 ? '...' : ''}`;
                        currentChatTitle.textContent = currentChat.title;
                    }
                    
                    saveChats();
                    renderChatHistory();
                }
                
                addMessageToDOM('You', message, 'user-message');
                
                // Simulate AI thinking with loading indicator
                const loadingEl = document.createElement('div');
                loadingEl.className = 'message ai-message loading';
                loadingEl.innerHTML = `
                    <div class="message-header ai-header">
                        <i class="fas fa-robot"></i> GENOS
                    </div>
                    <div class="message-content">
                        <div class="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                `;
                chatMessages.appendChild(loadingEl);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Get AI response with attachment context
                getAIResponse(`The user has attached the following files: ${fileNames}. Please acknowledge these attachments.`, loadingEl);
            }
            
            // Remove the input from the DOM
            document.body.removeChild(fileInput);
        });
    }
    
    function handleVoice() {
        // Check if Speech Recognition is supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            // Configure recognition
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            // Create and show recording indicator
            const voiceBtn = document.querySelector('.voice-btn');
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
            
            // Start listening
            recognition.start();
            
            // Handle speech results
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                chatInput.value = transcript;
                chatInput.focus();
                
                // Visual feedback that recording is complete
                voiceBtn.classList.remove('recording');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            };
            
            // Handle end of speech recording
            recognition.onend = function() {
                voiceBtn.classList.remove('recording');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            };
            
            // Handle errors
            recognition.onerror = function(event) {
                console.error('Speech recognition error', event);
                voiceBtn.classList.remove('recording');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                
                // Show error message
                alert('Speech recognition failed. Please try again or type your message.');
            };
        } else {
            // Fallback if speech recognition not supported
            alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
            
            // For demo purposes, simulate voice input
            const voiceTexts = [
                "Tell me about coding in JavaScript",
                "How do I create a React component?",
                "Can you explain async/await in JavaScript?"
            ];
            
            const randomVoiceText = voiceTexts[Math.floor(Math.random() * voiceTexts.length)];
            chatInput.value = randomVoiceText;
            chatInput.focus();
        }
    }

    function deleteChat(chatId) {
        // Confirm before deleting
        if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
            // Add visual feedback - fade out the chat item before removing
            const chatElement = document.querySelector(`.chat-item[data-id="${chatId}"]`);
            if (chatElement) {
                chatElement.classList.add('deleting');
                
                // Short delay for animation before actual deletion
                setTimeout(() => {
                    // Find the chat index
                    const chatIndex = chats.findIndex(c => c.id === chatId);
                    
                    if (chatIndex !== -1) {
                        // Remove the chat from array
                        chats.splice(chatIndex, 1);
                        
                        // Immediately save to localStorage for permanent deletion
                        saveChats();
                        
                        // If we're deleting the current chat, load another one
                        if (chatId === currentChatId) {
                            if (chats.length > 0) {
                                // Load the first available chat
                                loadChat(chats[0].id);
                            } else {
                                // No more chats, create a new one
                                createNewChat();
                            }
                        } else {
                            // Just update the UI
                            renderChatHistory();
                        }
                        
                        console.log(`Chat ${chatId} permanently deleted.`);
                    }
                }, 200); // Short delay for animation
            }
        }
    }
});

// Add CSS for dynamic elements
const style = document.createElement('style');
style.textContent = `
    .typing-indicator span {
        width: 5px;
        height: 5px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        border-radius: 50%;
        animation: typing-bounce 1.3s infinite ease-in-out;
        opacity: 0.8;
    }
    
    .typing-indicator span:nth-child(1) {
        animation-delay: 0s;
    }
    
    .typing-indicator span:nth-child(2) {
        animation-delay: 0.15s;
    }
    
    .typing-indicator span:nth-child(3) {
        animation-delay: 0.3s;
    }
    
    .theme-transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        opacity: 0;
        z-index: 9999;
        pointer-events: none;
        animation: flash 0.3s ease-out;
    }
    
    .welcome-header {
        text-align: center;
        padding: 40px 0;
    }
    
    .welcome-header h1 {
        font-size: 32px;
        font-weight: 600;
        background: linear-gradient(135deg, var(--primary-color), var(--tertiary-color));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 10px;
        opacity: 0.9;
    }
    
    @keyframes flash {
        0% {
            opacity: 0;
        }
        50% {
            opacity: 0.5;
        }
        100% {
            opacity: 0;
        }
    }
    
    .light-theme {
        --primary-color: #6366f1;
        --secondary-color: #8b5cf6;
        --tertiary-color: #9d5cff;
        --accent-color: #10b981;
        --background-color: #f8fafc;
        --chat-bg: #ffffff;
        --user-message-bg: rgba(220, 230, 255, 0.7);
        --ai-message-bg: rgba(240, 240, 255, 0.7);
        --border-color: rgba(226, 232, 240, 0.8);
        --text-color: #334155;
        --placeholder-color: #94a3b8;
        --shadow-color: rgba(0, 0, 0, 0.1);
        --sidebar-bg: rgba(240, 240, 250, 0.8);
        --sidebar-hover: rgba(226, 232, 240, 0.8);
        --sidebar-text: #334155;
        --glass-highlight: rgba(255, 255, 255, 0.7);
        --glass-border: rgba(226, 232, 240, 0.8);
    }
`;
document.head.appendChild(style);