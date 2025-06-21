import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../theme/ThemeProvider';
import { classNames } from '../utils/classNames';
import { useAuth } from '../utils/useAuth';
import { getOrderById, updateOrderStatus, markOrderAsPaid } from '../services/adminService';
import AdminSidebar from '../components/AdminSidebar';
import { 
  LoadingIcon, 
  EmptyIcon, 
  BackIcon,
  PendingIcon,
  ShippedIcon,
  DeliveredIcon,
  CancelledIcon,
  PaidIcon,
  UpdateIcon,
  MoneyIcon,
  PackageIcon,
  PeopleIcon,
  CloseIcon
} from '../components/AdminIcons';

const AdminOrderDetail = () => {
  const { primary, mode } = useThemeContext();
  const { isAdmin } = useAuth();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await getOrderById(orderId);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      await fetchOrder();
      setShowStatusModal(false);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(`Error updating status: ${error.response?.data?.message || error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setUpdating(true);
    try {
      await markOrderAsPaid(orderId);
      await fetchOrder();
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert(`Error marking as paid: ${error.response?.data?.message || error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <PendingIcon className="w-5 h-5" />;
      case 'Shipped': return <ShippedIcon className="w-5 h-5" />;
      case 'Delivered': return <DeliveredIcon className="w-5 h-5" />;
      case 'Cancelled': return <CancelledIcon className="w-5 h-5" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <LoadingIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-8 rounded-3xl shadow-soft bg-white/70 backdrop-blur-sm">
          <EmptyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Order Not Found</h1>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <AdminSidebar />
      
      <main className="flex-1 px-2 sm:px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/orders')}
                className="neumorphic-button-small w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 flex items-center justify-center mr-4 hover:shadow-soft transition-all duration-300"
              >
                <BackIcon className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-4xl font-bold mb-2 text-gray-800 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Order Details
                </h1>
                <p className="text-gray-600 text-lg">
                  Order ID: <span className="font-mono text-gray-800">{order._id}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowStatusModal(true)}
                disabled={updating}
                className="neumorphic-button px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:shadow-soft-lg transition-all duration-300 disabled:opacity-50 flex items-center"
              >
                <UpdateIcon className="w-5 h-5 mr-2" />
                Update Status
              </button>
              {order.paymentStatus !== 'Paid' && (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={updating}
                  className="neumorphic-button px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-soft-lg transition-all duration-300 disabled:opacity-50 flex items-center"
                >
                  <MoneyIcon className="w-5 h-5 mr-2" />
                  Mark as Paid
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status */}
              <div className="neumorphic-card p-6 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/20">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full mr-3"></span>
                  Order Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">Order Status</label>
                    <span className={classNames('px-4 py-3 rounded-2xl text-sm font-medium border flex items-center', getStatusColor(order.status))}>
                      {getStatusIcon(order.status)}
                      <span className="ml-2">{order.status}</span>
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">Payment Status</label>
                    <span className={classNames('px-4 py-3 rounded-2xl text-sm font-medium border flex items-center', 
                      order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200')}>
                      {order.paymentStatus === 'Paid' && <PaidIcon className="w-5 h-5 mr-2" />}
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">Order Date</label>
                    <p className="text-gray-800 font-medium">{formatDate(order.placedAt || order.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">Payment Method</label>
                    <p className="text-gray-800 font-medium">{order.paymentMethod || 'Cash on Delivery'}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="neumorphic-card p-6 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/20">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full mr-3"></span>
                  Order Items
                </h2>
                <div className="space-y-4">
                  {order.items?.map((item, index) => {
                    const productName = item.product?.name || item.name || 'Product';
                    const productImage = item.product?.images?.[0] || item.image || '/placeholder.png';
                    return (
                      <div key={index} className="flex items-center p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/20">
                        {productImage && (
                          <img
                            src={productImage}
                            alt={productName}
                            className="w-16 h-16 object-cover rounded-xl mr-4 shadow-soft"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{productName}</h3>
                          <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                          <p className="text-sm text-gray-600">Price: ₹{item.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">₹{item.price * item.qty}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="neumorphic-card p-6 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/20">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full mr-3"></span>
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">Customer Name</label>
                    <p className="text-gray-800 font-medium">{order.shipping?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">Phone Number</label>
                    <p className="text-gray-800 font-medium">{order.shipping?.phone || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2 text-gray-600">Shipping Address</label>
                    <p className="text-gray-800 font-medium">{order.shipping?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="neumorphic-card p-6 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/20">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full mr-3"></span>
                  Order Summary
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">₹0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold">₹0</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-bold text-green-600">
                    <span>Total</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="neumorphic-card p-6 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/20">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="w-full neumorphic-button-small px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:shadow-soft transition-all duration-300 flex items-center justify-center"
                  >
                    <UpdateIcon className="w-4 h-4 mr-2" />
                    Update Status
                  </button>
                  {order.paymentStatus !== 'Paid' && (
                    <button
                      onClick={handleMarkAsPaid}
                      className="w-full neumorphic-button-small px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:shadow-soft transition-all duration-300 flex items-center justify-center"
                    >
                      <MoneyIcon className="w-4 h-4 mr-2" />
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="neumorphic-card p-8 rounded-3xl bg-white/90 backdrop-blur-sm border border-white/20 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Update Order Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="neumorphic-button-small w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center hover:shadow-soft transition-all duration-300"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="">Select Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || updating}
                  className="flex-1 neumorphic-button px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-soft-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {updating ? (
                    <>
                      <LoadingIcon className="w-5 h-5 mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <UpdateIcon className="w-5 h-5 mr-2" />
                      Update Status
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  disabled={updating}
                  className="flex-1 neumorphic-button px-6 py-3 rounded-2xl bg-gray-500 text-white font-semibold hover:shadow-soft-lg transition-all duration-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .neumorphic-card {
          box-shadow: 
            20px 20px 60px rgba(0, 0, 0, 0.05),
            -20px -20px 60px rgba(255, 255, 255, 0.8);
        }
        .neumorphic-button {
          box-shadow: 
            8px 8px 16px rgba(0, 0, 0, 0.2),
            -8px -8px 16px rgba(255, 255, 255, 0.1);
        }
        .neumorphic-button-small {
          box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.2),
            -4px -4px 8px rgba(255, 255, 255, 0.1);
        }
        .neumorphic-input {
          box-shadow: 
            inset 4px 4px 8px rgba(0, 0, 0, 0.05),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
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
      `}</style>
    </div>
  );
};

export default AdminOrderDetail; 