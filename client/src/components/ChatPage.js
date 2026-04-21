import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; 
import { useNavigate } from 'react-router-dom'; 
import './chatpage.css';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your Career AI. Ask me about roadmaps, interview tips, or specific roles!", sender: "ai" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const chatEndRef = useRef(null);

  // --- SECURITY GATE ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/'); 
    }
  }, [navigate]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const token = localStorage.getItem('token');
    const userMsg = { text: input, sender: "user" };
    
    // Add User Message and an empty AI bubble for streaming
    setMessages(prev => [...prev, userMsg, { text: "", sender: "ai" }]); 
    
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized: Please login again.");
        throw new Error("Connection failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAIResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullAIResponse += chunk;

        setMessages(prev => {
          const updatedMessages = [...prev];
          const lastIndex = updatedMessages.length - 1;
          updatedMessages[lastIndex] = { 
            ...updatedMessages[lastIndex], 
            text: fullAIResponse 
          };
          return updatedMessages;
        });
      }
    } catch (err) {
      console.error("Stream error:", err);
      setMessages(prev => {
        const updatedMessages = [...prev];
        const lastIndex = updatedMessages.length - 1;
        updatedMessages[lastIndex] = { 
          ...updatedMessages[lastIndex], 
          text: err.message === "Unauthorized: Please login again." 
                ? "Your session has expired. Please log in again to continue." 
                : "AI service encountered an error. Please check your connection." 
        };
        return updatedMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-card">
        <div className="chat-header">
          <div className="header-info">
            <h2>CareerAI Assistant</h2>
            <div className="online-indicator">
              <div className="dot"></div>
              <span>System Active (Groq LPU)</span>
            </div>
          </div>
        </div>
        
        <div className="chat-box">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.sender}`}>
              {m.sender === "ai" ? (
                <ReactMarkdown>{m.text}</ReactMarkdown>
              ) : (
                m.text
              )}
            </div>
          ))}
          
          {loading && !messages[messages.length - 1].text && (
            <div className="msg ai italic">Thinking...</div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* --- PROFESSIONAL AI INPUT AREA --- */}
        <div className="chat-input-area">
          <div className="input-container">
            <div className="input-prefix">✨</div>
            
            <input 
              type="text" 
              placeholder="Ask about roadmaps, interview tips..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
            />

            <button 
              className="send-btn" 
              onClick={handleSendMessage} 
              disabled={!input.trim() || loading}
            >
              <span className="send-text">{loading ? "..." : "Send"}</span>
              <svg className="send-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;