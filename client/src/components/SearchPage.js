import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import '../App.css';

const SearchPage = () => {
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [analysisId, setAnalysisId] = useState(null); // Stores the ID for the detailed roadmap
  const navigate = useNavigate(); 

  const handleSearch = async () => {
    if (!skills) return alert("Please enter your skills!");
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      alert("Session expired. Please log in again.");
      return navigate('/');
    }

    setLoading(true);
    setRecommendation(''); 
    setAnalysisId(null);

    try {
      // API call to generate recommendation and save to history
      const response = await axios.post('http://localhost:5000/api/recommend', 
        { 
          skills: skills,
          userId: user?.id || user?._id 
        }, 
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      // Capture the recommendation and the unique MongoDB _id
      setRecommendation(response.data.recommendation);
      setAnalysisId(response.data._id); 

    } catch (error) {
      console.error("Search error:", error);
      if (error.response?.status === 401) {
        alert("Your session is invalid. Please log in again.");
        navigate('/');
      } else {
        alert("Something went wrong with the AI analysis.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="search-wrapper" style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
        <div className="bento-box" style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '10px' }}>🎯</span>
          <h1 style={{ margin: '10px 0', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>Career Finder</h1>
          <p style={{ color: '#94a3b8', marginBottom: '35px', fontSize: '1.1rem' }}>
            Enter your stack to discover your ideal career path.
          </p>

          <div style={{ marginBottom: '25px' }}>
            <input 
              type="text" 
              placeholder="e.g. React, Node.js, MongoDB" 
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="modern-input-field" 
              style={{ 
                width: '100%', 
                padding: '18px', 
                borderRadius: '14px', 
                border: '1px solid #334155', 
                background: '#0f172a', 
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <button 
            onClick={handleSearch} 
            disabled={loading} 
            className="btn-primary"
          >
            {loading ? "Analyzing Profile..." : "Generate Analysis →"}
          </button>

          {recommendation && (
            <div className="recommendation-result-box" style={{ 
              marginTop: '40px', 
              padding: '30px', 
              background: 'rgba(52, 211, 153, 0.05)', 
              borderRadius: '24px', 
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}>
              <p style={{ color: '#34d399', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>RECOMMENDED PATH</p>
              <h2 style={{ color: 'white', fontSize: '2.2rem', margin: '10px 0', fontWeight: '800' }}>{recommendation}</h2>
              
              <button 
                onClick={() => navigate(`/analysis/${analysisId}`)} 
                style={{
                  marginTop: '25px',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: '1px solid #38bdf8',
                  background: 'transparent',
                  color: '#38bdf8',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                View Detailed Roadmap →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;