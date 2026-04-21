require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { spawn } = require('child_process');
const Groq = require("groq-sdk"); 
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); 
const path = require('path'); // Moved to top for consistency

// NEW: Passport imports for the redirect flow
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

// Import models & middleware
const User = require('./models/User'); 
const { protect } = require('./middleware/auth'); 

const app = express();
const PORT = process.env.PORT || 5000;

// --- INITIALIZE CLIENTS ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 
const https = require('https');

// --- MIDDLEWARE ---
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use(session({
    secret: process.env.JWT_SECRET || 'career_ai_secret',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// --- 1. SKILL ROADMAP DATA ---
const SKILL_ROADMAPS = {
  "Full Stack Developer": {
    master: ["React", "Node.js", "Express", "MongoDB", "Docker", "AWS", "Unit Testing", "Redux"],
    steps: [
      { title: "Advanced Backend", description: "Master system design and Docker containerization." },
      { title: "Cloud Deployment", description: "Learn to deploy MERN apps on AWS or Vercel." },
      { title: "Quality Assurance", description: "Implement Jest or Cypress for unit and E2E testing." }
    ]
  },
  "Frontend Developer": {
    master: ["React", "CSS", "Tailwind", "TypeScript", "Next.js", "Figma", "Redux"],
    steps: [
      { title: "Type Safety", description: "Convert your React projects to TypeScript." },
      { title: "Framework Expansion", description: "Learn Next.js for Server Side Rendering (SSR)." },
      { title: "State Management", description: "Master Redux Toolkit or Context API for complex apps." }
    ]
  },
  "Backend Developer": {
    master: ["Node.js", "Python", "PostgreSQL", "Redis", "Docker", "Kubernetes", "GraphQL", "Java"],
    steps: [
      { title: "Containerization", description: "Learn Docker and Kubernetes for scaling microservices." },
      { title: "Caching", description: "Implement Redis for high-performance data retrieval." },
      { title: "Database Mastery", description: "Move from basic CRUD to complex SQL optimization." }
    ]
  }
};

const calculateGaps = (userSkills, targetRole) => {
  const roleKey = Object.keys(SKILL_ROADMAPS).find(
    key => key.toLowerCase().trim() === targetRole.toLowerCase().trim()
  );
  const roadmap = SKILL_ROADMAPS[roleKey];
  if (!roadmap) return { missing: [], steps: [] };

  const userSkillsLower = userSkills.split(',').map(s => s.trim().toLowerCase());
  const missing = roadmap.master.filter(skill => !userSkillsLower.includes(skill.toLowerCase()));
  return { missing, steps: roadmap.steps };
};

// --- 2. DATABASE CONNECTION & MODELS ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careerDB', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    family: 4 
}).then(() => console.log("Connected to MongoDB ✅"))
  .catch((err) => console.error("❌ DB Error:", err));

// Career Schema
const careerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    skills: String,
    recommendation: String,
    missingSkills: [String],
    roadmapSteps: [Object],
    matchScore: Number,
    date: { type: Date, default: Date.now }
});
const Career = mongoose.model('Career', careerSchema);

// NEW: Resume Schema for the Tailor Feature
const resumeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    matchScore: { type: Number, required: true },
    missingKeywords: [String],
    suggestions: [String],
    createdAt: { type: Date, default: Date.now }
});
const Resume = mongoose.model('Resume', resumeSchema);

// --- 3. AUTHENTICATION ROUTES ---

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback",
    proxy: true,
    agent: new https.Agent({ rejectUnauthorized: false }) 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            user = await User.create({ 
                name: profile.displayName, 
                email: profile.emails[0].value, 
                password: profile.id 
            });
        }
        return done(null, user);
    } catch (err) { 
        return done(err, null); 
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) { done(err, null); }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:3000/' }),
    async (req, res) => {
        try {
            const jwtToken = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });
            const userData = encodeURIComponent(JSON.stringify({ id: req.user._id, name: req.user.name, email: req.user.email }));
            res.redirect(`http://localhost:3000/home?token=${jwtToken}&user=${userData}`);
        } catch (error) {
            res.redirect('http://localhost:3000/?error=auth_failed');
        }
    }
);

