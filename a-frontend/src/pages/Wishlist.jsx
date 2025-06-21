import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../theme/ThemeProvider';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';
import { formatPrice } from '../utils/formatPrice';
import { classNames } from '../utils/classNames';

const Wishlist = () => {
  const { primary, mode } = useThemeContext();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await getWishlist();
      setWishlist(data.items || []);
      setError(null);
    } catch {
      setError('Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      fetchWishlist();
    } catch {
      setError('Could not remove item.');
    }
  };

  return (
    <div className={classNames('min-h-screen py-8 px-4', mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}> 
      <div className="max-w-3xl mx-auto">
        <h1 className={classNames('text-3xl font-bold mb-6', `text-[${primary}]`)}>Your Wishlist</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : wishlist.length === 0 ? (
          <div className="text-lg">Your wishlist is empty.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {wishlist.map(item => (
              <li key={item.productId} className="flex items-center py-4">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover mr-4 border" />
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-500">{formatPrice(item.price)}</div>
                </div>
                <button onClick={() => handleRemove(item.productId)} className={classNames('ml-4 px-3 py-1 rounded text-white', `bg-[${primary}] hover:opacity-80`)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
