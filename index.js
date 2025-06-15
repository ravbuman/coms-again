import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { updateOrder } from './controllers/productController.js';
import { authenticateUser } from './middleware/auth.js';
import Admin from './models/Admin.js';
import User from './models/User.js';
import * as notifications from './notifications.js';
import authRoutes from './routes/auth.js';
import couponRoutes from './routes/coupon.js';
import productRoutes from './routes/product.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/coupons', couponRoutes);

// Add endpoint to receive and store user push tokens
app.post('/api/users/push-token', authenticateUser, async (req, res) => {
  try {
    const { token } = req.body;
    console.log(`[API] Received push token: ${token}`);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.pushToken = token;
    await user.save();
    res.json({ success: true });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to save push token.' });
  }
});

// Add endpoint to receive and store admin push tokens
app.post('/api/admins/push-token', authenticateUser, async (req, res) => {
  try {
    const { token } = req.body;

    const admin = await Admin.findById(req.user.adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    admin.pushToken = token;
    await admin.save();
    res.json({ success: true });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to save admin push token.' });
  }
});

// Update order (for UPI UTR or admin payment status)
app.put('/api/orders/:id', authenticateUser, updateOrder);

// Schedule offer notifications every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    const users = await User.find({ pushToken: { $exists: true, $ne: null } });
    if (users.length > 0) {
      await notifications.notifyOffers(users);
      console.log(`[CRON] Sent offer notifications to ${users.length} users.`);
    }
  } catch (err) {
    console.error('[CRON] Failed to send offer notifications:', err);
  }
});

// Root URL: Show backend info and features
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Coms-Again Backend</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f8f9fa; color: #222; margin: 0; padding: 0; }
          .container { max-width: 800px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px; }
          h1 { color: #2a5d9f; }
          ul { line-height: 1.7; }
          .subtitle { color: #555; margin-bottom: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Coms-Again Backend</h1>
          <div class="subtitle">This is the backend for the Android and Web application. It is a dynamic website with all the features listed below.</div>
          <h2>Features</h2>
          <ul>
            <li><b>User & Admin Authentication</b> (JWT, registration, login, profile management)</li>
            <li><b>Product Management</b> (CRUD, image upload, reviews)</li>
            <li><b>Order Management</b> (create, update, cancel, payment status, admin controls)</li>
            <li><b>Wishlist & Cart</b> (add, remove, clear, update, fetch)</li>
            <li><b>Coupon System</b> (create, update, delete, validate, list)</li>
            <li><b>Push Notifications</b> (order status, new orders, scheduled offers)</li>
            <li><b>Scheduled Tasks</b> (offer notifications every 30 minutes)</li>
            <li><b>RESTful API</b> for Android and Web clients</li>
            <li><b>Admin Dashboard Support</b> (user/order management)</li>
          </ul>
          <p style="margin-top:32px;color:#888;font-size:14px;">&copy; 2025 Coms-Again. All rights reserved.</p>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
