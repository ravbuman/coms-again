import dotenv from 'dotenv';
dotenv.config();

import AWS from 'aws-sdk';
import mongoose from 'mongoose';
import path from 'path';
import Admin from '../models/Admin.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import * as notifications from '../notifications.js';
import { 
  sendOrderPlacedEmail,
  sendOrderOtpEmail,
  sendOrderDeliveredEmail
} from '../utils/emailSender.js';
import { 
  sendOTPNotification,
  sendOrderConfirmationNotification,
  sendStatusUpdateNotification,
  testCommunicationServices as testComm
} from '../services/communicationService.js';
import { processOrderRewards } from '../middleware/rewardMiddleware.js';
import { 
  createDeliveryOTPData, 
  isOrderLocked, 
  getRecentFailedAttempts,
  isValidOTPFormat, 
  requiresOTPValidation,
  createFailedAttemptRecord,
  calculateLockoutExpiry,
  getRemainingLockoutTime
} from '../utils/otpUtils.js';

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

// Variant helper functions
function getDisplayPrice(product) {
  if (!product.hasVariants || !product.variants || product.variants.length === 0) {
    return product.price;
  }
  
  // Return the cheapest variant price
  const prices = product.variants.map(v => v.price);
  return Math.min(...prices);
}

function getVariantById(product, variantId) {
  if (!product.hasVariants || !product.variants || !variantId) {
    return null;
  }
  return product.variants.find(v => v.id === variantId);
}

function getDefaultVariant(product) {
  if (!product.hasVariants || !product.variants || product.variants.length === 0) {
    return null;
  }
  
  // Find default variant or return cheapest one
  const defaultVariant = product.variants.find(v => v.isDefault);
  if (defaultVariant) return defaultVariant;
  
  // Return cheapest variant as default
  return product.variants.reduce((cheapest, current) => 
    current.price < cheapest.price ? current : cheapest
  );
}

function calculateVariantStock(product, variantId) {
  if (!product.hasVariants) {
    return product.stock;
  }
  
  const variant = getVariantById(product, variantId);
  return variant ? variant.stock : 0;
}

function getVariantPrice(product, variantId) {
  if (!product.hasVariants) {
    return product.price;
  }
  
  const variant = getVariantById(product, variantId);
  return variant ? variant.price : product.price;
}

// Create product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, hasVariants, variants } = req.body;
    
    // Handle images
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImageToS3(file.buffer, file.originalname, name);
        images.push(url);
      }
    }
    
    // Parse variants if they exist
    let parsedVariants = [];
    if (hasVariants === 'true' && variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        // Generate unique IDs for variants
        parsedVariants = parsedVariants.map(variant => ({
          ...variant,
          id: variant.id || new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock)
        }));
      } catch (error) {
        return res.status(400).json({ message: 'Invalid variants data format.' });
      }
    }
    
    const productData = {
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      images,
      hasVariants: hasVariants === 'true',
      variants: parsedVariants
    };
    
    const product = new Product(productData);
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

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1, viewCount: -1, purchaseCount: -1 })
      .limit(limit);
    
    res.json({ 
      success: true, 
      products: products.map(addIdField),
      total: products.length 
    });
  } catch (error) {
    console.error('[GET FEATURED PRODUCTS]', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured products.' 
    });
  }
};

