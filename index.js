import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

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
    console.log(`[API] Received admin push token: ${token}`);
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

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
