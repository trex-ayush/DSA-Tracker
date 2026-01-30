import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));

      // Skip validation if done recently (within 5 mins)
      const lastValidation = localStorage.getItem('last_auth_validation');
      if (lastValidation && Date.now() - parseInt(lastValidation) < 5 * 60 * 1000) {
        setLoading(false);
        return;
      }

      // Verify token is still valid
      authAPI.getMe()
        .then((response) => {
          setUser(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
          localStorage.setItem('last_auth_validation', Date.now().toString());
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, ...userData } = response.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password });
    const { token, ...userData } = response.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