// Get product by id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.userId', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    
    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    
    // Ensure user names are available in reviews
    const productObj = product.toObject();
    productObj.reviews = productObj.reviews.map(review => ({
      ...review,
      user: review.user || review.userId?.name || review.userId?.email || 'Anonymous'
    }));
    
    res.json({ product: addIdField(productObj) });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product.' });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, hasVariants, variants } = req.body;
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    
    // Handle images
    let images = product.images;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImageToS3(file.buffer, file.originalname, name || product.name);
        images.push(url);
      }
    }
    
    // Parse variants if they exist
    let parsedVariants = product.variants || [];
    if (hasVariants === 'true' && variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        // Ensure variants have proper data types and IDs
        parsedVariants = parsedVariants.map(variant => ({
          ...variant,
          id: variant.id || new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock)
        }));
      } catch (error) {
        return res.status(400).json({ message: 'Invalid variants data format.' });
      }
    } else if (hasVariants === 'false') {
      parsedVariants = [];
    }
    
    const updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      images,
      hasVariants: hasVariants === 'true',
      variants: parsedVariants
    };
    
    product.set(updateData);
    await product.save();
    res.json({ product: addIdField(product) });
  } catch (_err) {
    console.error('[UPDATE PRODUCT]', _err);
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
    
    // Validation
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    
    if (comment.trim().length < 10) {
      return res.status(400).json({ message: 'Comment must be at least 10 characters long.' });
    }
    
    const userId = req.user.id;
    
    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    
    // Remove existing review by this user
    product.reviews = product.reviews.filter(r => r.userId.toString() !== userId);
    
    // Add new review
    const newReview = {
      userId,
      user: user.name || user.email, // Include user name
      rating: Number(rating),
      comment: comment.trim(),
      date: new Date(),
      createdAt: new Date()
    };
    
    product.reviews.push(newReview);
    await product.save();
    
    // Populate the reviews with user information
    await product.populate('reviews.userId', 'name email');
    
    res.json({ 
      message: 'Review added successfully',
      review: newReview,
      reviews: product.reviews 
    });
  } catch (error) {
    console.error('Add review error:', error);
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
    const { 
      items, 
      shipping, 
      subtotal,
      totalAmount, 
      paymentMethod, 
      coupon, 
      coinDiscount, // New: coin redemption data
      upiTransactionId, 
      paymentStatus 
    } = req.body;
    
    console.log('[CREATE ORDER] Received coin discount data:', coinDiscount);
    
    const userId = req.user.id;
      // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Items are required' });
    }
    if (!shipping) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    if (!totalAmount) {
      return res.status(400).json({ message: 'Total amount is required' });
    }    // Validate stock availability and prepare stock updates
    const stockUpdates = [];
    for (const item of items) {
      if (item.type === 'combo') {
        // Handle combo pack stock validation
        const ComboPack = (await import('../models/ComboPack.js')).default;
        const comboPack = await ComboPack.findById(item.id);
        if (!comboPack) {
          return res.status(400).json({ message: `Combo pack ${item.name} not found` });
        }

        // Check combo pack stock
        const availableStock = await comboPack.calculateAvailableStock();
        if (availableStock < item.qty) {
          return res.status(400).json({ 
            message: `Insufficient stock for combo pack ${item.name}. Available: ${availableStock}, Required: ${item.qty}` 
          });
        }

        // Track combo pack stock update
        stockUpdates.push({
          id: item.id,
          quantity: item.qty,
          type: 'combo',
          comboPack: comboPack
        });

        // Also track individual product stock updates within the combo
        for (const comboProduct of comboPack.products) {
          const product = await Product.findById(comboProduct.productId);
          if (product) {
            if (comboProduct.variantId) {
              stockUpdates.push({
                productId: comboProduct.productId,
                variantId: comboProduct.variantId,
                quantity: comboProduct.quantity * item.qty, // Multiply by combo quantity
                type: 'variant'
              });
            } else {
              stockUpdates.push({
                productId: comboProduct.productId,
                quantity: comboProduct.quantity * item.qty, // Multiply by combo quantity
                type: 'product'
              });
            }
          }
        }

      } else {
        // Handle regular product stock validation
        const product = await Product.findById(item.id);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.name} not found` });
        }

        if (item.hasVariant && item.variantId) {
          // Handle variant stock
          const variant = product.variants.find(v => v.id === item.variantId);
          if (!variant) {
            return res.status(400).json({ message: `Variant not found for ${item.name}` });
          }
          if (variant.stock < item.qty) {
            return res.status(400).json({ 
              message: `Insufficient stock for ${item.name} - ${item.variantName}. Available: ${variant.stock}, Required: ${item.qty}` 
            });
          }
          stockUpdates.push({
            productId: item.id,
            variantId: item.variantId,
            quantity: item.qty,
            type: 'variant'
          });
        } else {
          // Handle regular product stock
          if (product.stock < item.qty) {
            return res.status(400).json({ 
              message: `Insufficient stock for ${item.name}. Available: ${product.stock}, Required: ${item.qty}` 
            });
          }
          stockUpdates.push({
            productId: item.id,
            quantity: item.qty,
            type: 'product'
          });
        }
      }
    }

    let couponObjId = null;
    if (coupon) {
      couponObjId = coupon; // expects ObjectId from frontend
    }

    // Set payment status based on method and provided status
    let orderPaymentStatus = 'Pending';
    if (paymentMethod === 'UPI' && paymentStatus === 'paid') {
      orderPaymentStatus = 'UnderReview'; // UPI payments need admin verification
    } else if (paymentMethod === 'COD') {
      orderPaymentStatus = 'Pending';
    }    // Handle coin redemption if provided
    let coinRedemptionTransaction = null;
    if (coinDiscount && coinDiscount.coinsUsed > 0) {
      console.log('[CREATE ORDER] Processing coin redemption:', coinDiscount);
      
      try {
        // Import the redeem coins function
        const { redeemCoinsForOrder } = await import('./walletController.js');
        
        // Create a temporary order ID for the redemption
        const tempOrderId = new mongoose.Types.ObjectId();
        
        // Process the coin redemption
        const redemptionResult = await redeemCoinsForOrder(
          userId, 
          subtotal || totalAmount, 
          coinDiscount.coinsUsed, 
          tempOrderId
        );
        
        if (!redemptionResult.success) {
          return res.status(400).json({
            success: false,
            message: `Coin redemption failed: ${redemptionResult.message}`
          });
        }
        
        coinRedemptionTransaction = redemptionResult.transactionId;
        console.log('[CREATE ORDER] Coin redemption successful, transaction:', coinRedemptionTransaction);
        
      } catch (redemptionError) {
        console.error('[CREATE ORDER] Coin redemption error:', redemptionError);
        return res.status(500).json({
          success: false,
          message: 'Failed to process coin redemption'
        });
      }
    }

    // Calculate discount breakdown
    const calculatedSubtotal = subtotal || totalAmount;
    const couponDiscountAmount = 0; // Will be calculated if coupon exists
    const coinDiscountAmount = coinDiscount ? coinDiscount.discountAmount || 0 : 0;
    const shippingFee = calculatedSubtotal >= 500 ? 0 : 100; // Free shipping over ₹500

    // Create order with proper breakdown
    const order = new Order({
      userId,
      items,
      shipping,
      subtotal: calculatedSubtotal,
      couponDiscount: couponDiscountAmount,
      coinDiscount: {
        amount: coinDiscountAmount,
        coinsUsed: coinDiscount ? coinDiscount.coinsUsed || 0 : 0,
        transactionId: coinRedemptionTransaction
      },
      shippingFee: shippingFee,
      totalAmount,
      paymentMethod: paymentMethod.toUpperCase(),
      paymentStatus: orderPaymentStatus,
      coupon: couponObjId,
      upiTransactionId: upiTransactionId || null,
      deliveryOtp: createDeliveryOTPData()
    });
    
    await order.save();
    
    // Update the coin redemption transaction with the actual order ID
    if (coinRedemptionTransaction) {
      try {
        const Transaction = (await import('../models/Transaction.js')).default;
        await Transaction.findByIdAndUpdate(coinRedemptionTransaction, {
          orderId: order._id,
          $set: {
            'metadata.orderId': order._id.toString(),
            'metadata.orderNumber': order._id.toString().slice(-8).toUpperCase()
          }
        });
        console.log('[CREATE ORDER] Updated transaction with order ID:', order._id);
      } catch (updateError) {
        console.error('[CREATE ORDER] Failed to update transaction with order ID:', updateError);
      }
    }    // Reduce stock after successful order creation
    for (const update of stockUpdates) {
      if (update.type === 'combo') {
        // Reduce combo pack stock
        const ComboPack = (await import('../models/ComboPack.js')).default;
        await ComboPack.updateOne(
          { _id: update.id },
          { 
            $inc: { 
              stock: -update.quantity,
              purchaseCount: update.quantity // Track purchase count for analytics
            } 
          }
        );      } else if (update.type === 'variant') {
        await Product.updateOne(
          { _id: update.productId, 'variants.id': update.variantId },
          { $inc: { 'variants.$.stock': -update.quantity } }
        );
        // Increment purchase count for the main product when variant is purchased
        await Product.updateOne(
          { _id: update.productId },
          { $inc: { purchaseCount: update.quantity } }
        );
      } else if (update.type === 'product') {
        await Product.updateOne(
          { _id: update.productId },
          { 
            $inc: { 
              stock: -update.quantity,
              purchaseCount: update.quantity // Track purchase count for analytics
            } 
          }
        );
      }
    }// Notify all admins of new order
    try {
      const admins = await Admin.find({ pushToken: { $exists: true, $ne: null } });
      const user = await User.findById(userId);
      if (admins.length > 0 && user) {
        await notifications.notifyAdminsNewOrder(admins, order._id, user.name);
      } else {
        console.log('[ORDER] No push notifications sent - missing admins or user');
      }

      // Send order placed email using your Brevo service
      if (user && user.email) {
        try {
          await sendOrderPlacedEmail(user.email, user.name, order);
          console.log(`[EMAIL] Order placed email sent to ${user.email} for order ${order._id}`);
        } catch (emailError) {
          console.error('[EMAIL] Order placed email error:', emailError);
          // Don't fail order creation if email fails
        }
      }

      // Send order confirmation via other channels (SMS, WhatsApp)
      if (user && user.phone) {
        try {
          const confirmationResult = await sendOrderConfirmationNotification(user, order, ['sms', 'whatsapp']);
          console.log(`[ORDER] SMS/WhatsApp confirmation sent for order ${order._id}:`, confirmationResult.summary);
        } catch (confirmError) {
          console.error('[ORDER] SMS/WhatsApp confirmation error:', confirmError);
          // Don't fail order creation if confirmation fails
        }
      }
    } catch (notifError) {
      console.error('[ORDER] Notification error:', notifError);
      // Don't fail order creation if notifications fail
    }

    res.status(201).json({ order });
  } catch (error) {
    console.error('[CREATE ORDER] Error:', error);
    res.status(500).json({ message: 'Failed to create order.', error: error.message });
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
    const { status, deliveryOtp } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Check if OTP validation is required for this status update
    if (requiresOTPValidation(order.status, status)) {
      // Validate OTP when updating to "Delivered"
      if (!deliveryOtp) {
        return res.status(400).json({ 
          message: 'Delivery verification code is required to mark order as delivered.',
          requiresOtp: true
        });
      }

      // Validate OTP format
      if (!isValidOTPFormat(deliveryOtp)) {
        return res.status(400).json({ 
          message: 'Invalid verification code format. Please enter a 6-digit code.',
          requiresOtp: true
        });
      }

      // Check if order is locked out
      if (isOrderLocked(order)) {
        const remainingTime = getRemainingLockoutTime(order.deliveryOtp.lockoutUntil);
        return res.status(429).json({ 
          message: `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
          requiresOtp: true,
          lockoutMinutes: remainingTime
        });
      }

      // Check if OTP has already been used
      if (order.deliveryOtp.isUsed) {
        return res.status(400).json({ 
          message: 'This delivery verification code has already been used.',
          requiresOtp: true
        });
      }

      // Validate the OTP
      if (order.deliveryOtp.code !== deliveryOtp) {
        // Record failed attempt
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const failedAttempt = createFailedAttemptRecord(deliveryOtp, clientIP);
        order.deliveryOtp.failedAttempts.push(failedAttempt);

        // Check if should lock out (3 failed attempts in 10 minutes)
        const recentFailures = getRecentFailedAttempts(order);
        if (recentFailures >= 3) {
          order.deliveryOtp.lockoutUntil = calculateLockoutExpiry();
          await order.save();
          
          return res.status(429).json({ 
            message: 'Too many failed attempts. Account locked for 30 minutes.',
            requiresOtp: true,
            lockoutMinutes: 30
          });
        }

        await order.save();
        
        return res.status(400).json({ 
          message: `Invalid verification code. ${3 - recentFailures} attempts remaining.`,
          requiresOtp: true,
          attemptsRemaining: 3 - recentFailures
        });
      }

      // OTP is valid - mark as used and add delivered timestamp
      order.deliveryOtp.isUsed = true;
      order.deliveredAt = new Date();
    }    // Update order status
    order.status = status;

    // If admin marks UPI order as paid, also update paymentStatus
    if (order.paymentMethod === 'UPI' && status === 'Paid') {
      order.paymentStatus = 'Paid';
    }

    await order.save();

    // Get user for notifications
    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found for order notifications.' });
    }    // Handle special status-based notifications
    try {
      // Send OTP when order is shipped - using your Brevo email service
      if (status === 'Shipped' && order.deliveryOtp && order.deliveryOtp.code) {
        // Send OTP via your Brevo email service
        if (user.email) {
          try {
            await sendOrderOtpEmail(user.email, user.name, order.deliveryOtp.code, order._id.toString());
            console.log(`[EMAIL] OTP email sent to ${user.email} for shipped order ${order._id}`);
          } catch (otpEmailError) {
            console.error('[EMAIL] OTP email error:', otpEmailError);
          }
        }

        // Send OTP via SMS and WhatsApp as backup
        if (user.phone) {
          try {
            const otpResult = await sendOTPNotification(
              user, 
              order.deliveryOtp.code, 
              order._id.toString(),
              ['sms', 'whatsapp'] // Only SMS and WhatsApp, email handled above
            );
            console.log(`[ORDER] OTP sent via SMS/WhatsApp for shipped order ${order._id}:`, otpResult.summary);
          } catch (otpError) {
            console.error('[ORDER] SMS/WhatsApp OTP notification error:', otpError);
          }
        }
      }

      // Send delivery confirmation email when order is delivered
      if (status === 'Delivered' && user.email) {
        try {
          await sendOrderDeliveredEmail(user.email, user.name, order._id.toString());
          console.log(`[EMAIL] Delivery confirmation email sent to ${user.email} for order ${order._id}`);
        } catch (deliveryEmailError) {
          console.error('[EMAIL] Delivery confirmation email error:', deliveryEmailError);
        }
      }

      // Send status update via SMS and WhatsApp for other status changes
      if (user.phone && status !== 'Shipped') // Skip shipped since we handle it above
      {
        try {
          const statusResult = await sendStatusUpdateNotification(user, order._id.toString(), status, ['sms', 'whatsapp']);
          console.log(`[ORDER] Status update sent for ${order._id}:`, statusResult.summary);
        } catch (statusError) {
          console.error('[ORDER] Status update notification error:', statusError);
          // Don't fail status update if notifications fail
        }
      }

      // Legacy push notification (keep for compatibility)
      await notifications.notifyOrderStatus(user, order._id, status);

      // Special handling for UPI payment confirmation
      if (order.paymentMethod === 'UPI' && status === 'Paid') {
        await notifications.sendPushNotification(
          user.pushToken,
          'Payment Received',
          `Your UPI payment for order #${order._id} has been verified and marked as paid.`,
          { orderId: order._id, status: 'Paid' }
        );
      }
    } catch (notificationError) {
      console.error('[ORDER] Notification error:', notificationError);
      // Don't fail status update if notifications fail
    }

    // Process order rewards if status is "Delivered"
    if (status === 'Delivered') {
      try {
        console.log(`[ORDER REWARDS] Starting reward processing for order ${order._id}`);
        const rewardResult = await processOrderRewards(order);
        if (rewardResult) {
          console.log(`[ORDER REWARDS] SUCCESS: Awarded ${rewardResult.coinsAwarded} Indira Coins to user ${order.userId} for order ${order._id}`);
        } else {
          console.log(`[ORDER REWARDS] No rewards awarded for order ${order._id} (amount: ₹${order.totalAmount})`);
        }
      } catch (rewardError) {
        console.error('[ORDER REWARDS] FAILED to process rewards:', rewardError);
        console.error('[ORDER REWARDS] Stack trace:', rewardError.stack);
        // Don't fail order update if reward processing fails, but log extensively
      }
    }

    res.json({ 
      order,
      message: status === 'Delivered' ? 'Order delivered successfully!' : 'Order status updated successfully!'
    });
  } catch (error) {
    console.error('[UPDATE ORDER STATUS] Error:', error);
    res.status(500).json({ message: 'Failed to update order status.' });
  }
};

