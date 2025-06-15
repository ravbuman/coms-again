import dotenv from 'dotenv';
dotenv.config();

import AWS from 'aws-sdk';
import path from 'path';
import Admin from '../models/Admin.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import * as notifications from '../notifications.js';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});
const BUCKET = process.env.AWS_S3_BUCKET;

// Upload a single image buffer to S3
async function uploadImageToS3(buffer, originalName, productName) {
  const ext = path.extname(originalName);
  const key = `${productName}/${Date.now()}${ext}`;
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/' + ext.replace('.', ''),
    ACL: 'public-read'
  };
  const data = await s3.upload(params).promise();
  return data.Location;
}

// Helper to add id field to product(s)
function addIdField(product) {
  if (!product) return product;
  const obj = product.toObject ? product.toObject() : product;
  return { ...obj, id: obj._id?.toString?.() || obj._id };
}

// Create product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImageToS3(file.buffer, file.originalname, name);
        images.push(url);
      }
    }
    const product = new Product({ name, description, price, category, stock, images });
    await product.save();
    res.status(201).json({ product: addIdField(product) });
  } catch (_err) {
    console.error('[CREATE PRODUCT]', _err);
    res.status(500).json({ message: 'Failed to create product.' });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ products: products.map(addIdField) });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

// Get product by id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product: addIdField(product) });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch product.' });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    let images = product.images;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImageToS3(file.buffer, file.originalname, name || product.name);
        images.push(url);
      }
    }
    product.set({ name, description, price, category, stock, images });
    await product.save();
    res.json({ product: addIdField(product) });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to update product.' });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted.' });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to delete product.' });
  }
};

// Add or update review
export const addOrUpdateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    // Remove existing review by this user
    product.reviews = product.reviews.filter(r => r.userId.toString() !== userId);
    // Add new review
    product.reviews.push({ userId, rating, comment, date: new Date() });
    await product.save();
    res.json({ reviews: product.reviews });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to add review.' });
  }
};

// Get reviews
export const getReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ reviews: product.reviews });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
};

// Create order
export const createOrder = async (req, res) => {
  try {
    const { items, shipping, totalAmount, paymentMethod, coupon } = req.body;
    const userId = req.user.id;
    let couponObjId = null;
    if (coupon) {
      couponObjId = coupon; // expects ObjectId from frontend
    }
    // Default paymentStatus for UPI is 'Pending', for COD is 'Pending'
    const order = new Order({
      userId,
      items,
      shipping,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'UPI' ? 'Pending' : 'Pending',
      coupon: couponObjId
    });
    await order.save();

    // Notify all admins of new order
    const admins = await Admin.find({ pushToken: { $exists: true, $ne: null } });
    const user = await User.findById(userId);
    if (admins.length > 0 && user) {
      await notifications.notifyAdminsNewOrder(admins, order._id, user.name);
    } else {
      if (admins.length === 0) console.error('[ORDER] No admins with push tokens found!');
      if (!user) console.error('[ORDER] User not found for order notification!');
    }

    res.status(201).json({ order });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to create order.' });
  }
};

// Get orders for user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ placedAt: -1 });
    res.json({ orders });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
};

// Get all orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    // Only log user if present (route is public for now)
    if (req.user && req.user.adminId) {
      console.log('Fetching all orders for admin:');
    } else {
      console.log('Fetching all orders (no user attached to request)');
    }
    const orders = await Order.find().sort({ placedAt: -1 });
    // Add id field for frontend compatibility
    console.log('Orders fetched:', orders.length);
    
    res.json({ orders: orders.map(order => ({ ...order.toObject(), id: order._id })) });
  } catch (_err) {
    console.error('[GET ALL ORDERS]', _err);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
};

// Update order status (admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    order.status = status;
    // If admin marks UPI order as paid, also update paymentStatus and notify user
    if (order.paymentMethod === 'UPI' && status === 'Paid') {
      order.paymentStatus = 'Paid';
      // Notify user
      const user = await User.findById(order.userId);
      if (user) {
        await notifications.sendPushNotification(
          user.pushToken,
          'Payment Received',
          `Your UPI payment for order #${order._id} has been verified and marked as paid.`,
          { orderId: order._id, status: 'Paid' }
        );
      }
    }
    await order.save();
    // Notify user of order status update (existing logic)
    const user = await User.findById(order.userId);
    if (user) {
      await notifications.notifyOrderStatus(user, order._id, status);
    }
    res.json({ order });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to update order.' });
  }
};

// Cancel order (user)
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status !== 'Pending') return res.status(400).json({ message: 'Cannot cancel order after it is shipped.' });
    order.status = 'Cancelled';
    await order.save();
    res.json({ order });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to cancel order.' });
  }
};

// Get order by ID (user or admin)
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('coupon');
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    // Fetch user details for admin view
    let userDetails = null;
    if (req.user.isAdmin) {
      const user = await import('../models/User.js').then(m => m.default.findById(order.userId));
      if (user) {
        userDetails = {
          id: user._id,
          name: user.name,
          phone: user.phone
        };
      }
    }
    res.json({ order, user: userDetails });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch order.' });
  }
};

// --- Wishlist ---
export const getWishlist = async (req, res) => {
  try {

    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ wishlist: user.wishlist.map(p => p.toObject ? { ...p.toObject(), id: p._id } : p) });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch wishlist.' });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!user.wishlist.map(id => id.toString()).includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }
    res.json({ wishlist: user.wishlist });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to add to wishlist.' });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();
    res.json({ wishlist: user.wishlist });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to remove from wishlist.' });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.wishlist = [];
    await user.save();
    res.json({ wishlist: [] });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to clear wishlist.' });
  }
};

