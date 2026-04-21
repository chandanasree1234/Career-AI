import React from 'react';
import './login.css';

const LoginPage = () => {
  const handleGoogleLogin = () => {
    // Original redirect logic
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">🚀</div>
        <h1>Career<span>AI</span></h1>
        <p>Your personal assistant for roadmaps & growth.</p>
        
        <div className="google-btn-container">
          <button className="google-btn" onClick={handleGoogleLogin} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              width="20" 
            />
            Sign in with Google
          </button>
        </div>

        <div className="login-footer">
          Member Since 2026
        </div>
      </div>
    </div>
  );
};

export default LoginPage;