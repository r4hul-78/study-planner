import { store } from '../state/store.js';
import { apiClient } from '../services/apiClient.js';
import { renderMarkdown } from '../utils/sanitize.js';
import { calculateProgressMetrics } from '../services/progressService.js';

let chatHistory = [
  {
    role: 'model',
    text: "Hello! I'm your **StudyPilot AI Assistant**. I can explain challenging concepts, break down complex topics into bite-sized tasks, generate custom practice questions, and suggest high-yield revision strategies. How can I assist your study today?"
  }
];

let activeContext = {};

export function renderAssistant() {
  const state = store.getState();
  const metrics = calculateProgressMetrics(state);

  // Suggested Prompts
  const suggestions = [
    'What should I study today?',
    'Help me revise my weakest topic.',
    'Explain a difficult concept in simple terms.',
    'Generate 3 practice questions for my upcoming exam.',
    'Create a 30-minute revision plan.'
  ];

  return `
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h2>AI Study Assistant</h2>
          <p>Context-aware academic mentor powered by Google Gemini.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-clear-chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          <span>Clear Chat</span>
        </button>
      </div>

      <div class="chat-container">
        <!-- Messages Area -->
        <div class="chat-messages" id="chat-messages">
          ${chatHistory.map(msg => `
            <div class="chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}">
              ${msg.role === 'user' ? msg.text : renderMarkdown(msg.text)}
            </div>
          `).join('')}
        </div>

        <!-- Quick Prompt Chips -->
        <div class="prompt-chips">
          ${suggestions.map(s => `
            <button class="chip prompt-chip" data-prompt="${s}">${s}</button>
          `).join('')}
        </div>

        <!-- Chat Input Bar -->
        <div class="chat-input-bar">
          <input
            type="text"
            id="chat-input"
            class="form-input"
            placeholder="Ask a question, request practice questions, or ask for a study breakdown..."
            autocomplete="off"
          />
          <button class="btn btn-primary" id="btn-send-chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function bindAssistantEvents(container) {
  const messagesEl = container.querySelector('#chat-messages');
  const inputEl = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#btn-send-chat');
  const clearBtn = container.querySelector('#btn-clear-chat');

  function scrollToBottom() {
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  scrollToBottom();

  async function handleSend(userMessage) {
    const text = userMessage || inputEl.value.trim();
    if (!text) return;

    if (!userMessage) inputEl.value = '';

    // Append user message
    chatHistory.push({ role: 'user', text });
    appendBubble('user', text);
    scrollToBottom();

    // Disable input while generating
    sendBtn.disabled = true;
    inputEl.disabled = true;

    // Show typing placeholder
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble assistant';
    typingBubble.innerHTML = `<span class="spinner" style="display:inline-block;width:12px;height:12px;margin-right:6px;"></span> Gemini is thinking...`;
    messagesEl.appendChild(typingBubble);
    scrollToBottom();

    try {
      // Build lightweight student context
      const state = store.getState();
      const metrics = calculateProgressMetrics(state);
      const topWeak = metrics.weakTopics[0];
      const upcomingExam = metrics.subjectMetrics.find(s => s.daysUntilExam !== null && s.daysUntilExam >= 0);

      const contextPayload = {
        studentLevel: state.profile?.academicLevel,
        course: state.profile?.course,
        topicTitle: topWeak?.title,
        subjectName: topWeak?.subjectName || upcomingExam?.name,
        examCountdown: upcomingExam?.daysUntilExam
      };

      const result = await apiClient.askStudyAssistant(text, chatHistory, contextPayload);
      typingBubble.remove();

      const assistantReply = result.reply || 'I am ready to help you with your next study topic!';
      chatHistory.push({ role: 'model', text: assistantReply });
      appendBubble('assistant', assistantReply);
    } catch (err) {
      typingBubble.remove();
      const errorMsg = `**Notice:** ${err.message || 'Could not contact Gemini API.'}\n\nPlease check your backend \`GEMINI_API_KEY\` in Settings.`;
      appendBubble('assistant', errorMsg);
    } finally {
      sendBtn.disabled = false;
      inputEl.disabled = false;
      inputEl.focus();
      scrollToBottom();
    }
  }

  function appendBubble(role, content) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = role === 'user' ? content : renderMarkdown(content);
    messagesEl.appendChild(bubble);
  }

  sendBtn.addEventListener('click', () => handleSend());

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  });

  // Quick Prompt Chips
  container.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      handleSend(prompt);
    });
  });

  // Clear chat
  clearBtn.addEventListener('click', () => {
    chatHistory = [
      {
        role: 'model',
        text: "Conversation cleared. What topic or exam would you like to explore?"
      }
    ];
    messagesEl.innerHTML = `
      <div class="chat-bubble assistant">
        ${renderMarkdown(chatHistory[0].text)}
      </div>
    `;
  });
}