// Cancel order (user)
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status !== 'Pending') return res.status(400).json({ message: 'Cannot cancel order after it is shipped.' });
    
    // Restore stock when order is cancelled
    for (const item of order.items) {
      if (item.hasVariant && item.variantId) {
        // Restore variant stock
        await Product.updateOne(
          { _id: item.id, 'variants.id': item.variantId },
          { $inc: { 'variants.$.stock': item.qty } }
        );
      } else {
        // Restore regular product stock
        await Product.updateOne(
          { _id: item.id },
          { $inc: { stock: item.qty } }
        );
      }
    }
    
    order.status = 'Cancelled';
    await order.save();
    res.json({ order });
  } catch (error) {
    console.error('[CANCEL ORDER] Error:', error);
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

//   Wishlist  
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

//   Cart  
// Enhanced getCart: fetch user, then fetch product and combo pack details for all cart items
export const getCart = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const ComboPack = (await import('../models/ComboPack.js')).default;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!user.cart || user.cart.length === 0) return res.json({ cart: [] });
    
    const cart = [];
    
    // Process each cart item
    for (const item of user.cart) {
      if (item.type === 'product') {
        // Handle product items
        const product = await Product.findById(item.product);
        if (!product) continue; // Skip if product not found
        
        const cartItem = {
          ...product.toObject(),
          id: product._id,
          type: 'product',
          qty: item.quantity,
          addedAt: item.addedAt
        };
        
        // Add variant information if present
        if (item.variantId && product.hasVariants) {
          const variant = getVariantById(product, item.variantId);
          if (variant) {
            cartItem.selectedVariant = {
              id: item.variantId,
              name: item.variantName || variant.name,
              label: variant.label,
              price: item.variantPrice || variant.price,
              originalPrice: variant.originalPrice,
              stock: variant.stock,
              images: variant.images
            };
            // Override main product price with variant price for cart calculations
            cartItem.price = item.variantPrice || variant.price;
          }
        }
        
        cart.push(cartItem);
        
      } else if (item.type === 'combo') {
        // Handle combo pack items
        const comboPack = await ComboPack.findById(item.comboPackId).populate('products.productId', 'name images');
        if (!comboPack) continue; // Skip if combo pack not found
        
        const cartItem = {
          ...comboPack.toObject(),
          id: comboPack._id,
          type: 'combo',
          qty: item.quantity,
          addedAt: item.addedAt,
          price: comboPack.comboPrice // Use combo price for calculations
        };
        
        cart.push(cartItem);
      }
    }

    res.json({ cart });
  } catch (err) {
    console.error('[GET CART]', err);
    res.status(500).json({ message: 'Failed to fetch cart.' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    // Get product to validate variant
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    
    let variantInfo = null;
    let itemPrice = product.price;
    let stockToCheck = product.stock;
    
    // Handle variant validation and pricing
    if (product.hasVariants) {
      if (!variantId) {
        // Auto-select default/cheapest variant if none provided
        const defaultVariant = getDefaultVariant(product);
        if (!defaultVariant) {
          return res.status(400).json({ message: 'No variants available for this product.' });
        }
        variantInfo = defaultVariant;
      } else {
        variantInfo = getVariantById(product, variantId);
        if (!variantInfo) {
          return res.status(400).json({ message: 'Invalid variant selected.' });
        }
      }
      
      itemPrice = variantInfo.price;
      stockToCheck = variantInfo.stock;
      
      // Check variant stock
      if (stockToCheck < quantity) {
        return res.status(400).json({ message: `Only ${stockToCheck} items available for this variant.` });
      }
    } else {
      // Regular product stock check
      if (stockToCheck < quantity) {
        return res.status(400).json({ message: `Only ${stockToCheck} items available.` });
      }
    }
      // Check if item with same variant already exists in cart
    const cartKey = variantInfo ? `${productId}-${variantInfo.id}` : productId;
    const idx = user.cart.findIndex(item => {
      if (item.type !== 'product') return false; // Only match product items
      if (variantInfo) {
        return item.product.toString() === productId && item.variantId === variantInfo.id;
      }
      return item.product.toString() === productId && !item.variantId;
    });
    
    if (idx > -1) {
      // Update existing cart item
      user.cart[idx].quantity += quantity;
      if (variantInfo) {
        user.cart[idx].variantPrice = itemPrice; // Update price in case it changed
      }
    } else {
      // Add new cart item
      const cartItem = {
        type: 'product',
        product: productId,
        quantity: quantity
      };
      
      if (variantInfo) {
        cartItem.variantId = variantInfo.id;
        cartItem.variantName = variantInfo.name;
        cartItem.variantPrice = itemPrice;
      }
      
      user.cart.push(cartItem);
    }
    
    await user.save();
    res.json({ cart: user.cart, message: 'Added to cart successfully' });
  } catch (err) {
    console.error('[ADD TO CART]', err);
    res.status(500).json({ message: 'Failed to add to cart.' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId, variantId, comboPackId, type } = req.body;
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    if (type === 'combo' && comboPackId) {
      // Remove combo pack from cart
      user.cart = user.cart.filter(item => 
        !(item.type === 'combo' && item.comboPackId.toString() === comboPackId)
      );
    } else if (productId) {
      // Remove product from cart (with optional variant)
      user.cart = user.cart.filter(item => {
        if (item.type !== 'product') return true; // Keep non-product items
        
        if (variantId) {
          // Remove specific variant
          return !(item.product.toString() === productId && item.variantId === variantId);
        } else {
          // Remove all variants of this product
          return item.product.toString() !== productId;
        }
      });
    } else {
      return res.status(400).json({ message: 'Invalid request parameters.' });
    }
    
    await user.save();
    res.json({ cart: user.cart, message: 'Removed from cart successfully' });
  } catch (err) {
    console.error('[REMOVE FROM CART]', err);
    res.status(500).json({ message: 'Failed to remove from cart.' });
  }
};

export const clearCart = async (req, res) => {
  try {
    console.log('[CLEAR CART] Request received for user:', req.user.id);
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('[CLEAR CART] User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found.' });
    }
    
    console.log('[CLEAR CART] Current cart length:', user.cart.length);
    user.cart = [];
    await user.save();
    console.log('[CLEAR CART] Cart cleared successfully for user:', req.user.id);
    res.json({ message: 'Cart cleared successfully', cart: [] });
  } catch (err) {
    console.error('[CLEAR CART] Error:', err);
    res.status(500).json({ message: 'Failed to clear cart.' });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    console.log('Updating cart item for user:', req.user.id);
    console.log('Request body:', req.body);    const { productId, qty, variantId, comboPackId, type } = req.body;
    if (!qty || qty < 1) {
      console.error('Invalid quantity:', qty);
      return res.status(400).json({ message: 'Invalid quantity.' });
    }
    
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user) { 
      console.error('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found.' });
    }
      console.log('User cart before update:', user.cart);
    
    let idx = -1;
    
    if (type === 'combo' && comboPackId) {
      // Find combo pack item
      idx = user.cart.findIndex(item => 
        item.type === 'combo' && item.comboPackId.toString() === comboPackId
      );
      
      if (idx === -1) {
        return res.status(404).json({ message: 'Combo pack not found in cart.' });
      }
      
      // Validate combo pack stock
      const ComboPack = (await import('../models/ComboPack.js')).default;
      const comboPack = await ComboPack.findById(comboPackId);
      if (comboPack) {
        const availableStock = await comboPack.calculateAvailableStock();
        if (qty > availableStock) {
          return res.status(400).json({ message: `Only ${availableStock} combo packs available.` });
        }
      }
      
    } else if (productId) {
      // Find product item by product and variant
      idx = user.cart.findIndex(item => {
        if (item.type !== 'product') return false;
        if (variantId) {
          return item.product.toString() === productId && item.variantId === variantId;
        }
        return item.product.toString() === productId && !item.variantId;
      });
      
      if (idx === -1) {
        return res.status(404).json({ message: 'Product not found in cart.' });
      }
      
      // Validate product stock
      const product = await Product.findById(productId);
      if (product) {
        let stockToCheck = product.stock;
        if (product.hasVariants && variantId) {
          const variant = getVariantById(product, variantId);
          stockToCheck = variant ? variant.stock : 0;
        }
        
        if (qty > stockToCheck) {
          return res.status(400).json({ message: `Only ${stockToCheck} items available.` });
        }
      }
    } else {
      return res.status(400).json({ message: 'Invalid request parameters.' });
    }
    
    // Update quantity
    user.cart[idx].quantity = parseInt(qty);
    
    await user.save();
    
    // Return updated cart with product details
    if (!user.cart || user.cart.length === 0) return res.json({ cart: [] });
    
    const productIds = user.cart.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    const cart = user.cart.map(item => {
      const prod = products.find(p => p._id.toString() === item.product.toString());
      if (!prod) return null;
      
      const cartItem = {
        ...prod.toObject(),
        id: prod._id,
        qty: item.quantity,
      };
      
      // Add variant information if present
      if (item.variantId) {
        cartItem.selectedVariant = {
          id: item.variantId,
          name: item.variantName,
          price: item.variantPrice
        };
      }
      
      return cartItem;
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

// Toggle product featured status (admin)
export const toggleProductFeatured = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    
    // Toggle featured status
    product.featured = !product.featured;
    await product.save();
    
    res.json({ 
      success: true, 
      product: addIdField(product),
      message: `Product ${product.featured ? 'marked as featured' : 'removed from featured'}.`
    });
  } catch (error) {
    console.error('[TOGGLE PRODUCT FEATURED]', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle product featured status.' 
    });
  }
};

