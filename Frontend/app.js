let username = '';
let socket = null;

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const nameInput = document.getElementById('name-input');
const joinBtn = document.getElementById('join-btn');
const messages = document.getElementById('messages');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');

// JOIN
function joinChat() {
    const name = nameInput.value.trim();
    if (name === '') return;
    username = name;

    // Connect to the Python backend
    socket = new WebSocket(`ws://127.0.0.1:8000/ws/${username}`);

    socket.onopen = function() {
        // Connected! Show the chat screen
        joinScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
        msgInput.focus();
    };

    socket.onmessage = function(event) {
        // Message received from server
        const [sender, ...rest] = event.data.split(':');
        const text = rest.join(':');
        addMessage(sender, text);
    };

    socket.onclose = function() {
        addMessage('System', 'Disconnected from server');
    };
}

joinBtn.addEventListener('click', joinChat);
nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') joinChat();
});

// SEND
function sendMessage() {
    const text = msgInput.value.trim();
    if (text === '' || !socket) return;
    socket.send(text);
    msgInput.value = '';
}

function addMessage(name, text) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('msg-wrapper', name === username ? 'me' : 'other');
    wrapper.innerHTML = `
        <div class="msg-name">${name}</div>
        <div class="msg-bubble">${text}</div>
    `;
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
}

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
});