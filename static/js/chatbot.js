/**
 * Smart Mandi — Kisan AI Chatbot Assistant Widget
 * Handles interactive Q&A for real-time prices, calculations, platform usage, and MSP.
 */

(function () {
    const MandiChatbot = {
        isOpen: false,
        isThinking: false,
        messages: [],
        currentLanguage: 'en',

        defaultSuggestions: [
            "🌾 Today's Wheat Price",
            "🚛 How is Net Return calculated?",
            "📍 How to find best mandi?",
            "🗺️ What is Market Atlas?",
            "🇮🇳 What is MSP benchmark?"
        ],

        init() {
            this.ensureStyles();
            this.renderWidget();
            this.bindEvents();
            this.loadInitialGreeting();

            // Sync with global i18n
            window.addEventListener('mandiLanguageChanged', (e) => {
                if (e.detail && e.detail.lang) {
                    this.currentLanguage = e.detail.lang;
                }
            });

            const savedLang = localStorage.getItem('mandi_lang');
            if (savedLang) this.currentLanguage = savedLang;
        },

        ensureStyles() {
            if (!document.getElementById('mandi-chatbot-css')) {
                const link = document.createElement('link');
                link.id = 'mandi-chatbot-css';
                link.rel = 'stylesheet';
                link.href = '/static/css/chatbot.css';
                document.head.appendChild(link);
            }
        },

        renderWidget() {
            if (document.getElementById('mandi-chat-container')) return;

            const container = document.createElement('div');
            container.id = 'mandi-chat-container';
            container.innerHTML = `
                <!-- Chat Window -->
                <div id="mandi-chat-window" class="minimized" role="dialog" aria-label="Smart Mandi AI Assistant">
                    <!-- Header -->
                    <div class="chat-header">
                        <div class="chat-header-info">
                            <div class="chat-avatar">🌱</div>
                            <div class="chat-header-text">
                                <h3>Kisan AI Sahayak</h3>
                                <span><span class="w-2 h-2 rounded-full bg-emerald-300 inline-block animate-pulse"></span> Online • Agricultural Advisor</span>
                            </div>
                        </div>
                        <div class="chat-header-actions">
                            <button id="chat-clear-btn" class="chat-header-btn" title="Clear Conversation">
                                <i class="fa-solid fa-rotate-left"></i>
                            </button>
                            <button id="chat-close-btn" class="chat-header-btn" title="Close Chat">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Dynamic Suggestions Carousel -->
                    <div class="chat-suggestions" id="chat-suggestions-container">
                        ${this.renderSuggestions(this.defaultSuggestions)}
                    </div>

                    <!-- Messages List -->
                    <div class="chat-messages" id="chat-messages-container">
                        <!-- Messages dynamically inserted here -->
                    </div>

                    <!-- Input Footer -->
                    <div class="chat-footer">
                        <input type="text" id="chat-user-input" class="chat-input" placeholder="Ask about prices, net return, MSP..." autocomplete="off">
                        <button id="chat-send-btn" class="chat-send-btn" title="Send message">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <!-- Floating Launcher Button -->
                <button id="mandi-chat-launcher" title="Ask Kisan AI Assistant" aria-label="Open Chatbot">
                    <div class="pulse-ring"></div>
                    <span class="badge-online"></span>
                    <i class="fa-solid fa-robot text-2xl" id="launcher-icon"></i>
                </button>
            `;

            document.body.appendChild(container);
        },

        renderSuggestions(suggestions) {
            if (!suggestions || suggestions.length === 0) return '';
            return suggestions.map(s => `
                <button class="suggestion-chip" data-query="${this.escapeHtml(s)}">${this.escapeHtml(s)}</button>
            `).join('');
        },

        bindEvents() {
            const launcher = document.getElementById('mandi-chat-launcher');
            const closeBtn = document.getElementById('chat-close-btn');
            const clearBtn = document.getElementById('chat-clear-btn');
            const sendBtn = document.getElementById('chat-send-btn');
            const input = document.getElementById('chat-user-input');
            const suggestionsContainer = document.getElementById('chat-suggestions-container');

            if (launcher) launcher.addEventListener('click', () => this.toggleChat());
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeChat());
            if (clearBtn) clearBtn.addEventListener('click', () => this.clearChat());

            if (sendBtn) {
                sendBtn.addEventListener('click', () => {
                    const text = input.value.trim();
                    if (text) {
                        this.sendMessage(text);
                        input.value = '';
                    }
                });
            }

            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const text = input.value.trim();
                        if (text) {
                            this.sendMessage(text);
                            input.value = '';
                        }
                    }
                });
            }

            if (suggestionsContainer) {
                suggestionsContainer.addEventListener('click', (e) => {
                    const chip = e.target.closest('.suggestion-chip');
                    if (chip) {
                        const query = chip.getAttribute('data-query');
                        if (query) {
                            this.sendMessage(query);
                        }
                    }
                });
            }
        },

        toggleChat() {
            if (this.isOpen) {
                this.closeChat();
            } else {
                this.openChat();
            }
        },

        openChat() {
            const win = document.getElementById('mandi-chat-window');
            const icon = document.getElementById('launcher-icon');
            if (win) {
                win.classList.remove('minimized');
                this.isOpen = true;
                if (icon) {
                    icon.classList.remove('fa-robot');
                    icon.classList.add('fa-chevron-down');
                }
                const input = document.getElementById('chat-user-input');
                if (input) setTimeout(() => input.focus(), 250);
                this.scrollToBottom();
            }
        },

        closeChat() {
            const win = document.getElementById('mandi-chat-window');
            const icon = document.getElementById('launcher-icon');
            if (win) {
                win.classList.add('minimized');
                this.isOpen = false;
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-robot');
                }
            }
        },

        clearChat() {
            this.messages = [];
            const container = document.getElementById('chat-messages-container');
            if (container) container.innerHTML = '';
            this.loadInitialGreeting();
        },

        loadInitialGreeting() {
            const lang = this.getCurrentLang();
            let greeting = "👋 **Namaste! I am Kisan AI Sahayak.**\n\nAsk me about today's mandi prices, net profit calculations, Market Atlas, or government MSP benchmarks!";
            if (lang === 'hi') {
                greeting = "🙏 **नमस्ते! मैं किसान एआई सहायक हूँ।**\n\nमुझसे आज के मंडी भाव, शुद्ध मुनाफे की गणना (परिवहन व कमीशन काटकर), या सरकारी एमएसपी (MSP) के बारे में पूछें!";
            } else if (lang === 'mr') {
                greeting = "🙏 **नमस्कार! मी कृषी एआई सहाय्यक आहे.**\n\nमला आजचे बाजारभाव, वाहतूक वजा जाता मिळणारा प्रत्यक्ष नफा किंवा हमीभावाबाबत (MSP) विचारा!";
            }
            this.appendMessage('bot', greeting);
        },

        getCurrentLang() {
            if (typeof MandiI18n !== 'undefined' && MandiI18n.currentLang) {
                return MandiI18n.currentLang;
            }
            return localStorage.getItem('mandi_lang') || 'en';
        },

        async sendMessage(text) {
            if (this.isThinking) return;

            // Append User message
            this.appendMessage('user', text);

            // Show typing indicator
            this.showTyping();
            this.isThinking = true;

            const sendBtn = document.getElementById('chat-send-btn');
            if (sendBtn) sendBtn.disabled = true;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        language: this.getCurrentLang()
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }

                const data = await response.json();
                this.hideTyping();
                this.appendMessage('bot', data.reply || "Sorry, I couldn't process that query. Please try again.");

                // Update suggested prompt chips if provided
                if (data.suggestions && data.suggestions.length > 0) {
                    const suggestionsContainer = document.getElementById('chat-suggestions-container');
                    if (suggestionsContainer) {
                        suggestionsContainer.innerHTML = this.renderSuggestions(data.suggestions);
                    }
                }
            } catch (err) {
                console.error("Chat error:", err);
                this.hideTyping();
                this.appendMessage('bot', "⚠️ *Unable to reach server right now. Please check your connection or try again in a few moments.*");
            } finally {
                this.isThinking = false;
                if (sendBtn) sendBtn.disabled = false;
            }
        },

        appendMessage(sender, text) {
            const container = document.getElementById('chat-messages-container');
            if (!container) return;

            const row = document.createElement('div');
            row.className = `message-row ${sender}`;

            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const formattedText = this.formatMarkdown(text);

            row.innerHTML = `
                <div class="message-bubble">
                    ${formattedText}
                    <div class="message-time">${timeStr}</div>
                </div>
            `;

            container.appendChild(row);
            this.scrollToBottom();
        },

        showTyping() {
            const container = document.getElementById('chat-messages-container');
            if (!container) return;

            const indicator = document.createElement('div');
            indicator.id = 'chat-typing-indicator';
            indicator.className = 'message-row bot';
            indicator.innerHTML = `
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            `;
            container.appendChild(indicator);
            this.scrollToBottom();
        },

        hideTyping() {
            const el = document.getElementById('chat-typing-indicator');
            if (el) el.remove();
        },

        scrollToBottom() {
            const container = document.getElementById('chat-messages-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        },

        formatMarkdown(text) {
            if (!text) return '';

            // Escape HTML
            let escaped = this.escapeHtml(text);

            // Bold **text**
            escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Italic *text*
            escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');

            // Bullet points • or -
            escaped = escaped.replace(/^[•\-\*]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');

            // Math $$...$$ or LaTeX block
            escaped = escaped.replace(/\$\$(.*?)\$\$/g, '<div class="bg-gray-100 p-2 my-2 rounded font-mono text-xs border border-gray-300 overflow-x-auto">$1</div>');

            // Newlines to <br> or paragraphs
            escaped = escaped.replace(/\n\n+/g, '</p><p class="mt-2">');
            escaped = escaped.replace(/\n/g, '<br>');

            return `<p>${escaped}</p>`;
        },

        escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    };

    // Auto initialize on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MandiChatbot.init());
    } else {
        MandiChatbot.init();
    }

    // Attach to global window
    window.MandiChatbot = MandiChatbot;
})();
