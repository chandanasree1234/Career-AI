import React from 'react';
import {
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, ResponsiveContainer 
} from 'recharts';

const StrengthChart = ({ userSkills }) => {
  // Convert to lowercase once for easier checking
  const skills = userSkills ? userSkills.toLowerCase() : "";

  // --- DYNAMIC DATA LOGIC ---
  const data = [
    { 
      subject: 'Frontend', 
      A: (skills.includes('react') || skills.includes('html') || skills.includes('css')) ? 95 : 25, 
      fullMark: 100 
    },
    { 
      subject: 'Backend', 
      A: (skills.includes('node') || skills.includes('express') || skills.includes('python') || skills.includes('php')) ? 90 : 25, 
      fullMark: 100 
    },
    { 
      subject: 'Database', 
      A: (skills.includes('mongo') || skills.includes('sql') || skills.includes('postgre')) ? 85 : 20, 
      fullMark: 100 
    },
    { 
      subject: 'DevOps', 
      A: (skills.includes('docker') || skills.includes('git') || skills.includes('aws')) ? 75 : 15, 
      fullMark: 100 
    },
    { 
      subject: 'UI/UX', 
      A: (skills.includes('figma') || skills.includes('design') || skills.includes('tailwind')) ? 80 : 30, 
      fullMark: 100 
    },
  ];

  return (
    /* FIXED: Wrapped in a div with a defined pixel height to solve the console error */
    <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          {/* Grid lines color matching your slate theme */}
          <PolarGrid stroke="rgba(148, 163, 184, 0.2)" /> 
          
          {/* Axis Labels - Styled for readability on dark background */}
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: '600' }} 
          />
          
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#38bdf8"
            fill="#38bdf8"
            fillOpacity={0.4}
            animationBegin={0}
            animationDuration={1500}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StrengthChart;