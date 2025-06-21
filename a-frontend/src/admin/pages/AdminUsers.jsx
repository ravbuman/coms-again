import React, { useState, useEffect } from 'react';
import { useThemeContext } from '../../theme/ThemeProvider';
import { classNames } from '../utils/classNames';
import { useAuth } from '../utils/useAuth';
import { getAllUsers, getUserOrders, deleteUser } from '../services/adminService';
import AdminSidebar from '../components/AdminSidebar';
import { 
  LoadingIcon, 
  EmptyIcon, 
  DeleteIcon,
  PeopleIcon,
  EmailIcon,
  PhoneIcon,
  CalendarIcon
} from '../components/AdminIcons';

const AdminUsers = () => {
  const { primary, mode } = useThemeContext();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [showUserOrders, setShowUserOrders] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = async (userId) => {
    setSelectedUser(users.find(user => user._id === userId));
    setLoadingOrders(true);
    try {
      const response = await getUserOrders(userId);
      setUserOrders(response.data.orders || []);
      setShowUserOrders(true);
    } catch (error) {
      console.error('Error fetching user orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Error deleting user: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-gray-800 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and monitor all registered users
            </p>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="text-center py-12">
              <LoadingIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading users...</p>
            </div>
          ) : (
            <div className="neumorphic-card rounded-3xl bg-white/60 backdrop-blur-sm border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <tr>
                      <th className="text-left p-6 font-semibold text-gray-700">User</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Email</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Phone</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Role</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Joined</th>
                      <th className="text-left p-6 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-100/50 hover:bg-white/30 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-soft flex items-center justify-center mr-4">
                              <PeopleIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{user.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">ID: {user._id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center">
                            <EmailIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center">
                            <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-700">{user.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={classNames(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          )}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-700">{formatDate(user.createdAt)}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <button
                            onClick={() => handleDeleteUser(user._id)}
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
              {users.length === 0 && (
                <div className="text-center py-16">
                  <EmptyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl mb-4">No users found</p>
                  <p className="text-gray-400">Users will appear here once they register!</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20">
              <div className="flex items-center">
                <div className="neumorphic-icon p-4 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-soft">
                  <PeopleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-gray-800">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20">
              <div className="flex items-center">
                <div className="neumorphic-icon p-4 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 shadow-soft">
                  <PeopleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Admins</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {users.filter(user => user.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20">
              <div className="flex items-center">
                <div className="neumorphic-icon p-4 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-soft">
                  <PeopleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Regular Users</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {users.filter(user => user.role !== 'admin').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Orders Modal */}
          {showUserOrders && selectedUser && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="neumorphic-card max-w-5xl w-full mx-4 p-8 rounded-3xl max-h-[90vh] overflow-y-auto bg-white/80 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="w-2 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full mr-3"></span>
                    Orders for {selectedUser.name}
                  </h2>
                  <button
                    onClick={() => setShowUserOrders(false)}
                    className="neumorphic-button-small w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center hover:shadow-soft transition-all duration-300"
                  >
                    ✕
                  </button>
                </div>
                
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading orders...</p>
                  </div>
                ) : (
                  <div>
                    {userOrders.length > 0 ? (
                      <div className="space-y-4">
                        {userOrders.map((order) => (
                          <div key={order._id} className="neumorphic-card p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="font-semibold text-gray-800 text-lg">Order #{order._id.slice(-8)}</div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(order.placedAt || order.createdAt)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-600 text-xl">₹{order.totalAmount}</div>
                                <span className={classNames('px-3 py-1 rounded-full text-xs font-medium border', getStatusColor(order.status))}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-sm space-y-2">
                              <div><span className="text-gray-500">Items:</span> <span className="text-gray-800 font-medium">{order.items?.length || 0}</span></div>
                              <div><span className="text-gray-500">Payment:</span> <span className="text-gray-800 font-medium">{order.paymentMethod}</span></div>
                              {order.shipping && (
                                <div><span className="text-gray-500">Address:</span> <span className="text-gray-800 font-medium">{order.shipping.address}</span></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-500 text-lg">No orders found for this user</p>
                        <p className="text-gray-400">This user hasn't placed any orders yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
        .neumorphic-button-small {
          box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.2),
            -4px -4px 8px rgba(255, 255, 255, 0.1);
        }
        .neumorphic-icon {
          box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.2),
            -4px -4px 8px rgba(255, 255, 255, 0.1);
        }
        .shadow-soft {
          box-shadow: 
            8px 8px 16px rgba(0, 0, 0, 0.1),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};

export default AdminUsers; 