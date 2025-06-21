import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../theme/ThemeProvider';
import { classNames } from '../utils/classNames';
import { formatPrice } from '../utils/formatPrice';
import api from '../services/api';

const Orders = () => {
  const { primary, mode } = useThemeContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/me');
      setOrders(data.orders || []);
      setError(null);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classNames('min-h-screen py-8 px-4', mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}> 
      <div className="max-w-3xl mx-auto">
        <h1 className={classNames('text-3xl font-bold mb-6', `text-[${primary}]`)}>Your Orders</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-lg">You have no orders yet.</div>
        ) : (
          <ul className="space-y-6">
            {orders.map(order => (
              <li key={order.id} className="bg-white dark:bg-gray-800 rounded shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">Order #{order.id}</div>
                  <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
                <ul className="text-sm mb-2">
                  {order.items.map(item => (
                    <li key={item.productId} className="flex justify-between">
                      <span>{item.name} x{item.qty}</span>
                      <span>{formatPrice(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
                <div className="font-bold text-right">Total: {formatPrice(order.total)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Orders;
