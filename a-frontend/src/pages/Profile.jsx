import React, { useState } from 'react';
import { useThemeContext } from '../theme/ThemeProvider';
import { classNames } from '../utils/classNames';

const COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#f59e42', // orange
  '#e11d48', // rose
  '#a21caf', // purple
  '#facc15', // yellow
];

const Profile = () => {
  const { primary, setPrimary, mode, setMode } = useThemeContext();
  const [selectedColor, setSelectedColor] = useState(primary);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setPrimary(color);
  };

  const handleModeChange = (e) => {
    setMode(e.target.value);
  };

  // Placeholder user data
  const user = { name: 'Jane Doe', email: 'jane@example.com' };

  return (
    <div className={classNames('min-h-screen py-8 px-4', mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}> 
      <div className="max-w-xl mx-auto">
        <h1 className={classNames('text-3xl font-bold mb-6', `text-[${primary}]`)}>Profile</h1>
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-8">
          <div className="mb-4">
            <div className="font-semibold text-lg">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-2">Theme Mode</label>
            <select value={mode} onChange={handleModeChange} className="px-3 py-2 border rounded">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2">Primary Color</label>
            <div className="flex gap-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={classNames(
                    'w-8 h-8 rounded-full border-2',
                    selectedColor === color ? 'border-black dark:border-white scale-110' : 'border-gray-300',
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Add more profile details, order history, etc. here */}
      </div>
    </div>
  );
};

export default Profile;
