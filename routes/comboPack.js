import express from 'express';
import * as comboPackController from '../controllers/comboPackController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Public routes (customer-facing)
router.get('/featured', comboPackController.getFeaturedComboPacks);
router.get('/all', comboPackController.getAllComboPacks);
router.get('/id/:id', comboPackController.getComboPackById);
router.get('/slug/:slug', comboPackController.getComboPackBySlug);

// User routes (require authentication)
router.post('/:id/review', authenticateUser, comboPackController.addComboPackReview);

// Cart routes
router.post('/cart/add', authenticateUser, comboPackController.addComboPackToCart);
router.post('/cart/remove', authenticateUser, comboPackController.removeComboPackFromCart);
router.post('/cart/update', authenticateUser, comboPackController.updateComboPackCartQuantity);

// Wishlist routes
router.get('/wishlist/me', authenticateUser, comboPackController.getComboPackWishlist);
router.post('/wishlist/add', authenticateUser, comboPackController.addComboPackToWishlist);
router.post('/wishlist/remove', authenticateUser, comboPackController.removeComboPackFromWishlist);

// Admin routes (require authentication - add admin middleware when available)
router.post('/create', authenticateUser, comboPackController.createComboPack);
router.put('/:id', authenticateUser, comboPackController.updateComboPack);
router.delete('/:id', authenticateUser, comboPackController.deleteComboPack);

export default router;
