import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../theme/ThemeProvider';
import { classNames } from '../utils/classNames';
import { useAuth } from '../utils/useAuth';
import { getAllOrders, getAllUsers, getAllCoupons } from '../services/adminService';
import { getProducts } from '../../services/productService';
import AdminSidebar from '../components/AdminSidebar';
import { 
  PackageIcon, 
  OrdersIcon, 
  PeopleIcon, 
  TicketIcon, 
  LoadingIcon, 
  EmptyIcon,
  MoneyIcon,
  PendingIcon
} from '../components/AdminIcons';

const Admin = () => {
  const { primary, mode } = useThemeContext();
  const { isAdmin, admin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalCoupons: 0,
    pendingOrders: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, usersRes, couponsRes] = await Promise.all([
        getProducts(),
        getAllOrders(),
        getAllUsers(),
        getAllCoupons()
      ]);

      const products = productsRes.data.products || [];
      const orders = ordersRes.data.orders || [];
      const users = usersRes.data.users || [];
      const coupons = couponsRes.data.coupons || [];

      const pendingOrders = orders.filter(order => order.status === 'Pending').length;
      const recentOrders = orders.slice(0, 5);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalCoupons: coupons.length,
        pendingOrders,
        recentOrders
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-8 rounded-3xl shadow-soft bg-white/70 backdrop-blur-sm">
          <EmptyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-8 rounded-3xl shadow-soft bg-white/70 backdrop-blur-sm">
          <LoadingIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <AdminSidebar />
      
      <main className="flex-1 px-2 sm:px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-gray-800 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, <span className="font-semibold text-green-700">{admin?.name || 'Admin'}</span>! Here's what's happening with your store.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-soft-lg transition-all duration-300">
              <div className="flex items-center">
                <div className="neumorphic-icon p-4 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-soft">
                  <PackageIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Total Products</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-soft-lg transition-all duration-300">
              <div className="flex items-center">
                <div className="neumorphic-icon p-4 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-soft">
                  <OrdersIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-soft-lg transition-all duration-300">
              <div className="flex items-center">
                <div className="neumorphic-icon p-4 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 shadow-soft">
                  <PeopleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-soft-lg transition-all duration-300">
              <div className="flex items-center">
                <div className="neumorphic-icon p-4 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 shadow-soft">
                  <TicketIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Active Coupons</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalCoupons}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="w-2 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full mr-3"></span>
              Recent Orders
            </h2>
            {stats.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-100/50 hover:bg-white/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm text-gray-600">{order._id.slice(-8)}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800">{order.shipping?.name || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800">₹{order.totalAmount}</td>
                        <td className="py-3 px-4">
                          <span className={classNames(
                            'px-3 py-1 rounded-full text-xs font-medium flex items-center',
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          )}>
                            {order.status === 'Pending' && <PendingIcon className="w-3 h-3 mr-1" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(order.placedAt || order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <EmptyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No recent orders</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 text-center hover:shadow-soft-lg transition-all duration-300 cursor-pointer" onClick={() => navigate('/admin/orders')}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-soft flex items-center justify-center">
                <PendingIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Pending Orders</h3>
              <p className="text-4xl font-bold mb-4 text-green-600">{stats.pendingOrders}</p>
              <button className="neumorphic-button px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-soft-lg transition-all duration-300">
                View All Orders
              </button>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 text-center hover:shadow-soft-lg transition-all duration-300 cursor-pointer" onClick={() => navigate('/admin/products')}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-soft flex items-center justify-center">
                <PackageIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Manage Products</h3>
              <p className="text-gray-600 mb-4">Add, edit, or remove products</p>
              <button className="neumorphic-button px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-soft-lg transition-all duration-300">
                Manage Products
              </button>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 text-center hover:shadow-soft-lg transition-all duration-300 cursor-pointer" onClick={() => navigate('/admin/coupons')}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 shadow-soft flex items-center justify-center">
                <TicketIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Create Coupon</h3>
              <p className="text-gray-600 mb-4">Generate new discount codes</p>
              <button className="neumorphic-button px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-soft-lg transition-all duration-300">
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .neumorphic-card {
          box-shadow: 
            20px 20px 60px rgba(0, 0, 0, 0.05),
            -20px -20px 60px rgba(255, 255, 255, 0.8);
        }
        .shadow-soft {
          box-shadow: 
            8px 8px 16px rgba(0, 0, 0, 0.1),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
        }
        .shadow-soft-lg {
          box-shadow: 
            12px 12px 24px rgba(0, 0, 0, 0.1),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }
        .neumorphic-button {
          box-shadow: 
            6px 6px 12px rgba(0, 0, 0, 0.2),
            -6px -6px 12px rgba(255, 255, 255, 0.1);
        }
        .neumorphic-icon {
          box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.2),
            -4px -4px 8px rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Admin;
