import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import './chatpage.css';

const MockInterview = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyContext, setHistoryContext] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  
  // --- EXAM CONTROL & STORAGE ---
  const [questionCount, setQuestionCount] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false); 
  const [selectedOption, setSelectedOption] = useState(null); 
  const [userAnswers, setUserAnswers] = useState([]); 

  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://career-ai-3sn6.onrender.com/api/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.length > 0) setHistoryContext(res.data[0]);
      } catch (err) { console.error("Context Error:", err); }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnswered]);

  const startInterview = async () => {
    if (!historyContext) return alert("Complete Skill Analysis first.");
    setIsStarted(true);
    setLoading(true);
    setQuestionCount(1);
    setScore(0);
    setIsAnswered(false);
    setUserAnswers([]);
    setSelectedOption(null);
    setMessages([]); // Clear previous chat

    // Stricter prompt for 10 questions and pure JSON
    const initialPrompt = `You are a Technical Interviewer. Conduct a 10-question MCQ exam for a ${historyContext.recommendation} role. 
    Focus on: ${historyContext.missingSkills.join(", ")}.
    Rules: 
    1. Provide ONLY Question 1 now.
    2. Format MUST be a valid JSON object.
    JSON Structure: {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "isFinal": false}`;

    await handleSendMessage(initialPrompt, true);
  };

  const onOptionClick = (opt) => {
    if (loading || isAnswered) return; 
    setSelectedOption(opt); 
    handleSendMessage(opt); 
  };

  const handleSendMessage = async (msgText, isSystem = false) => {
    const token = localStorage.getItem('token');
    if (!isSystem) {
      setMessages(prev => [...prev, { text: msgText, sender: "user" }]);
    }
    
    setMessages(prev => [...prev, { text: "", sender: "ai" }]);
    setLoading(true);

    const evalPrompt = isSystem ? msgText : 
      `User Answer: ${msgText}. Evaluate if CORRECT or WRONG. Provide feedback in 1 line. 
       JSON format: {"explanation": "...", "isFinal": false}`;

    try {
      const response = await fetch('https://career-ai-3sn6.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: evalPrompt }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].text = aiResponse;
          return updated;
        });
      }

      if (!isSystem) {
        if (aiResponse.toUpperCase().includes("CORRECT")) {
            setScore(prev => prev + 1);
            setUserAnswers(prev => [...prev, { status: "Correct" }]);
        } else {
            setUserAnswers(prev => [...prev, { status: "Wrong" }]);
        }
        setIsAnswered(true); 
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadNextQuestion = async () => {
    setIsAnswered(false);
    setSelectedOption(null); 
    setLoading(true);
    const nextNum = questionCount + 1;
    
    let nextPrompt = "";
    if (nextNum > 10) { // Updated to 10
        const summaryData = userAnswers.map((a, i) => `Q${i+1}: ${a.status}`).join(", ");
        nextPrompt = `Exam over. Results: ${summaryData}. Total Score: ${score}/10. 
        Provide a career gap analysis based on these results.
        Set "isFinal": true. JSON: {"question": "Your feedback text...", "isFinal": true}`;
    } else {
        nextPrompt = `Provide Technical MCQ for Question ${nextNum} of 10. 
        Format MUST be JSON: {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "isFinal": false}`;
    }

    setQuestionCount(nextNum > 10 ? 10 : nextNum);
    await handleSendMessage(nextPrompt, true);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-card">
        <div className="chat-header">
          <div className="header-info">
            <h2>Technical MCQ Exam</h2>
            {isStarted && <span className="target-badge">Q: {questionCount} / 10</span>}
          </div>
          <button className="exit-tab" onClick={() => navigate('/dashboard')}>Exit Exam ✖</button>
        </div>

        {!isStarted ? (
          <div className="interview-start-container" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px' }}>📄</div>
            <h3 style={{ color: 'white' }}>10-Question Technical Assessment</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '30px' }}>Test your knowledge based on your skill analysis.</p>
            <button onClick={startInterview} className="btn-primary">Begin MCQ Test</button>
          </div>
        ) : (
          <div className="chat-box" style={{ paddingBottom: '120px' }}>
            {messages.map((m, i) => {
              const isAI = m.sender === "ai";
              let mcqData = null;
              
              if (isAI) {
                try {
                  // This cleans the AI response to extract only the JSON part
                  const jsonMatch = m.text.match(/\{[\s\S]*\}/);
                  if (jsonMatch) mcqData = JSON.parse(jsonMatch[0]);
                } catch (e) { mcqData = null; }
              }

              // If it's a user message, we show it normally. 
              // If it's an AI message but NOT valid JSON, we show it as markdown.
              // If it's AI message and valid JSON, we show the Quiz UI.
              return (
                <div key={i} className={`msg ${m.sender}`}>
                  {mcqData ? (
                    <div className="mcq-container" style={{ width: '100%' }}>
                      {mcqData.explanation && (
                        <div className={`feedback-box ${mcqData.explanation.toUpperCase().includes('CORRECT') ? 'correct' : 'wrong'}`}>
                          {mcqData.explanation}
                        </div>
                      )}

                      {!mcqData.isFinal ? (
                        <div className="quiz-content">
                          {mcqData.question && <p className="question-text" style={{fontSize: '1.1rem', marginBottom: '20px'}}><b>{mcqData.question}</b></p>}
                          <div className="options-grid" style={{display: 'grid', gridTemplateColumns: '1fr', gap: '10px'}}>
                            {mcqData.options && mcqData.options.map((opt, idx) => (
                              <button 
                                key={idx} 
                                className={`select-option glass-btn ${selectedOption === opt ? 'marked' : ''}`} 
                                disabled={isAnswered && i === messages.length - 1}
                                onClick={() => onOptionClick(opt)}
                                style={{textAlign: 'left', padding: '15px', borderRadius: '10px'}}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="final-results" style={{textAlign: 'center', padding: '20px'}}>
                          <h3 style={{ color: 'white' }}>Assessment Complete</h3>
                          <h1 style={{ color: '#38bdf8', fontSize: '4rem', margin: '20px 0' }}>{score} / 10</h1>
                          <div className="analysis-summary" style={{textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px'}}>
                            <ReactMarkdown>{mcqData.question}</ReactMarkdown>
                          </div>
                          <div style={{display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px'}}>
                            <button onClick={startInterview} className="btn-primary">Retake Test</button>
                            <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{background: 'rgba(255,255,255,0.1)'}}>Return Home</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // This hides the raw JSON from appearing as a plain text message
                    !isAI || !m.text.includes("{") ? <ReactMarkdown>{m.text}</ReactMarkdown> : null
                  )}
                </div>
              );
            })}
            
            {isAnswered && questionCount <= 10 && !loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <button onClick={loadNextQuestion} className="next-btn" style={{padding: '12px 30px', borderRadius: '30px', background: '#38bdf8', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}>
                  {questionCount === 10 ? "Show Final Score 🏁" : "Next Question ➡️"}
                </button>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterview;