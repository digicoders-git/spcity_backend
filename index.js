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

const app = express();

/* ================= DB ================= */
connectDB();

/* ================= CORS (FINAL & SAFE) ================= */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://sp-city.onrender.com',
  'https://spcity-adminpanel.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow server-to-server / postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔥 Preflight support
app.options('*', cors());

/* ================= SECURITY ================= */
app.use(helmet());

/* ================= RATE LIMIT ================= */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
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
