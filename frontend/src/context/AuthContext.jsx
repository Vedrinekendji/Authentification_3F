import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    email: '',
    sessionToken: '',
    authToken: '',
    step: 1,
    verifiedSteps: [],
  });

  const updateAuth = (data) => {
    setAuthState(prev => ({ ...prev, ...data }));
  };

  const resetAuth = () => {
    setAuthState({ email: '', sessionToken: '', step: 1, verifiedSteps: [] });
  };

  return (
    <AuthContext.Provider value={{ authState, updateAuth, resetAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
