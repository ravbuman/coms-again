import React from "react";
import { Link } from "react-router-dom";

const Header = () => (
  <header className="w-full bg-white dark:bg-gray-950 shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-50">
    <Link to="/" className="text-2xl font-bold text-primary">Coms-Again</Link>
    <nav className="flex gap-6 items-center">
      <Link to="/products" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">Products</Link>
      <Link to="/cart" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">Cart</Link>
      <Link to="/wishlist" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">Wishlist</Link>
      <Link to="/orders" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">Orders</Link>
      <Link to="/profile" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">Profile</Link>
      <Link to="/admin" className="text-gray-700 dark:text-gray-200 hover:text-primary transition">Admin</Link>
    </nav>
  </header>
);

export default Header;