// New endpoint: getWishlistByUserId (fetches user, then fetches products by ID)
export const getWishlistByUserId = async (req, res) => {
  try {
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!user.wishlist || user.wishlist.length === 0) return res.json({ wishlist: [] });
    // Fetch products by IDs in wishlist
    const products = await import('../models/Product.js').then(m => m.default.find({ _id: { $in: user.wishlist } }));
    // Add id field for frontend compatibility
    const wishlist = products.map(p => ({ ...p.toObject(), id: p._id }));
    res.json({ wishlist });
  } catch (err) {
    console.error('[GET WISHLIST BY USER]', err);
    res.status(500).json({ message: 'Failed to fetch wishlist.' });
  }
};

// --- Cart ---
// Improved getCart: fetch user, then fetch product details for all cart items
export const getCart = async (req, res) => {
  try {
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!user.cart || user.cart.length === 0) return res.json({ cart: [] });
    // Get all product IDs in cart
    const productIds = user.cart.map(item => item.product);
    // Fetch product details for all cart items
    const products = await import('../models/Product.js').then(m => m.default.find({ _id: { $in: productIds } }));
    // Map cart items to include product details and quantity
    const cart = user.cart.map(item => {
      const prod = products.find(p => p._id.toString() === item.product.toString());
      return prod ? {
        ...prod.toObject(),
        id: prod._id,
        qty: item.quantity,
      } : null;
    }).filter(Boolean);

    res.json({ cart });
  } catch (err) {

    res.status(500).json({ message: 'Failed to fetch cart.' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const idx = user.cart.findIndex(item => item.product.toString() === productId);
    if (idx > -1) {
      user.cart[idx].quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    await user.save();
    res.json({ cart: user.cart });
  } catch (err) {
    console.error('[ADD TO CART]', err);
    res.status(500).json({ message: 'Failed to add to cart.' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.cart = user.cart.filter(item => item.product.toString() !== productId);
    await user.save();
    res.json({ cart: user.cart });
  } catch (err) {
    console.error('[REMOVE FROM CART]', err);
    res.status(500).json({ message: 'Failed to remove from cart.' });
  }
};

export const clearCart = async (req, res) => {
  try {
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.cart = [];
    await user.save();
    res.json({ cart: [] });
  } catch (err) {
    console.error('[CLEAR CART]', err);
    res.status(500).json({ message: 'Failed to clear cart.' });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    console.log('Updating cart item for user:', req.user.id);
    console.log('Request body:', req.body);
    const { productId, qty } = req.body;
    if (!productId || !qty) {
      console.error('Invalid request body:', req.body);
      return res.status(400).json({ message: 'Invalid productId or quantity.' });
    }
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) { 
      console.error('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found.' });
    }
    console.log('User cart before update:', user.cart);
    const idx = user.cart.findIndex(item => item.product.toString() === productId);
    if (idx === -1) {
      return res.status(404).json({ message: 'Product not found in cart.' });
    }
    if (qty < 1) {
      // Remove item if quantity is less than 1
      user.cart.splice(idx, 1);
    } else {
      user.cart[idx].quantity = parseInt(qty);
    }
;
    await user.save();
    // Return updated cart with product details (like getCart)
    if (!user.cart || user.cart.length === 0) return res.json({ cart: [] });
    const productIds = user.cart.map(item => item.product);
    const products = await import('../models/Product.js').then(m => m.default.find({ _id: { $in: productIds } }));
    const cart = user.cart.map(item => {
      const prod = products.find(p => p._id.toString() === item.product.toString());
      return prod ? {
        ...prod.toObject(),
        id: prod._id,
        qty: item.quantity,
      } : null;
    }).filter(Boolean);
    res.json({ cart });
  } catch (err) {
    console.error('[UPDATE CART ITEM]', err);
    res.status(500).json({ message: 'Failed to update cart item.' });
  }
};

// Add address to user profile
export const addUserAddress = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name || !address || !phone) {
      return res.status(400).json({ message: 'All address fields are required.' });
    }
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.addresses.push({ name, address, phone });
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    console.error('[ADD USER ADDRESS]', err);
    res.status(500).json({ message: 'Failed to add address.' });
  }
};

// Admin marks order as paid after reviewing UPI transaction
export const markOrderAsPaid = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    order.paymentStatus = 'Paid';
    await order.save();
    // Notify user when order is marked as paid
    const user = await User.findById(order.userId);
    if (user && user.pushToken) {
      await notifications.sendPushNotification(
        user.pushToken,
        'Payment Received',
        `Your payment for order #${order._id} has been verified and marked as paid.`,
        { orderId: order._id, status: 'Paid' }
      );
    }
    res.json({ success: true, order });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to mark order as paid.' });
  }
};

// Get all users (admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await import('../models/User.js').then(m => m.default.find({}, '-password'));
    // Add id field for frontend compatibility
    res.json({ users: users.map(u => ({ ...u.toObject(), id: u._id, userId: u._id })) });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// Get all orders for a user (admin)
export const getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ userId }).sort({ placedAt: -1 });
    res.json({ orders: orders.map(order => ({ ...order.toObject(), id: order._id })) });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch user orders.' });
  }
};

// Update order (for UPI UTR submission or admin payment status update)
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { upiTransactionId, paymentStatus, paymentMethod } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (upiTransactionId !== undefined) order.upiTransactionId = upiTransactionId;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    await order.save();
    res.json({ success: true, order });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to update order.' });
  }
};
