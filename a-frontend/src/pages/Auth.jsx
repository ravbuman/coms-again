import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../theme/ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { adminLogin } from '../services/adminService';
import api from '../services/api';
import { classNames } from '../utils/classNames';

const Auth = () => {
  const { primary, mode } = useThemeContext();
  const { login, adminLogin: authAdminLogin } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    name: '', 
    phone: '',
    email: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isAdmin) {
        if (isLogin) {
          const response = await adminLogin({ 
            username: form.username, 
            password: form.password 
          });
          authAdminLogin(response.data.admin, response.data.token);
          navigate('/admin');
        } else {
          const response = await api.post('/auth/admin/register', { 
            name: form.name, 
            username: form.username, 
            password: form.password,
            email: form.email
          });
          authAdminLogin(response.data.admin, response.data.token);
          navigate('/admin');
        }
      } else {
        if (isLogin) {
          const response = await api.post('/auth/login', { 
            username: form.username, 
            password: form.password 
          });
          login(response.data.user, response.data.token);
          navigate('/');
        } else {
          const response = await api.post('/auth/register', { 
            name: form.name, 
            username: form.username, 
            password: form.password,
            phone: form.phone
          });
          login(response.data.user, response.data.token);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      username: '', 
      password: '', 
      name: '', 
      phone: '',
      email: ''
    });
    setError(null);
  };

  const handleModeChange = (newIsAdmin) => {
    setIsAdmin(newIsAdmin);
    resetForm();
  };

  const handleAuthTypeChange = (newIsLogin) => {
    setIsLogin(newIsLogin);
    resetForm();
  };

  return (
    <div className={classNames('min-h-screen flex items-center justify-center', 
      mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}> 
      <div className="w-full max-w-md p-8 rounded shadow-lg bg-white dark:bg-gray-800">
        <h1 className={classNames('text-2xl font-bold mb-6 text-center', `text-[${primary}]`)}>
          {isAdmin ? 'Admin' : 'User'} {isLogin ? 'Login' : 'Register'}
        </h1>
        
        {/* Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleModeChange(false)}
            className={classNames('flex-1 py-2 px-4 rounded text-sm font-medium transition-colors', 
              !isAdmin 
                ? `bg-[${primary}] text-white` 
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            User
          </button>
          <button
            onClick={() => handleModeChange(true)}
            className={classNames('flex-1 py-2 px-4 rounded text-sm font-medium transition-colors', 
              isAdmin 
                ? `bg-[${primary}] text-white` 
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className={classNames('w-full px-4 py-2 border rounded focus:outline-none focus:ring-2', 
                mode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300')}
              required
            />
          )}
          
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className={classNames('w-full px-4 py-2 border rounded focus:outline-none focus:ring-2', 
              mode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300')}
            required
          />
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className={classNames('w-full px-4 py-2 border rounded focus:outline-none focus:ring-2', 
              mode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300')}
            required
          />

          {!isLogin && !isAdmin && (
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className={classNames('w-full px-4 py-2 border rounded focus:outline-none focus:ring-2', 
                mode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300')}
              required
            />
          )}

          {!isLogin && isAdmin && (
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className={classNames('w-full px-4 py-2 border rounded focus:outline-none focus:ring-2', 
                mode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300')}
              required
            />
          )}

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className={classNames('w-full py-3 rounded text-white font-semibold transition-colors', 
              `bg-[${primary}] hover:opacity-90`)}
            disabled={loading}
          >
            {loading ? 'Please wait...' : `${isLogin ? 'Login' : 'Register'} as ${isAdmin ? 'Admin' : 'User'}`}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => handleAuthTypeChange(!isLogin)}
            className={classNames('text-sm underline', `text-[${primary}]`)}
          >
            {isLogin 
              ? `Don't have an account? Register as ${isAdmin ? 'Admin' : 'User'}` 
              : `Already have an account? Login as ${isAdmin ? 'Admin' : 'User'}`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
