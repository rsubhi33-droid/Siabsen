import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('siabsen_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await getMe();
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('siabsen_token');
      localStorage.removeItem('siabsen_user');
    } finally {
      setLoading(false);
    }
  };

  const loginUser = (userData, token) => {
    localStorage.setItem('siabsen_token', token);
    localStorage.setItem('siabsen_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('siabsen_token');
    localStorage.removeItem('siabsen_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
