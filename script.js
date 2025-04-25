const API_KEY = 'glSwQEYVHguhmQpB7fX49o0AFmtViiNLlpbwWViQ';
const API_URL = 'https://api.cohere.ai/v1/generate';

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newInterviewBtn = document.getElementById('new-interview');
const suggestionsDiv = document.getElementById('suggestions');

let interviewContext = {
    position: '',
    hasStarted: false,
    history: []
};

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
newInterviewBtn.addEventListener('click', startNewInterview);

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    userInput.value = '';
    showTypingIndicator();

    try {
        let prompt;

        if (!interviewContext.position) {
            interviewContext.position = message;
            interviewContext.hasStarted = true;
            generatePlanAndTips(message);

            prompt = `You are an AI interview assistant. The user is preparing for a job interview as a "${interviewContext.position}". 
            Start the interview by asking a short and relevant first question based on the job role. Be concise, professional, and avoid repeating previous questions.`;
        } else {
            prompt = `You are continuing a job interview for the role of "${interviewContext.position}". 
            The candidate just said: "${message}". 
            Respond with a short and relevant follow-up interview question or comment. Avoid repeating any previous questions. 
            Keep the tone professional and responses within 1-2 sentences.`;
        }

        interviewContext.history.push({ role: 'user', parts: [{ text: message }] });

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'command-r-plus',
                prompt: prompt,
                max_tokens: 200,
                temperature: 0.7,
                k: 0,
                p: 0.75,
                frequency_penalty: 0.3,
                presence_penalty: 0.3,
                stop_sequences: []
            })
        });

        const data = await response.json();
        hideTypingIndicator();

        if (data.generations && data.generations[0].text) {
            const botResponse = data.generations[0].text.trim();
            addMessage(botResponse, 'bot');
            interviewContext.history.push({ role: 'model', parts: [{ text: botResponse }] });
        } else {
            throw new Error('No response from Cohere API');
        }

    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addMessage("Sorry, something went wrong. Please try again.", 'bot');
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message');
    typingDiv.id = 'typing-indicator';

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content', 'typing-indicator');
    contentDiv.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(contentDiv);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.remove();
}

function startNewInterview() {
    chatMessages.innerHTML = `
        <div class="message bot-message">
            <div class="message-content">
                Hello! I'm your interview assistant. I can help you practice for job interviews. 
                What position are you preparing for?
            </div>
        </div>
    `;
    suggestionsDiv.innerHTML = `<p>Enter a job role or skill to get a preparation plan and guidance here.</p>`;
    interviewContext = {
        position: '',
        hasStarted: false,
        history: []
    };
}

async function generatePlanAndTips(roleOrSkill) {
    try {
        const tipPrompt = `The user is preparing for an interview or wants to master: "${roleOrSkill}". 
        Provide a structured preparation plan and valuable tips including key focus areas, recommended tools, and advice. 
        Use clear formatting with headings and bullet points. Keep it concise but insightful.`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'command-r-plus',
                prompt: tipPrompt,
                max_tokens: 300,
                temperature: 0.6,
                k: 0,
                p: 0.75,
                frequency_penalty: 0,
                presence_penalty: 0,
                stop_sequences: []
            })
        });

        const data = await response.json();
        if (data.generations && data.generations[0].text) {
            const tip = data.generations[0].text.trim();
            suggestionsDiv.innerHTML = `<pre>${tip}</pre>`;
        }
    } catch (error) {
        console.error('Plan/Tip Error:', error);
        suggestionsDiv.innerHTML = `<p>Could not fetch tips. Try again later.</p>`;
    }
}

// Init default message
startNewInterview();