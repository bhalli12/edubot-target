const express = require('express');
const OpenAI = require('openai');
const app = express();
app.use(express.json());

// Pulls securely from your Vercel Environment Variables
const aiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: 8000 // 8-second safety timeout to prevent Vercel 500 crashes
});

// Simple, standard chatbot prompt with no security rules
const SYSTEM_PROMPT = "You are EduBot, a helpful and friendly automated chat assistant for Air University. Answer general questions about campus life, classes, and schedules nicely.";

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en" data-theme="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Air University - EduBot Control Panel</title>
        <style>
            :root[data-theme="dark"] {
                --bg-main: #0b0f19; --bg-sidebar: #111827; --bg-card: #1f2937;
                --text-main: #f3f4f6; --text-muted: #9ca3af; --border: #374151;
                --primary: #3b82f6; --primary-hover: #2563eb; --accent: #10b981;
                --chat-user: #2563eb; --chat-bot: #1f2937;
            }
            :root[data-theme="light"] {
                --bg-main: #f8fafc; --bg-sidebar: #ffffff; --bg-card: #f1f5f9;
                --text-main: #0f172a; --text-muted: #64748b; --border: #cbd5e1;
                --primary: #2563eb; --primary-hover: #1d4ed8; --accent: #059669;
                --chat-user: #2563eb; --chat-bot: #e2e8f0;
            }
            * { box-sizing: border-box; margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
            body { background: var(--bg-main); color: var(--text-main); display: flex; height: 100vh; overflow: hidden; }
            .sidebar { width: 280px; background: var(--bg-sidebar); border-right: 1px solid var(--border); padding: 30px 24px; display: flex; flex-direction: column; justify-content: space-between; }
            .brand { font-size: 1.2rem; font-weight: 800; color: var(--primary); letter-spacing: 0.5px; display: flex; align-items: center; gap: 10px; }
            .status-badge { background: rgba(16, 185, 129, 0.1); color: var(--accent); padding: 6px 14px; border-radius: 30px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.2); width: max-content; }
            .theme-toggle { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; justify-content: center; gap: 8px; align-items: center; }
            .theme-toggle:hover { background: var(--border); }
            .main-content { flex: 1; display: flex; flex-direction: column; }
            .header { background: var(--bg-sidebar); padding: 20px 40px; border-bottom: 1px solid var(--border); }
            .chat-window { flex: 1; padding: 40px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; scroll-behavior: smooth; }
            .chat-window::-webkit-scrollbar { width: 6px; }
            .chat-window::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
            .message-row { display: flex; flex-direction: column; gap: 6px; max-width: 70%; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .message-row.user { align-self: flex-end; }
            .message-row.bot { align-self: flex-start; }
            .sender-label { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding-left: 4px; }
            .bubble { padding: 16px 20px; border-radius: 16px; font-size: 0.95rem; line-height: 1.6; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); word-wrap: break-word; }
            .user .bubble { background: var(--chat-user); color: #ffffff; border-bottom-right-radius: 2px; }
            .bot .bubble { background: var(--chat-bot); color: var(--text-main); border-bottom-left-radius: 2px; border: 1px solid var(--border); }
            .input-container { padding: 24px 40px; background: var(--bg-sidebar); border-top: 1px solid var(--border); display: flex; gap: 16px; align-items: center; }
            input { flex: 1; background: var(--bg-main); border: 1px solid var(--border); padding: 16px 20px; border-radius: 12px; color: var(--text-main); font-size: 0.95rem; }
            input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
            button { background: var(--primary); color: #fff; border: none; padding: 0 32px; height: 54px; border-radius: 12px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
            button:hover { background: var(--primary-hover); transform: translateY(-1px); }
            .typing-indicator { display: flex; gap: 4px; padding: 4px 8px; }
            .dot { width: 8px; height: 8px; background: var(--text-muted); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
            .dot:nth-child(1) { animation-delay: -0.32s; }
            .dot:nth-child(2) { animation-delay: -0.16s; }
            @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <div style="display:flex; flex-direction:column; gap:24px;">
                <div class="brand">🏛️ AU ASSISTANT</div>
                <div class="status-badge">🟢 ONLINE</div>
                <p style="font-size:0.85rem; color: var(--text-muted); line-height: 1.6;">Ask me anything about classes, timings, or campus information!</p>
            </div>
            <button class="theme-toggle" onclick="toggleTheme()">🌓 Change Theme</button>
        </div>
        <div class="main-content">
            <div class="header">
                <div>
                    <h2 style="font-size:1.15rem; font-weight:700;">EduBot Chat</h2>
                    <p style="font-size:0.8rem; color: var(--text-muted);">Standard Support Instance</p>
                </div>
            </div>
            <div class="chat-window" id="chatBox">
                <div class="message-row bot">
                    <span class="sender-label">EduBot</span>
                    <div class="bubble">Hello! Welcome to Air University support. How can I help you today?</div>
                </div>
            </div>
            <div class="input-container">
                <input type="text" id="userInput" placeholder="Type a message..." onkeydown="if(event.key === 'Enter') processMessage()">
                <button onclick="processMessage()">Send</button>
            </div>
        </div>

        <script>
            function toggleTheme() {
                const html = document.documentElement;
                const current = html.getAttribute('data-theme');
                html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
            }

            async function processMessage() {
                const input = document.getElementById('userInput');
                const box = document.getElementById('chatBox');
                const text = input.value.trim();
                if(!text) return;

                const userRow = document.createElement('div');
                userRow.className = 'message-row user';
                userRow.innerHTML = '<span class="sender-label">You</span><div class="bubble"></div>';
                userRow.querySelector('.bubble').textContent = text;
                box.appendChild(userRow);
                input.value = '';
                box.scrollTop = box.scrollHeight;

                const botRow = document.createElement('div');
                botRow.className = 'message-row bot';
                botRow.innerHTML = '<span class="sender-label">EduBot</span><div class="bubble"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>';
                box.appendChild(botRow);
                box.scrollTop = box.scrollHeight;

                try {
                    const res = await fetch('/api/server', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text })
                    });
                    const data = await res.json();
                    botRow.querySelector('.bubble').textContent = data.reply || data.error;
                } catch(e) {
                    botRow.querySelector('.bubble').textContent = 'Connection timeout. Please try again.';
                }
                box.scrollTop = box.scrollHeight;
            }
        </script>
    </body>
    </html>
    `);
});

app.post('/api/server', async (req, res) => {
    try {
        const completion = await aiClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile', // Correct, updated Groq production model string
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: req.body.message }]
        });
        res.json({ reply: completion.choices[0].message.content });
    } catch (err) {
        res.status(500).json({ error: 'Groq API platform backend execution timeout failure.' });
    }
});

module.exports = app;
