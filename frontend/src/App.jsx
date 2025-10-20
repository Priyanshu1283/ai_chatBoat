import { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000");
    setSocket(socketInstance);

    socketInstance.on('ai-message-response', (response) => {
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'bot'
      };
      setMessages(prev => [...prev, botMessage]);
    });

    return () => {
      socketInstance.disconnect();
      console.log("Socket disconnected");
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom on every new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    socket.emit('ai-message', inputText);
    setInputText('');
  };

  const handleInputChange = (e) => setInputText(e.target.value);
  const handleKeyPress = (e) => e.key === 'Enter' && handleSendMessage();

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>💬 AI Chat</h1>
      </header>

      <main className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages"><p>Start a conversation...</p></div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}-message`}>
              <div className="message-bubble">
                <p className="message-text">{msg.text}</p>
                <span className="timestamp">{msg.timestamp}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef}></div>
      </main>

      <footer className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          className="input-field"
        />
        <button onClick={handleSendMessage} disabled={!inputText.trim()} className="send-button">
          Send
        </button>
      </footer>
    </div>
  );
}

export default App;