// ======================
// DELIVERY SLOT MANAGEMENT
// ======================

// Time slots configuration
const TIME_SLOTS = [
  { id: 'morning', label: '9:00 AM - 12:00 PM', value: '9:00 AM - 12:00 PM' },
  { id: 'afternoon', label: '12:00 PM - 3:00 PM', value: '12:00 PM - 3:00 PM' },
  { id: 'evening', label: '3:00 PM - 6:00 PM', value: '3:00 PM - 6:00 PM' },
  { id: 'night', label: '6:00 PM - 9:00 PM', value: '6:00 PM - 9:00 PM' }
];

// Get available time slots
export const getTimeSlots = async (req, res) => {
  try {
    res.json({
      success: true,
      timeSlots: TIME_SLOTS
    });
  } catch (error) {
    console.error('[GET TIME SLOTS]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time slots.'
    });
  }
};

// Get available delivery dates (starting 2 days from today)
export const getAvailableDeliveryDates = async (req, res) => {
  try {
    const dates = [];
    const today = new Date();
    
    // Generate dates starting from 2 days ahead, for next 30 days
    for (let i = 2; i <= 32; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        label: date.toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    }
    
    res.json({
      success: true,
      availableDates: dates
    });
  } catch (error) {
    console.error('[GET AVAILABLE DELIVERY DATES]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available delivery dates.'
    });
  }
};

