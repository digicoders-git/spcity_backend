const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const associateRoutes = require('./routes/associates');
const leadRoutes = require('./routes/leads');
const projectRoutes = require('./routes/projects');
const siteRoutes = require('./routes/sites');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const siteVisitRoutes = require('./routes/siteVisits');
const commissionRoutes = require('./routes/commissions');
const invoiceRoutes = require('./routes/invoices');
const expenseRoutes = require('./routes/expenses');
const rewardRoutes = require('./routes/rewards');

const app = express();

/* ================= DB ================= */
connectDB();

/* ================= CORS (DYNAMIC & PERMISSIVE) ================= */
const envOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://spcity-adminpanel.vercel.app',
  'https://spcity-website.vercel.app',
  'https://sp-city-web.onrender.com',
  ...envOrigins
].map(o => o.trim().replace(/\/$/, '')) // Remove trailing slashes
 .filter(o => o !== '');

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    
    // Check if origin is allowed or matches our subdomains
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || 
                     normalizedOrigin.endsWith('.vercel.app') || 
                     normalizedOrigin.endsWith('.onrender.com');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// 🔥 Preflight support
app.options('*', cors());

/* ================= SECURITY ================= */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

/* ================= RATE LIMIT ================= */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use(globalLimiter);

// Invoice ke liye thoda relaxed limiter
const invoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});

/* ================= BODY PARSER ================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ================= ROUTES ================= */
app.use('/api/auth', authRoutes);
app.use('/api/associates', associateRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/site-visits', siteVisitRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/rewards', rewardRoutes);

// 🔥 Invoice route with relaxed limiter
app.use('/api/invoices', invoiceLimiter, invoiceRoutes);

/* ================= HEALTH CHECK ================= */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'SP City Backend API is running',
    timestamp: new Date().toISOString()
  });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error'
  });
});

/* ================= 404 ================= */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
