import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Ensure your global styles are imported
import App from './App'; // This connects to your App.js
import reportWebVitals from './reportWebVitals';

// This finds the <div id="root"></div> in your public/index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance monitoring (optional)
reportWebVitals();