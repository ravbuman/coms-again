import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../theme/ThemeProvider';
import { getCart, addToCart, removeFromCart, clearCart } from '../services/cartService';
import { formatPrice } from '../utils/formatPrice';
import { classNames } from '../utils/classNames';

const Cart = () => {
  const { primary, mode } = useThemeContext();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCart();
      setCart(data.items || []);
      setError(null);
    } catch (err) {
      setError('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    try {
      await addToCart(productId, quantity);
      fetchCart();
    } catch {
      setError('Could not update item.');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      fetchCart();
    } catch {
      setError('Could not remove item.');
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      fetchCart();
    } catch {
      setError('Could not clear cart.');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className={classNames('min-h-screen py-8 px-4', mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}> 
      <div className="max-w-3xl mx-auto">
        <h1 className={classNames('text-3xl font-bold mb-6', `text-[${primary}]`)}>Your Cart</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : cart.length === 0 ? (
          <div className="text-lg">Your cart is empty.</div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {cart.map(item => (
                <li key={item.productId} className="flex items-center py-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover mr-4 border" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-500">{formatPrice(item.price)}</div>
                    <div className="flex items-center mt-2">
                      <button onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="px-2 py-1 border rounded-l disabled:opacity-50">-</button>
                      <span className="px-3 py-1 border-t border-b">{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="px-2 py-1 border rounded-r">+</button>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(item.productId)} className={classNames('ml-4 px-3 py-1 rounded text-white', `bg-[${primary}] hover:opacity-80`)}>Remove</button>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mt-8">
              <div className="text-xl font-bold">Total: {formatPrice(total)}</div>
              <button onClick={handleClear} className={classNames('px-4 py-2 rounded text-white', `bg-[${primary}] hover:opacity-80`)}>Clear Cart</button>
            </div>
            <div className="mt-6 text-right">
              <button className={classNames('px-6 py-3 rounded text-white font-semibold text-lg', `bg-[${primary}] hover:opacity-90`)}>Proceed to Checkout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