// --- 4. SECURED HISTORY ROUTES ---
app.get('/api/history', protect, async (req, res) => {
    try {
        const history = await Career.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(history);
    } catch (err) { res.status(500).json({ error: "Failed to fetch history" }); }
});

app.get('/api/history/:id', protect, async (req, res) => {
    try {
        const record = await Career.findById(req.params.id);
        if (!record || record.userId.toString() !== req.user.id) {
            return res.status(404).json({ error: "Access denied or not found." });
        }
        res.json(record);
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// --- 5. AI RECOMMENDATION & RESUME TAILOR ---

// Career Recommendation Route
app.post('/api/recommend', protect, async (req, res) => {
    const { skills } = req.body; 
    const scriptPath = path.join(__dirname, '..', 'ai_logic', 'model.py');
    const pythonExecutable = '/usr/bin/python3'; 

    const pythonProcess = spawn(pythonExecutable, [scriptPath, skills]);
    let aiData = "";
    let pythonError = "";

    pythonProcess.stdout.on('data', (data) => aiData += data.toString());
    pythonProcess.stderr.on('data', (data) => pythonError += data.toString());

    pythonProcess.on('close', async (code) => {
        if (code !== 0) return res.status(500).json({ error: "AI Engine Error" });
        const recommendedRole = aiData.trim();
        const { missing, steps } = calculateGaps(skills, recommendedRole);
        try {
            const newSearch = new Career({ userId: req.user.id, skills, recommendation: recommendedRole, missingSkills: missing, roadmapSteps: steps, matchScore: 85 });
            const savedRecord = await newSearch.save();
            res.json(savedRecord);
        } catch (dbError) { res.status(500).json({ error: "Database save failed" }); }
    });
});

// NEW: AI Resume Tailor Route
app.post('/api/resume/analyze', protect, async (req, res) => {
    const { resumeText, jdText } = req.body;
    const scriptPath = path.join(__dirname, '..', 'ai_logic', 'resume_analyzer.py');
    const pythonExecutable = '/usr/bin/python3'; 

    const pythonProcess = spawn(pythonExecutable, [scriptPath, resumeText, jdText]);
    
    let aiData = "";
    let pythonError = "";

    pythonProcess.stdout.on('data', (data) => aiData += data.toString());
    pythonProcess.stderr.on('data', (data) => pythonError += data.toString());

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error("Python Error:", pythonError);
            return res.status(500).json({ error: "AI Analysis Failed" });
        }

        try {
            const result = JSON.parse(aiData);
            const newAnalysis = new Resume({
                userId: req.user.id,
                matchScore: result.matchScore,
                missingKeywords: result.missingKeywords,
                suggestions: result.suggestions
            });
            await newAnalysis.save();
            res.json(newAnalysis);
        } catch (err) {
            res.status(500).json({ error: "Data processing error" });
        }
    });
});

// --- 6. CONTEXT-AWARE CHAT ---
app.post('/api/chat', protect, async (req, res) => {
    const { message } = req.body;
    try {
        const latestAnalysis = await Career.findOne({ userId: req.user.id }).sort({ date: -1 });
        let systemContext = "You are a professional Career Coach AI assistant.";
        if (latestAnalysis) {
            systemContext += ` The user is aiming for: ${latestAnalysis.recommendation}. Skills: ${latestAnalysis.skills}. Gaps: ${latestAnalysis.missingSkills.join(", ")}.`;
        }
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemContext }, { role: "user", content: message }],
            model: "llama-3.3-70b-versatile",
            stream: true,
        });
        res.setHeader('Content-Type', 'text/plain');
        for await (const chunk of chatCompletion) {
            res.write(chunk.choices[0]?.delta?.content || ""); 
        }
        res.end(); 
    } catch (error) { res.status(500).json({ error: "AI processing error" }); }
});

app.get('/api/current_user', (req, res) => {
  res.send(req.user);
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));