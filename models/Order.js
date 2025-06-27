import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  items: [
    {
      // Product or Combo Pack reference
      id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Can ref Product or ComboPack
      name: String,
      price: Number,
      qty: Number,
      image: String,
      
      // Type identification
      itemType: { type: String, enum: ['product', 'combo'], default: 'product' },
      
      // Product-specific fields
      variantId: String, // The variant ID from the product's variants array
      variantName: String, // e.g., "500ml", "Large", "Red"
      variantPrice: Number, // Price of the specific variant
      hasVariant: { type: Boolean, default: false }, // Whether this item has a variant
      
      // Combo Pack-specific fields
      comboProducts: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        variantId: String,
        variantName: String,
        quantity: Number,
        originalPrice: Number,
        images: [{
          url: String,
          source: String, // 'product' or 'variant'
          alt: String
        }]
      }],
      originalTotalPrice: Number, // For combo packs: sum of individual product prices
      discountAmount: Number, // For combo packs: total discount
      discountPercentage: Number // For combo packs: discount percentage
    }
  ],
  shipping: {
    name: String,
    address: String,
    phone: String
  },
  totalAmount: { type: Number, required: true },
  
  // Discount breakdown
  subtotal: { type: Number, required: true }, // Original amount before discounts
  couponDiscount: { type: Number, default: 0 }, // Discount from coupon
  coinDiscount: { 
    amount: { type: Number, default: 0 }, // Discount amount from coins
    coinsUsed: { type: Number, default: 0 }, // Number of coins redeemed
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' } // Reference to coin transaction
  },
  shippingFee: { type: Number, default: 0 }, // Shipping fee
  
  status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['COD', 'UPI'], default: 'COD' },  paymentStatus: { type: String, enum: ['Pending', 'UnderReview', 'Paid'], default: 'Pending' },
  upiTransactionId: { type: String }, // UTR entered by user
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  // OTP Delivery Verification
  deliveryOtp: {
    code: { type: String, required: true }, // 6-digit OTP code
    generatedAt: { type: Date, required: true }, // When OTP was created
    isUsed: { type: Boolean, default: false }, // Has OTP been used successfully
    failedAttempts: [{
      attemptedAt: { type: Date, required: true }, // When attempt was made
      attemptedCode: { type: String, required: true }, // What code was entered
      ipAddress: String // IP address of the attempt (for security)
    }],
    lockoutUntil: Date // When lockout expires (null if not locked)
  },
  
  // Delivery Slot Selection
  deliverySlot: {
    date: {
      type: Date,
      required: false,
      validate: {
        validator: function(value) {
          if (!value) return true; // Allow null/undefined
          const twoDaysFromNow = new Date();
          twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
          twoDaysFromNow.setHours(0, 0, 0, 0);
          return value >= twoDaysFromNow;
        },
        message: 'Delivery date must be at least 2 days from today'
      }
    },
    timeSlot: {
      type: String,
      enum: [
        '9:00 AM - 12:00 PM',
        '12:00 PM - 3:00 PM', 
        '3:00 PM - 6:00 PM',
        '6:00 PM - 9:00 PM'
      ],
      required: false
    },
    isModifiable: {
      type: Boolean,
      default: true
    },
    lastModified: {
      type: Date,
      default: Date.now
    }
  },
  
  placedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Method to check if delivery slot can be modified
orderSchema.methods.canModifyDeliverySlot = function() {
  // Allow modification for all statuses as requested
  return true;
};

// Method to update delivery slot modifiability based on status
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    // Allow modification for all statuses as requested
    this.deliverySlot.isModifiable = true;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
