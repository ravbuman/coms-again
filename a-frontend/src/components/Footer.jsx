import React from "react";

const Footer = () => (
  <footer className="w-full bg-white dark:bg-gray-950 py-6 px-6 flex flex-col items-center border-t border-gray-200 dark:border-gray-800 mt-12">
    <span className="text-gray-500 dark:text-gray-400 text-sm">&copy; {new Date().getFullYear()} Coms-Again. All rights reserved.</span>
    <span className="text-xs text-gray-400 mt-2">Modern E-Commerce UI &bull; Powered by React & Tailwind CSS</span>
  </footer>
);

export default Footer;
