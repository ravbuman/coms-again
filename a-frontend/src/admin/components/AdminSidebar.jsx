import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { 
  DashboardIcon, 
  ProductsIcon, 
  OrdersIcon, 
  UsersIcon, 
  CouponsIcon 
} from './AdminIcons';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const menuItems = [
    {
      path: '/admin',
      name: 'Dashboard',
      icon: DashboardIcon
    },
    {
      path: '/admin/products',
      name: 'Products',
      icon: ProductsIcon
    },
    {
      path: '/admin/orders',
      name: 'Orders',
      icon: OrdersIcon
    },
    {
      path: '/admin/users',
      name: 'Users',
      icon: UsersIcon
    },
    {
      path: '/admin/coupons',
      name: 'Coupons',
      icon: CouponsIcon
    }
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  // Prevent body scroll when sidebar is open on mobile
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger menu icon: only on mobile, always fixed top-right */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 right-4 z-50 bg-white/80 rounded-full shadow-soft p-2 focus:outline-none border border-white/30"
        aria-label="Open admin menu"
        style={{ display: open ? 'none' : 'block' }}
      >
        <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Sidebar for desktop, drawer for mobile */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full md:h-auto w-64 bg-white/80 backdrop-blur-sm border-r border-white/20 shadow-soft transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block`}
        aria-label="Admin sidebar"
        tabIndex={open ? 0 : -1}
      >
        <div className="p-6">
          <div className="flex items-center mb-8 hidden md:flex">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-soft flex items-center justify-center mr-3">
              <DashboardIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-sm text-gray-600">Management Console</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-soft-lg'
                      : 'text-gray-700 hover:bg-white/60 hover:shadow-soft'
                  }`}
                  onClick={() => setOpen(false)}
                  tabIndex={open || window.innerWidth >= 768 ? 0 : -1}
                >
                  <IconComponent
                    className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                      isActive(item.path)
                        ? 'text-white'
                        : 'text-gray-500 group-hover:text-green-600'
                    }`}
                  />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 rounded-2xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
              tabIndex={open || window.innerWidth >= 768 ? 0 : -1}
            >
              <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
      {/* Overlay for mobile drawer */}
      {open && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setOpen(false)} aria-label="Close admin menu" tabIndex={0}></div>}
      <style jsx>{`
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
    </>
  );
};

export default AdminSidebar; 