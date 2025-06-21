import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin based on stored data
    const storedUser = localStorage.getItem("user");
    const storedAdmin = localStorage.getItem("admin");
    
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      setIsAdmin(true);
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAdmin(false);
    }
  }, []);

  const login = (userData, jwt) => {
    setUser(userData);
    setAdmin(null);
    setToken(jwt);
    setIsAdmin(false);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.removeItem("admin");
  };

  const adminLogin = (adminData, jwt) => {
    setAdmin(adminData);
    setUser(null);
    setToken(jwt);
    setIsAdmin(true);
    localStorage.setItem("token", jwt);
    localStorage.setItem("admin", JSON.stringify(adminData));
    localStorage.removeItem("user");
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    setToken("");
    setIsAdmin(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
  };

  const getCurrentUser = () => isAdmin ? admin : user;

  return { 
    user, 
    admin, 
    token, 
    isAdmin, 
    login, 
    adminLogin, 
    logout, 
    getCurrentUser 
  };
}
