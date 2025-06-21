import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useThemeContext } from "../theme/ThemeProvider";
import { classNames } from "../utils/classNames";

const Navbar = () => {
  const { user, admin, isAdmin, logout } = useAuth();
  const { primary } = useThemeContext();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="w-full bg-white dark:bg-gray-950 shadow-sm py-4 px-6 flex items-center justify-between">
      <Link to="/" className={classNames('text-2xl font-bold', `text-[${primary}]`)}>
        Coms-Again
      </Link>
      
      <div className="flex gap-6 items-center">
        {!isAdmin ? (
          // User Navigation
          <>
            <Link to="/products" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Products
            </Link>
            <Link to="/cart" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Cart
            </Link>
            <Link to="/wishlist" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Wishlist
            </Link>
            <Link to="/orders" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Orders
            </Link>
            <Link to="/profile" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Profile
            </Link>
          </>
        ) : (
          // Admin Navigation
          <>
            <Link to="/admin" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Dashboard
            </Link>
            <Link to="/admin/products" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Products
            </Link>
            <Link to="/admin/orders" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Orders
            </Link>
            <Link to="/admin/users" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Users
            </Link>
            <Link to="/admin/coupons" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">
              Coupons
            </Link>
          </>
        )}

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {user || admin ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.name || admin?.name}
              </span>
              <button
                onClick={handleLogout}
                className={classNames('px-4 py-2 rounded text-sm font-medium', 
                  `bg-[${primary}] text-white hover:opacity-90`)}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className={classNames('px-4 py-2 rounded text-sm font-medium', 
                `bg-[${primary}] text-white hover:opacity-90`)}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
