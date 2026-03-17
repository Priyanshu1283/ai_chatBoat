import { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import './App.css';

const BOT_NAME = 'Boat_demo';
const SUGGESTIONS = [
  'What can you help me with?',
  'Explain something in simple terms',
  'Write a short poem',
  'Give me a fun fact',
];

function App() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const pendingReplyTimerRef = useRef(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const socketInstance = io(apiUrl, { transports: ["websocket", "polling"] });

    socketInstance.on("connect", () => setConnected(true));
    socketInstance.on("disconnect", () => setConnected(false));
    socketInstance.on("connect_error", (err) => {
      setConnected(false);
      setIsTyping(false);
      setError(err?.message ? `Connection error: ${err.message}` : "Connection error");
    });

    socketInstance.on("ai-message-response", (response) => {
      setIsTyping(false);
      setError(null);
      if (pendingReplyTimerRef.current) {
        clearTimeout(pendingReplyTimerRef.current);
        pendingReplyTimerRef.current = null;
      }
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMessage]);
    });

    setSocket(socketInstance);
    return () => {
      if (pendingReplyTimerRef.current) clearTimeout(pendingReplyTimerRef.current);
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (text) => {
    const toSend = (typeof text === 'string' ? text : inputText).trim();
    if (!toSend || !socket) return;

    setError(null);
    const userMessage = {
      id: Date.now(),
      text: toSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    if (pendingReplyTimerRef.current) clearTimeout(pendingReplyTimerRef.current);
    pendingReplyTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setError('No response from server. Check backend terminal for the exact error.');
      pendingReplyTimerRef.current = null;
    }, 30000);
    socket.emit('ai-message', toSend);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    if (socket) socket.emit('clear-chat');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-icon" aria-hidden>◇</span>
            <h1>{BOT_NAME}</h1>
          </div>
          <div className="header-actions">
            <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? 'Online' : 'Offline'}
            </span>
            {messages.length > 0 && (
              <button type="button" className="clear-btn" onClick={handleClearChat} title="New chat">
                New chat
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="chat-messages">
        {messages.length === 0 && !isTyping ? (
          <div className="welcome">
            <div className="welcome-icon" aria-hidden>◇</div>
            <h2>Hi, I'm {BOT_NAME}</h2>
            <p>Your AI assistant. Ask me anything or try one of these:</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => handleSendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}-message`}>
                <div className="message-bubble">
                  <p className="message-text">{msg.text}</p>
                  <span className="timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot-message">
                <div className="message-bubble typing-bubble">
                  <span className="typing-dots">
                    <span></span><span></span><span></span>
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${BOT_NAME}...`}
          className="input-field"
          disabled={!connected}
          aria-label="Message input"
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || !connected || isTyping}
          className="send-button"
          aria-label="Send message"
        >
          Send
        </button>
      </footer>
    </div>
  );
}

export default App;
