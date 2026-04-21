import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

// --- COMPONENTS ---
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import Dashboard from './components/Dashboard'; 
import AnalysisPage from './components/AnalysisPage';
import SearchPage from './components/SearchPage';
import MockInterview from './components/MockInterview'; 
import ResumeTailor from './components/ResumeTailor'; // NEW: Imported component

// --- COLLAPSIBLE LAYOUT WRAPPER ---
const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/'; 
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('https://career-ai-3sn6.onrender.com/api/current_user', { withCredentials: true });
        if (response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (err) {
        console.log("Not logged in");
      }
    };
    fetchUser();
  }, []);

  return (
    <div className={`app-container ${isCollapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        
        {/* --- SIDEBAR HEADER --- */}
        <div className="sidebar-header" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between', 
          width: '100%',
          marginBottom: '0.4rem',
          padding: isCollapsed ? '0' : '0 10px'
        }}>
          {!isCollapsed && (
            <div className="sidebar-brand" style={{ margin: 0, fontWeight: '800', color: '#38bdf8' }}>
              CareerAI
            </div>
          )}
          <button 
            className="toggle-btn" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* --- USER PROFILE SECTION --- */}
        <div className="user-profile">
          {user ? (
            <div className="user-info-box">
              <p className="user-name-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="nav-icon">👤</span> 
                {!isCollapsed && <span>{`Hi, ${user.name.split(' ')[0]}`}</span>}
              </p>
              {!isCollapsed && <span className="user-date" style={{ fontSize: '0.5rem', color: '#64748b', marginLeft: '30px' }}>Member Since 2026</span>}
            </div>
          ) : (
            <Link to="/" className="login-link">Login</Link>
          )}
        </div>
        
        {/* --- NAVIGATION --- */}
        <nav className="sidebar-nav">
          <Link to="/home" className="nav-item">
            <span className="nav-icon">🏠</span> 
            {!isCollapsed && <span>Home</span>}
          </Link>

          {/* NEW: Added Resume Tailor Link */}
          <Link to="/resume-tailor" className="nav-item">
            <span className="nav-icon">📄</span> 
            {!isCollapsed && <span>Resume Tailor</span>}
          </Link>

          <Link to="/chat" className="nav-item">
            <span className="nav-icon">💬</span> 
            {!isCollapsed && <span>AI Chat</span>}
          </Link>
          <Link to="/search" className="nav-item">
            <span className="nav-icon">🎯</span> 
            {!isCollapsed && <span>Search</span>}
          </Link>
          <Link to="/analysis" className="nav-item">
            <span className="nav-icon">📈</span> 
            {!isCollapsed && <span>Skill Analysis</span>}
          </Link>
          <Link to="/interview" className="nav-item">
            <span className="nav-icon">🎤</span> 
            {!isCollapsed && <span>Mock Interview</span>}
          </Link>
          <Link to="/dashboard" className="nav-item">
            <span className="nav-icon">📜</span> 
            {!isCollapsed && <span>History</span>}
          </Link>
        </nav>

        {/* --- SIDEBAR FOOTER --- */}
        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            <span className="nav-icon">🚪</span> 
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// --- HOME PAGE COMPONENT ---
const HomePage = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const firstName = user?.name?.split(' ')[0] || 'Explorer';

  return (
    <div className="home-wrapper">
      <section className="hero-container">
        <div className="hero-content">
          <div className="ai-badge">
            <span className="pulse-dot"></span> Next-Gen Career Intelligence
          </div>
          
          <h1 className="main-title">
            Shape Your Future <br />
            <span className="accent-text">With AI Precision</span>
          </h1>
          
          <p className="main-description">
            Welcome back, <strong>{firstName}</strong>. Map your skills to industry 
            demands, build expert roadmaps, and master your interviews.
          </p>

          <div className="button-group" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <Link to="/search" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', borderRadius: '10px', background: '#38bdf8', color: '#020617', fontWeight: '700' }}>Analyze Skills →</Link>
            <Link to="/resume-tailor" className="btn-secondary" style={{ textDecoration: 'none', padding: '12px 24px', borderRadius: '10px', border: '1px solid #334155', color: '#f8fafc', fontWeight: '700' }}>Resume Tailor</Link>
          </div>
        </div>

        <div className="hero-graphic">
          <div className="glow-sphere"></div>
          <div className="float-tag t1">✓ Skill Mapping</div>
          <div className="float-tag t2">📈 Market Trends</div>
        </div>
      </section>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userData = params.get('user');

    if (token && userData) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', userData);
      window.history.replaceState({}, document.title, "/home");
      window.location.reload(); 
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId="1016838464690-2c9ii0bp0glq48u7u0qq8hshsqqm1bil.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<Layout><HomePage /></Layout>} />
          <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
          <Route path="/search" element={<Layout><SearchPage /></Layout>} />
          
          {/* NEW: Added Route for Resume Tailor */}
          <Route path="/resume-tailor" element={<Layout><ResumeTailor /></Layout>} />
          
          <Route path="/analysis/:id?" element={<Layout><AnalysisPage /></Layout>} />
          <Route path="/interview" element={<Layout><MockInterview /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;