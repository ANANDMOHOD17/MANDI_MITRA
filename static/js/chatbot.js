/**
 * Smart Mandi — Kisan AI Chatbot & Voice-First Vernacular Assistant
 * Features:
 * - Speech-to-Text (STT) Voice Recognition in Hindi, Marathi, Telugu, Punjabi, Gujarati, English
 * - Text-to-Speech (TTS) Voice Readout in native Indian accents
 * - Hands-Free Voice Action Commands (e.g. "Search Wheat", "Open Market Atlas")
 * - Dynamic Q&A for live mandi rates, logistics math, and MSP policies
 */

(function () {
    const MandiChatbot = {
        isOpen: false,
        isThinking: false,
        isListening: false,
        audioEnabled: true,
        recognition: null,
        synth: window.speechSynthesis || null,
        currentUtterance: null,
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
            this.loadSettings();
            this.renderWidget();
            this.initSpeechRecognition();
            this.bindEvents();
            this.loadInitialGreeting();

            // Sync with global i18n
            window.addEventListener('mandiLanguageChanged', (e) => {
                if (e.detail && e.detail.lang) {
                    this.currentLanguage = e.detail.lang;
                    this.updateRecognitionLanguage();
                }
            });

            const savedLang = localStorage.getItem('mandi_lang');
            if (savedLang) this.currentLanguage = savedLang;

            // Connect any global voice search buttons (e.g. on homepage)
            this.bindGlobalVoiceSearch();
        },

        loadSettings() {
            const savedAudio = localStorage.getItem('mandi_audio_enabled');
            if (savedAudio !== null) {
                this.audioEnabled = savedAudio === 'true';
            }
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
                                <span><span class="w-2 h-2 rounded-full bg-emerald-300 inline-block animate-pulse"></span> Voice & Price Advisor</span>
                            </div>
                        </div>
                        <div class="chat-header-actions">
                            <button id="chat-tts-toggle" class="chat-header-btn ${!this.audioEnabled ? 'muted' : ''}" title="Toggle Spoken Audio / आवाज़ बंद/चालू करें">
                                <i class="fa-solid ${this.audioEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}" id="tts-icon"></i>
                            </button>
                            <button id="chat-clear-btn" class="chat-header-btn" title="Clear Conversation / बातचीत साफ़ करें">
                                <i class="fa-solid fa-rotate-left"></i>
                            </button>
                            <button id="chat-close-btn" class="chat-header-btn" title="Close / बंद करें">
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

                    <!-- Input Footer with Voice & Mic Controls -->
                    <div class="chat-footer">
                        <button id="chat-mic-btn" class="chat-mic-btn" title="Speak your question / बोलकर पूछें (Mic)" aria-label="Voice input">
                            <i class="fa-solid fa-microphone"></i>
                        </button>
                        <input type="text" id="chat-user-input" class="chat-input" placeholder="Type or tap mic to speak / पूछें या बोलें..." autocomplete="off">
                        <button id="chat-send-btn" class="chat-send-btn" title="Send message">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <!-- Floating Launcher Button -->
                <button id="mandi-chat-launcher" title="Ask Kisan AI Assistant (Voice & Chat)" aria-label="Open Chatbot">
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

        /* ==========================================================================
           SPEECH RECOGNITION (STT) - "बोलकर पूछो"
           ========================================================================== */
        initSpeechRecognition() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                console.warn("Web Speech Recognition API not supported in this browser.");
                const micBtn = document.getElementById('chat-mic-btn');
                if (micBtn) {
                    micBtn.title = "Voice recognition not supported in this browser";
                    micBtn.style.opacity = "0.5";
                }
                return;
            }

            try {
                this.recognition = new SpeechRec();
                this.recognition.continuous = false;
                this.recognition.interimResults = true;
                this.updateRecognitionLanguage();

                this.recognition.onstart = () => {
                    this.isListening = true;
                    this.updateMicUI(true);
                };

                this.recognition.onresult = (event) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    const input = document.getElementById('chat-user-input');
                    if (input) {
                        input.value = finalTranscript || interimTranscript;
                    }

                    if (finalTranscript) {
                        this.stopListening();
                        // Execute voice command or send message directly
                        setTimeout(() => {
                            this.handleVoiceSubmission(finalTranscript.trim());
                        }, 200);
                    }
                };

                this.recognition.onerror = (event) => {
                    console.warn("Speech recognition error:", event.error);
                    this.stopListening();
                    if (event.error === 'not-allowed') {
                        this.appendMessage('bot', "🎙️ *Microphone permission was denied. Please allow microphone access in your browser settings to use voice input.*");
                    }
                };

                this.recognition.onend = () => {
                    this.isListening = false;
                    this.updateMicUI(false);
                };
            } catch (err) {
                console.error("Failed to initialize Speech Recognition:", err);
            }
        },

        getLocaleForLang(lang) {
            const map = {
                'hi': 'hi-IN',
                'mr': 'mr-IN',
                'te': 'te-IN',
                'pa': 'pa-IN',
                'gu': 'gu-IN',
                'en': 'en-IN'
            };
            return map[lang] || 'hi-IN'; // Default to Indian Hindi/English
        },

        updateRecognitionLanguage() {
            if (this.recognition) {
                this.recognition.lang = this.getLocaleForLang(this.currentLanguage);
            }
        },

        toggleVoiceInput() {
            if (!this.recognition) {
                alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Android Browser.");
                return;
            }

            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        },

        startListening() {
            if (!this.recognition) return;
            try {
                // Cancel any ongoing TTS before listening
                this.stopSpeaking();
                this.updateRecognitionLanguage();
                this.recognition.start();
            } catch (e) {
                console.warn("Recognition already started or error:", e);
            }
        },

        stopListening() {
            if (!this.recognition) return;
            try {
                this.recognition.stop();
            } catch (e) {}
            this.isListening = false;
            this.updateMicUI(false);
        },

        updateMicUI(active) {
            const micBtn = document.getElementById('chat-mic-btn');
            const input = document.getElementById('chat-user-input');
            const globalMicBtn = document.getElementById('btn-voice-search');

            if (micBtn) {
                if (active) {
                    micBtn.classList.add('recording');
                    micBtn.innerHTML = '<i class="fa-solid fa-waveform animate-pulse"></i>';
                } else {
                    micBtn.classList.remove('recording');
                    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                }
            }

            if (globalMicBtn) {
                if (active) {
                    globalMicBtn.classList.add('listening');
                    globalMicBtn.innerHTML = '<i class="fa-solid fa-microphone-lines mr-2 animate-bounce"></i> Listening...';
                } else {
                    globalMicBtn.classList.remove('listening');
                    globalMicBtn.innerHTML = '<i class="fa-solid fa-microphone mr-2"></i> बोलकर खोजें / Speak to Search';
                }
            }

            if (input && active) {
                input.placeholder = "Listening... Speak now / सुन रहा हूँ...";
            } else if (input) {
                input.placeholder = "Type or tap mic to speak / पूछें या बोलें...";
            }
        },

        handleVoiceSubmission(text) {
            if (!text) return;

            // Check for voice action commands (e.g., search actions, navigation)
            const textLower = text.toLowerCase();
            
            // 1. Voice Command: Open Atlas
            if (textLower.includes('atlas') || textLower.includes('एटलस') || textLower.includes('नक्शा')) {
                this.appendMessage('user', text);
                this.appendMessage('bot', "🗺️ *Opening National Market Atlas map...*");
                this.speakText("मार्केट एटलस खोला जा रहा है।");
                setTimeout(() => { window.location.href = '/atlas'; }, 900);
                return;
            }

            // 2. Voice Command: Live Prices
            if (textLower.includes('live') || textLower.includes('लाइव भाव') || textLower.includes('थेट')) {
                this.appendMessage('user', text);
                this.appendMessage('bot', "🔴 *Opening Live AGMARKNET Prices Feed...*");
                this.speakText("लाइव मंडी भाव खोले जा रहे हैं।");
                setTimeout(() => { window.location.href = '/live'; }, 900);
                return;
            }

            // 3. Voice Command: Auto search a crop on the homepage if present
            const commSelect = document.getElementById('commodity-select');
            const searchBtn = document.getElementById('btn-search');
            if (commSelect && searchBtn && (textLower.includes('search') || textLower.includes('खोज') || textLower.includes('दिखाओ') || textLower.includes('बेंच'))) {
                const cropMatches = {
                    'wheat': ['wheat', 'गेहूं', 'गहू'],
                    'mustard': ['mustard', 'सरसों', 'मोहरी'],
                    'cotton': ['cotton', 'कपास', 'कापूस'],
                    'onion': ['onion', 'प्याज', 'कांदा'],
                    'tomato': ['tomato', 'टमाटर', 'टोमॅटो'],
                    'potato': ['potato', 'आलू', 'बटाटा'],
                    'soybean': ['soybean', 'सोयाबीन'],
                    'rice': ['rice', 'चावल', 'धान', 'भात']
                };

                for (const [cid, aliases] of Object.entries(cropMatches)) {
                    if (aliases.some(a => textLower.includes(a))) {
                        // Find matching option in select
                        for (let opt of commSelect.options) {
                            if (opt.value && (opt.value.toLowerCase().includes(cid) || opt.text.toLowerCase().includes(cid))) {
                                commSelect.value = opt.value;
                                this.appendMessage('user', text);
                                this.appendMessage('bot', `🌾 *Setting crop to ${opt.text} and searching best mandis...*`);
                                this.speakText(`${opt.text} के लिए सर्वोत्तम मंडी खोजी जा रही है।`);
                                setTimeout(() => searchBtn.click(), 600);
                                return;
                            }
                        }
                    }
                }
            }

            // Regular question/answer pipeline
            this.sendMessage(text);
        },

        /* ==========================================================================
           TEXT-TO-SPEECH (TTS) - "बोलकर सुनाएं"
           ========================================================================== */
        toggleAudio() {
            this.audioEnabled = !this.audioEnabled;
            localStorage.setItem('mandi_audio_enabled', this.audioEnabled);

            const toggleBtn = document.getElementById('chat-tts-toggle');
            const icon = document.getElementById('tts-icon');

            if (toggleBtn && icon) {
                if (this.audioEnabled) {
                    toggleBtn.classList.remove('muted');
                    icon.classList.remove('fa-volume-xmark');
                    icon.classList.add('fa-volume-high');
                    this.speakText("आवाज़ चालू कर दी गई है।");
                } else {
                    toggleBtn.classList.add('muted');
                    icon.classList.remove('fa-volume-high');
                    icon.classList.add('fa-volume-xmark');
                    this.stopSpeaking();
                }
            }
        },

        stopSpeaking() {
            if (this.synth) {
                this.synth.cancel();
            }
        },

        speakText(rawText) {
            if (!this.audioEnabled || !this.synth) return;

            // Stop any ongoing speech
            this.stopSpeaking();

            // Clean text: strip markdown asterisks, hashtags, bullets, urls, math blocks
            let clean = rawText
                .replace(/\$\$(.*?)\$\$/g, ' ')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/#{1,6}\s+/g, '')
                .replace(/^[•\-\*]\s+/gm, '')
                .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
                .replace(/https?:\/\/\S+/g, '')
                .replace(/\n+/g, '. ')
                .trim();

            if (!clean) return;

            const utterance = new SpeechSynthesisUtterance(clean);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.lang = this.getLocaleForLang(this.currentLanguage);

            // Select appropriate regional Indian voice if available
            const voices = this.synth.getVoices();
            if (voices && voices.length > 0) {
                const targetLang = utterance.lang.toLowerCase();
                const matchedVoice = voices.find(v => 
                    v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.substring(0, 2)) ||
                    v.name.toLowerCase().includes('india') ||
                    v.name.toLowerCase().includes('hindi') ||
                    v.name.toLowerCase().includes('marathi')
                );
                if (matchedVoice) {
                    utterance.voice = matchedVoice;
                }
            }

            // Visual feedback on latest message bubble while speaking
            const lastBotBubble = document.querySelector('.message-row.bot:last-child .message-bubble');
            if (lastBotBubble) {
                const indicator = document.createElement('span');
                indicator.className = 'speech-bubble-indicator';
                indicator.id = 'active-speech-indicator';
                indicator.innerHTML = `
                    <span class="voice-wave-container">
                        <span class="voice-wave-bar"></span>
                        <span class="voice-wave-bar"></span>
                        <span class="voice-wave-bar"></span>
                        <span class="voice-wave-bar"></span>
                    </span>
                    <span>Speaking...</span>
                `;
                lastBotBubble.appendChild(indicator);

                utterance.onend = () => {
                    const el = document.getElementById('active-speech-indicator');
                    if (el) el.remove();
                };

                utterance.onerror = () => {
                    const el = document.getElementById('active-speech-indicator');
                    if (el) el.remove();
                };
            }

            this.synth.speak(utterance);
        },

        /* ==========================================================================
           EVENT BINDINGS & CHAT WORKFLOW
           ========================================================================== */
        bindEvents() {
            const launcher = document.getElementById('mandi-chat-launcher');
            const closeBtn = document.getElementById('chat-close-btn');
            const clearBtn = document.getElementById('chat-clear-btn');
            const sendBtn = document.getElementById('chat-send-btn');
            const micBtn = document.getElementById('chat-mic-btn');
            const ttsToggle = document.getElementById('chat-tts-toggle');
            const input = document.getElementById('chat-user-input');
            const suggestionsContainer = document.getElementById('chat-suggestions-container');

            if (launcher) launcher.addEventListener('click', () => this.toggleChat());
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeChat());
            if (clearBtn) clearBtn.addEventListener('click', () => this.clearChat());
            if (ttsToggle) ttsToggle.addEventListener('click', () => this.toggleAudio());
            if (micBtn) micBtn.addEventListener('click', () => this.toggleVoiceInput());

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

        bindGlobalVoiceSearch() {
            const globalMicBtn = document.getElementById('btn-voice-search');
            if (globalMicBtn) {
                globalMicBtn.addEventListener('click', () => {
                    this.openChat();
                    setTimeout(() => {
                        this.startListening();
                    }, 350);
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
                this.stopListening();
                this.stopSpeaking();
            }
        },

        clearChat() {
            this.stopSpeaking();
            this.messages = [];
            const container = document.getElementById('chat-messages-container');
            if (container) container.innerHTML = '';
            this.loadInitialGreeting();
        },

        loadInitialGreeting() {
            const lang = this.getCurrentLang();
            let greeting = "👋 **Namaste! I am Kisan AI Sahayak.**\n\nAsk or tap the **microphone 🎙️** to speak in your language! I can help with today's mandi prices, net profit calculations, or MSP benchmarks.";
            if (lang === 'hi') {
                greeting = "🙏 **नमस्ते! मैं किसान एआई सहायक हूँ।**\n\nटाइप करें या **माइक बटन 🎙️ दबाकर बोलें**! मुझसे आज के मंडी भाव, शुद्ध मुनाफे की गणना (परिवहन व कमीशन काटकर), या सरकारी एमएसपी (MSP) के बारे में पूछें।";
            } else if (lang === 'mr') {
                greeting = "🙏 **नमस्कार! मी कृषी एआई सहाय्यक आहे.**\n\nटाइप करा किंवा **माइक 🎙️ दाबून थेट बोला**! मला आजचे बाजारभाव, वाहतूक वजा जाता मिळणारा प्रत्यक्ष नफा किंवा हमीभावाबाबत (MSP) विचारा.";
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

            // Stop ongoing speech
            this.stopSpeaking();

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
                const botReply = data.reply || "Sorry, I couldn't process that query. Please try again.";
                this.appendMessage('bot', botReply);

                // Speak reply aloud via Text-to-Speech
                this.speakText(botReply);

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
