import React, { useState, useEffect } from 'react';
import { useThemeContext } from '../../theme/ThemeProvider';
import { classNames } from '../utils/classNames';
import { useAuth } from '../utils/useAuth';
import { getAllCoupons, createCoupon, deleteCoupon } from '../services/adminService';
import AdminSidebar from '../components/AdminSidebar';
import { 
  LoadingIcon, 
  EmptyIcon, 
  AddIcon,
  DeleteIcon,
  SaveIcon,
  CloseIcon,
  TicketIcon,
  CalendarIcon,
  MoneyIcon,
  PercentIcon
} from '../components/AdminIcons';

const AdminCoupons = () => {
  const { primary, mode } = useThemeContext();
  const { isAdmin } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    amount: '',
    maxDiscount: '',
    minAmount: '',
    maxUses: '',
    validFrom: '',
    validUntil: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await getAllCoupons();
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCoupon(formData);
      setShowForm(false);
      setFormData({
        code: '',
        type: 'percent',
        amount: '',
        maxDiscount: '',
        minAmount: '',
        maxUses: '',
        validFrom: '',
        validUntil: ''
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert(`Error creating coupon: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(couponId);
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
        alert(`Error deleting coupon: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({
      code: '',
      type: 'percent',
      amount: '',
      maxDiscount: '',
      minAmount: '',
      maxUses: '',
      validFrom: '',
      validUntil: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <AdminSidebar />
      
      <main className="flex-1 px-2 sm:px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-gray-800 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Coupon Management
              </h1>
              <p className="text-gray-600 text-lg">
                Create and manage discount coupons for your customers
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="neumorphic-button px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-soft-lg transition-all duration-300 flex items-center"
            >
              <AddIcon className="w-5 h-5 mr-2" />
              Create Coupon
            </button>
          </div>

          {/* Coupon Form */}
          {showForm && (
            <div className="neumorphic-card mb-8 p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full mr-3"></span>
                  Create New Coupon
                </h2>
                <button
                  onClick={resetForm}
                  className="neumorphic-button-small w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center hover:shadow-soft transition-all duration-300"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">Coupon Code</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      required
                      placeholder="e.g., SAVE20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">Discount Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <option value="percent">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">
                      {formData.type === 'percent' ? 'Discount Percentage' : 'Discount Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      required
                      min="0"
                      max={formData.type === 'percent' ? "100" : undefined}
                      step={formData.type === 'percent' ? "1" : "0.01"}
                    />
                  </div>
                  {formData.type === 'percent' && (
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">Maximum Discount (₹)</label>
                      <input
                        type="number"
                        name="maxDiscount"
                        value={formData.maxDiscount}
                        onChange={handleInputChange}
                        className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">Minimum Order Amount (₹)</label>
                    <input
                      type="number"
                      name="minAmount"
                      value={formData.minAmount}
                      onChange={handleInputChange}
                      className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">Maximum Uses</label>
                    <input
                      type="number"
                      name="maxUses"
                      value={formData.maxUses}
                      onChange={handleInputChange}
                      className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">Valid From</label>
                    <input
                      type="datetime-local"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleInputChange}
                      className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">Valid Until</label>
                    <input
                      type="datetime-local"
                      name="validUntil"
                      value={formData.validUntil}
                      onChange={handleInputChange}
                      className="neumorphic-input w-full p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="neumorphic-button px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-soft-lg transition-all duration-300 disabled:opacity-50 flex items-center"
                  >
                    {submitting ? (
                      <>
                        <LoadingIcon className="w-5 h-5 mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="w-5 h-5 mr-2" />
                        Create Coupon
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={resetForm}
                    className="neumorphic-button px-8 py-4 rounded-2xl bg-gray-500 text-white font-semibold hover:shadow-soft-lg transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Coupons List */}
          {loading ? (
            <div className="text-center py-12">
              <LoadingIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading coupons...</p>
            </div>
          ) : (
            <div className="neumorphic-card rounded-3xl bg-white/60 backdrop-blur-sm border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <tr>
                      <th className="text-left p-6 font-semibold text-gray-700">Code</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Type</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Discount</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Usage</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Valid Period</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="border-b border-gray-100/50 hover:bg-white/30 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 shadow-soft flex items-center justify-center mr-3">
                              <TicketIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-mono font-semibold text-gray-800">{coupon.code}</div>
                              <div className="text-sm text-gray-500">Min: ₹{coupon.minAmount || 0}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center">
                            {coupon.type === 'percent' ? (
                              <PercentIcon className="w-4 h-4 text-blue-500 mr-2" />
                            ) : (
                              <MoneyIcon className="w-4 h-4 text-green-500 mr-2" />
                            )}
                            <span className="capitalize text-gray-700">{coupon.type}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="font-semibold text-green-600">
                            {coupon.type === 'percent' ? `${coupon.amount}%` : `₹${coupon.amount}`}
                          </div>
                          {coupon.maxDiscount && (
                            <div className="text-sm text-gray-500">Max: ₹{coupon.maxDiscount}</div>
                          )}
                        </td>
                        <td className="p-6">
                          <div className="text-sm text-gray-700">
                            {coupon.usedCount || 0} / {coupon.maxUses || '∞'}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-700">
                              <div>{formatDate(coupon.validFrom)}</div>
                              <div>to {formatDate(coupon.validUntil)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={classNames(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            isExpired(coupon.validUntil) ? 'bg-red-100 text-red-700' :
                            new Date(coupon.validFrom) > new Date() ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            {isExpired(coupon.validUntil) ? 'Expired' :
                             new Date(coupon.validFrom) > new Date() ? 'Upcoming' : 'Active'}
                          </span>
                        </td>
                        <td className="p-6">
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className="neumorphic-button-small px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:shadow-soft transition-all duration-300 flex items-center"
                          >
                            <DeleteIcon className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {coupons.length === 0 && (
                <div className="text-center py-16">
                  <EmptyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl mb-4">No coupons found</p>
                  <p className="text-gray-400">Create your first coupon to get started!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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

export default AdminCoupons; 