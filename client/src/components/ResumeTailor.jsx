import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

const ResumeTailor = () => {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/resume/analyze', 
        { resumeText: resume, jdText: jd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err) {
      alert("Analysis failed");
    }
    setLoading(false);
  };

  return (
    <div className="main-content">
      <div className="bento-box" style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h1 className="main-title">AI <span className="accent-text">Resume Tailor</span></h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <textarea 
            placeholder="Paste your Resume here..." 
            className="modern-input-field"
            style={{ height: '300px', resize: 'none' }}
            onChange={(e) => setResume(e.target.value)}
          />
          <textarea 
            placeholder="Paste Job Description here..." 
            className="modern-input-field"
            style={{ height: '300px', resize: 'none' }}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        <button onClick={handleAnalyze} className="btn-primary" disabled={loading}>
          {loading ? "Analyzing Accuracy..." : "Check Match Score"}
        </button>

        {result && (
          <div className="recommendation-result-box" style={{ marginTop: '30px' }}>
            <h2 style={{ color: '#38bdf8' }}>Match Score: {result.matchScore}%</h2>
            <div style={{ textAlign: 'left', marginTop: '20px' }}>
              <h4>Missing Keywords:</h4>
              <p>{result.missingKeywords.join(', ')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeTailor;