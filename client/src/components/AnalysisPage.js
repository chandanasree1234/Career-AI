import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import StrengthChart from './StrengthChart';
import '../App.css';

const AnalysisPage = () => {
  const { id } = useParams();
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- UPDATED MULTI-PAGE PDF EXPORT LOGIC ---
  const exportToPDF = () => {
    const input = document.getElementById('roadmap-content');
    const downloadBtn = document.getElementById('download-btn');
    
    // Hide buttons during capture
    if (downloadBtn) downloadBtn.style.visibility = 'hidden';

    html2canvas(input, { 
      useCORS: true, 
      backgroundColor: '#020617', // Match your dark theme
      scale: 2 // High resolution for better print quality
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate the total height of the image in PDF units (mm)
      const imgHeightInPdf = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeightInPdf;
      let position = 0;

      // --- PAGE 1 ---
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;

      // --- ADD ADDITIONAL PAGES IF CONTENT REMAINS ---
      while (heightLeft > 0) {
        // Shift the image position up by the height of one PDF page
        position = heightLeft - imgHeightInPdf; 
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Career_Intelligence_Report.pdf`);
      
      if (downloadBtn) downloadBtn.style.visibility = 'visible';
    });
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const url = id ? `http://localhost:5000/api/history/${id}` : `http://localhost:5000/api/history`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        const record = id ? res.data : (res.data[0] || null);
        setLatestData(record);
      } catch (err) {
        console.error("Fetch Error:", err);
        if (err.response?.status === 401) navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="ai italic" style={{ color: '#38bdf8', fontSize: '1.2rem' }}>⚡ Syncing Career Intelligence...</div>
    </div>
  );

  if (!latestData) return (
    <div className="main-content">
      <div className="bento-box" style={{ textAlign: 'center', padding: '100px' }}>
        <h2 style={{ color: 'white' }}>No Analysis Found</h2>
        <button onClick={() => navigate('/search')} className="btn-primary">Start New Search</button>
      </div>
    </div>
  );

  return (
    <div className="main-content" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* --- HEADER --- */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
        <div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '900', color: '#f8fafc', margin: 0, letterSpacing: '-1.5px' }}>
            Skill <span style={{ color: '#38bdf8' }}>Intelligence</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '5px' }}>Live Career Gap Assessment</p>
        </div>
        
        <div className="action-header-btns">
          <button id="download-btn" onClick={exportToPDF} className="glass-btn">📥 Download PDF</button>
          <button onClick={() => navigate('/search')} className="glass-btn new-search-btn">← New Search</button>
        </div>
      </header>

      <div id="roadmap-content">
        {/* --- TOP ROW: CHART & MARKET FIT --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '40px' }}>
          <div className="skill-learning-card" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
            <h3 className="section-title">COMPETENCY PROFILE</h3>
            <div style={{ height: '350px' }}>
              <StrengthChart userSkills={latestData.skills} />
            </div>
          </div>

          <div className="skill-learning-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 className="section-title">MARKET FIT</h3>
            <div style={{ fontSize: '5.5rem', fontWeight: '900', color: '#34d399', margin: '10px 0', textShadow: '0 0 20px rgba(52, 211, 153, 0.3)' }}>
              {latestData.matchScore}%
            </div>
            <p style={{ fontWeight: '800', color: 'white', fontSize: '1.4rem' }}>{latestData.recommendation}</p>
          </div>
        </div>

        {/* --- GRID: IDENTIFIED SKILL GAPS --- */}
        <div className="analysis-section">
          <h3 className="section-title" style={{ color: '#f87171' }}>⚠️ IDENTIFIED SKILL GAPS</h3>
          <div className="skills-grid">
            {latestData.missingSkills.map((skill, index) => (
              <div key={index} className="skill-card">
                <h3>{skill}</h3>
                <p>Master this to increase your match score for {latestData.recommendation}.</p>
                <div className="resource-links">
                  <a href={`https://youtube.com/results?search_query=learn+${skill}`} target="_blank" rel="noreferrer" className="res-link yt">📺 YouTube</a>
                  <a href={`https://udemy.com/courses/search/?q=${skill}`} target="_blank" rel="noreferrer" className="res-link ud">🎓 Udemy</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- TIMELINE: STEP-BY-STEP PATH --- */}
        <div className="analysis-section roadmap-container" style={{ paddingBottom: '50px' }}>
          <h3 className="section-title">🚀 STEP-BY-STEP PATH</h3>
          <div className="roadmap-path">
            {latestData.roadmapSteps.map((step, index) => (
              <div key={index} className="roadmap-step">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;