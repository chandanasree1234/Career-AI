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
  const [userAnswers, setUserAnswers] = useState([]); // Stores performance data

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

    const initialPrompt = `Conduct a 5-question technical MCQ exam for a ${historyContext.recommendation} role.
    Focus on: ${historyContext.missingSkills.join(", ")}.
    Output MUST be JSON: {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "isFinal": false}`;

    await handleSendMessage(initialPrompt, true);
  };

  // --- UPDATED CLICK HANDLER ---
  const onOptionClick = (opt) => {
    if (loading || isAnswered) return; 
    setSelectedOption(opt); // Mark the circle immediately
    handleSendMessage(opt); // Send to AI
  };

  const handleSendMessage = async (msgText, isSystem = false) => {
    const token = localStorage.getItem('token');
    if (!isSystem) {
      setMessages(prev => [...prev, { text: msgText, sender: "user" }]);
    }
    
    setMessages(prev => [...prev, { text: "", sender: "ai" }]);
    setLoading(true);

    // We tell the AI strictly how to respond so our JSON parser doesn't break
    const evalPrompt = isSystem ? msgText : 
      `User selected: ${msgText}. 
       1. State if CORRECT or WRONG.
       2. Provide a 1-line explanation.
       JSON format: {"explanation": "CORRECT/WRONG: [Your explanation]", "isFinal": false}`;

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

      // --- SCORING LOGIC ---
      // After the stream finishes, we check if the AI said "CORRECT"
      if (!isSystem) {
        if (aiResponse.toUpperCase().includes("CORRECT")) {
          setScore(s => s + 1);
          setUserAnswers(prev => [...prev, { status: "Correct" }]);
        } else {
          setUserAnswers(prev => [...prev, { status: "Wrong" }]);
        }
        setIsAnswered(true); 
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const loadNextQuestion = async () => {
    setIsAnswered(false);
    setSelectedOption(null); // Reset marking for new question
    setLoading(true);
    const nextNum = questionCount + 1;
    
    let nextPrompt = "";
    if (nextNum > 5) {
        const summaryData = userAnswers.map((a, i) => `Q${i+1}: ${a.status}`).join(", ");
        nextPrompt = `Exam over. Results: ${summaryData}. Total: ${score}/5. 
        Provide a technical analysis and career feedback strictly within 6 lines.
        Set "isFinal": true. JSON: {"question": "Feedback text", "isFinal": true}`;
    } else {
        nextPrompt = `Provide NEW technical MCQ for Question ${nextNum} of 5. 
        JSON: {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "isFinal": false}`;
    }

    setQuestionCount(nextNum > 5 ? 5 : nextNum);
    await handleSendMessage(nextPrompt, true);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-card">
        <div className="chat-header">
          <div className="header-info">
            <h2>Technical MCQ Exam</h2>
            {isStarted && <span className="target-badge">Q: {questionCount} / 5</span>}
          </div>
          <button className="exit-tab" onClick={() => navigate('/dashboard')}>Exit Exam ✖</button>
        </div>

        {!isStarted ? (
          <div className="interview-start-container" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px' }}>📄</div>
            <h3 style={{ color: 'white' }}>5-Question Assessment</h3>
            <button onClick={startInterview} className="btn-primary">Begin MCQ Test</button>
          </div>
        ) : (
          <div className="chat-box" style={{ paddingBottom: '120px' }}>
            {messages.map((m, i) => {
              const isAI = m.sender === "ai";
              let mcqData = null;
              if (isAI) {
                try {
                  const jsonMatch = m.text.match(/\{[\s\S]*\}/);
                  if (jsonMatch) mcqData = JSON.parse(jsonMatch[0]);
                } catch (e) { mcqData = null; }
              }

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
                        <>
                          {mcqData.question && <p className="question-text"><b>{mcqData.question}</b></p>}
                          <div className="options-grid">
                            {mcqData.options && mcqData.options.map((opt, idx) => (
                              <button 
                                key={idx} 
                                className={`select-option glass-btn ${selectedOption === opt ? 'marked' : ''}`} 
                                disabled={isAnswered && i === messages.length - 1}
                                onClick={() => onOptionClick(opt)}
                              >
                                <div className="option-tab"></div>
                                <span className="option-text">{opt}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="final-results">
                          <h3 style={{ color: 'white' }}>Final Analysis</h3>
                          <h1 style={{ color: '#38bdf8', fontSize: '3.5rem' }}>{score} / 5</h1>
                          <div className="analysis-summary">
                            <ReactMarkdown>{mcqData.question}</ReactMarkdown>
                          </div>
                          <div style={{display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px'}}>
                            <button onClick={startInterview} className="professional-gen-btn">Retake</button>
                            <button onClick={() => navigate('/dashboard')} className="professional-gen-btn" style={{background: 'rgba(255,255,255,0.1)'}}>Exit</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  )}
                </div>
              );
            })}
            
            {isAnswered && questionCount <= 5 && !loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <button onClick={loadNextQuestion} className="next-btn">
                  {questionCount === 5 ? "Finish & Analyze 🏁" : "Next Question ➡️"}
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