// Update delivery slot for an order
export const updateDeliverySlot = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { date, timeSlot } = req.body;
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }
    
    // Check if user owns the order (for user requests)
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this order.'
      });
    }
    
    // Check if delivery slot can be modified
    if (!order.canModifyDeliverySlot()) {
      return res.status(400).json({
        success: false,
        message: `Delivery slot cannot be modified. Order status: ${order.status}`
      });
    }
    
    // Validate date (must be at least 2 days from today)
    if (date) {
      const selectedDate = new Date(date);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 2);
      minDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < minDate) {
        return res.status(400).json({
          success: false,
          message: 'Delivery date must be at least 2 days from today.'
        });
      }
    }
    
    // Validate time slot
    if (timeSlot && !TIME_SLOTS.some(slot => slot.value === timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time slot selected.'
      });
    }
    
    // Update delivery slot
    if (date) order.deliverySlot.date = new Date(date);
    if (timeSlot) order.deliverySlot.timeSlot = timeSlot;
    order.deliverySlot.lastModified = new Date();
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Delivery slot updated successfully.',
      deliverySlot: {
        date: order.deliverySlot.date,
        timeSlot: order.deliverySlot.timeSlot,
        lastModified: order.deliverySlot.lastModified
      }
    });
  } catch (error) {
    console.error('[UPDATE DELIVERY SLOT]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery slot.'
    });
  }
};8

// Get delivery slot for an order
export const getDeliverySlot = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }
    
    // Check if user owns the order (for user requests)
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this order.'
      });
    }
    
    res.json({
      success: true,
      deliverySlot: {
        date: order.deliverySlot.date,
        timeSlot: order.deliverySlot.timeSlot,
        isModifiable: order.deliverySlot.isModifiable,
        lastModified: order.deliverySlot.lastModified
      },
      canModify: order.canModifyDeliverySlot()
    });
  } catch (error) {
    console.error('[GET DELIVERY SLOT]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery slot.'
    });
  }
};
