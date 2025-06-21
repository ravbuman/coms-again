import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { addUserAddress } from '../controllers/productController.js';
import { authenticateUser } from '../middleware/auth.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'RaviBuraga';

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('[REGISTER] Called with body:', req.body);
    const { username, password, name, phone } = req.body;
    if (!username || !password || !name || !phone) {
      console.log('[REGISTER] Missing fields');
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      console.log('[REGISTER] Username exists:', username);
      return res.status(409).json({ message: 'Username already exists.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed, name, phone });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('[REGISTER] Success:', user);
    res.status(201).json({ token, user: { userId: user._id, username: user.username, name: user.name, phone: user.phone, addresses: user.addresses } });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Admin Registration
router.post('/admin/register', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    if (!username || !password || !name || !email) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: 'Admin username already exists.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ username, password: hashed, name, email });
    const token = jwt.sign({ adminId: admin._id, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, admin: { adminId: admin._id, username: admin.username, name: admin.name, email: admin.email, isAdmin: true } });
  } catch (_err) {
    console.error('[ADMIN REGISTER] Error:', _err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }
    const token = jwt.sign({ adminId: admin._id, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { adminId: admin._id, username: admin.username, name: admin.name, email: admin.email, isAdmin: true } });
  } catch (_err) {
    console.error('[ADMIN LOGIN] Error:', _err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// --- PATCH NORMAL LOGIN TO FLAG ADMIN ---
// Removed ADMIN_USERNAME and ADMIN_PASSWORD check
router.post('/login', async (req, res) => {
  try {
    console.log('[LOGIN] Called with body:', req.body);
    const { username, password } = req.body;
    if (!username || !password) {
      console.log('[LOGIN] Missing fields');
      return res.status(400).json({ message: 'Username and password required.' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      console.log('[LOGIN] Invalid username:', username);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('[LOGIN] Invalid password for:', username);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('[LOGIN] Success:', user);
    res.json({ token, user: { userId: user._id, username: user.username, name: user.name, phone: user.phone, addresses: user.addresses, isAdmin: false } });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get current user (protected)
router.get('/me', async (req, res) => {
  try {
    console.log('[ME] Called with headers:', req.headers);
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      console.log('[ME] No token');
      return res.status(401).json({ message: 'No token.' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('[ME] User not found for id:', decoded.id);
      return res.status(404).json({ message: 'User not found.' });
    }
    console.log('[ME] Success:', user);
    res.json({ user: { userId: user._id, username: user.username, name: user.name, phone: user.phone, addresses: user.addresses } });
  } catch (err) {
    console.error('[ME] Error:', err);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

// Update user profile (protected)
router.put('/me', async (req, res) => {
  try {
    console.log('[UPDATE PROFILE] Called with headers:', req.headers, 'body:', req.body);
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      console.log('[UPDATE PROFILE] No token');
      return res.status(401).json({ message: 'No token.' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, phone, addresses } = req.body;
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('[UPDATE PROFILE] User not found for id:', decoded.id);
      return res.status(404).json({ message: 'User not found.' });
    }
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;
    await user.save();
    console.log('[UPDATE PROFILE] Success:', user);
    res.json({ user: { userId: user._id, username: user.username, name: user.name, phone: user.phone, addresses: user.addresses } });
  } catch (err) {
    console.error('[UPDATE PROFILE] Error:', err);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

// Add user address (protected)
router.post('/address/add', authenticateUser, addUserAddress);

export default router;
