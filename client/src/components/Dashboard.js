import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- FETCH HISTORY ---
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        console.error("Auth error:", err);
        if (err.response?.status === 401) navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [navigate]);

  // --- DELETE FUNCTION ---
  const deleteHistory = async (id, e) => {
    // 1. STOP PROPAGATION: Crucial step to prevent opening analysis page
    e.stopPropagation(); 
    
    if (window.confirm("Are you sure you want to delete this analysis?")) {
      try {
        const token = localStorage.getItem('token');
        
        // 2. BACKEND API CALL
        await axios.delete(`http://localhost:5000/api/history/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 3. UI UPDATE: Filter state
        setHistory((prevHistory) => prevHistory.filter(item => item._id !== id));
        
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete. Please check your connection.");
      }
    }
  };

  return (
    <div className="main-content">
      <div className="analysis-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>Search History</h1>
        <p style={{ color: '#94a3b8' }}>Review and manage your private career path analyses.</p>
      </div>

      {loading ? (
        <div style={{ color: '#38bdf8', textAlign: 'center', marginTop: '50px' }}>
          <div className="msg ai italic">Syncing Private Vault...</div>
        </div>
      ) : history.length === 0 ? (
        <div className="bento-box" style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#94a3b8' }}>No history found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {history.map((item) => (
            <div 
              key={item._id} 
              className="bento-box" 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '20px 30px',
                border: '1px solid rgba(56, 189, 248, 0.1)',
                cursor: 'pointer' 
              }}
              onClick={() => navigate(`/analysis/${item._id}`)}
            >
              {/* --- LEFT SIDE --- */}
              <div className="card-info">
                <h3 style={{ color: 'white', margin: 0 }}>{item.recommendation}</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Skills: {item.skills}</p>
                <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: '600' }}>
                  View Detailed Roadmap →
                </span>
              </div>

              {/* --- RIGHT SIDE: ACTIONS --- */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <div style={{ color: '#34d399', fontWeight: '800', fontSize: '1.2rem' }}>
                  {item.matchScore}% Match
                </div>
                
                {/* --- THE VERIFIED BUTTON CODE --- */}
                <button 
                  className="delete-btn"
                  onClick={(e) => deleteHistory(item._id, e)}
                  style={{ 
                    background: 'rgba(248, 113, 113, 0.1)', 
                    border: 'none', 
                    color: '#f87171', 
                    padding: '8px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontSize: '1.2rem'
                  }}
                >
                  🗑️
                </button>
                
                <div style={{ color: '#475569', fontSize: '0.75rem' }}>
                  {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;