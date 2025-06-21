import React from 'react';
import { useThemeContext } from '../theme/ThemeProvider';
import { classNames } from '../utils/classNames';

const NotFound = () => {
  const { primary, mode } = useThemeContext();

  return (
    <div className={classNames('min-h-screen flex flex-col items-center justify-center', mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}> 
      <h1 className={classNames('text-7xl font-bold mb-4', `text-[${primary}]`)}>404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="mb-6">Sorry, the page you are looking for does not exist.</p>
      <a href="/" className={classNames('px-6 py-2 rounded text-white font-semibold', `bg-[${primary}] hover:opacity-90`)}>Go Home</a>
    </div>
  );
};

export default NotFound;
