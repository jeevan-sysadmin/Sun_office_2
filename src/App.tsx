// C:\Users\JEEVANLAROSH\Downloads\Sun computers\sun office\src\App.tsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import type { User as DashboardUser } from "./components/types";
const Login = lazy(() => import("./components/Login"));
const Dashboard = lazy(() => import("./components/Dashboard"));

const routerBaseName = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "") || "/";

const buildAppPath = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return routerBaseName === "/" ? normalizedPath : `${routerBaseName}${normalizedPath}`;
};


// Type for user data from database (matches Login component's User type)
interface LoginUser {
  id: number;
  name: string;
  full_name?: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  position?: string;
  phone?: string;
  address?: string;
  join_date?: string;
  salary?: number | string;
  is_active: boolean | number | string;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Type for authentication state
interface AuthState {
  isLoggedIn: boolean;
  role: string;
  userData: DashboardUser | null;
  isLoading: boolean;
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Listen for storage changes (for logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue) {
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            height: '48px',
            width: '48px',
            borderBottom: '2px solid #3b82f6',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#4b5563' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

// Public Route Component (redirect if logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          setIsAuthenticated(true);
          navigate('/dashboard', { replace: true });
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            height: '48px',
            width: '48px',
            borderBottom: '2px solid #3b82f6',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#4b5563' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : null;
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '16px'
            }}>
              Something went wrong
            </h1>
            <p style={{ color: '#4b5563', marginBottom: '16px' }}>
              Please try refreshing the page. If the problem persists, contact support.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                textAlign: 'left',
                backgroundColor: '#fee2e2',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ 
                  fontSize: '12px',
                  color: '#991b1b',
                  marginTop: '8px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onClick={() => window.location.reload()}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Check initial auth state from localStorage
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      const parsedUserData = userData ? JSON.parse(userData) : null;
      
      return {
        isLoggedIn: !!(token && userData),
        role: parsedUserData?.role || 'user',
        userData: parsedUserData,
        isLoading: false
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Clear invalid data
      localStorage.removeItem('userData');
      localStorage.removeItem('authToken');
      return {
        isLoggedIn: false,
        role: 'user',
        userData: null,
        isLoading: false
      };
    }
  });

  // Handle login success - receives data from database
  const handleLoginSuccess = (role: string, userData: LoginUser) => {
    try {
      console.log('Login success handler called with database user:', userData);
      
      // Handle is_active conversion safely
      let isActive = false;
      if (typeof userData.is_active === 'boolean') {
        isActive = userData.is_active;
      } else if (typeof userData.is_active === 'number') {
        isActive = userData.is_active === 1;
      } else if (typeof userData.is_active === 'string') {
        isActive = userData.is_active === '1' || userData.is_active === 'true';
      }
      
      // Map database fields to our Dashboard User interface
      const mappedUserData: DashboardUser = {
        id: userData.id || 0,
        name: userData.name || userData.full_name || 'User',
        email: userData.email || '',
        role: userData.role || role || 'staff',
        avatar: userData.avatar || '',
        department: userData.department || '',
        position: userData.position || '',
        phone: userData.phone || '',
        address: userData.address || '',
        join_date: userData.join_date || userData.created_at || '',
        salary: userData.salary ? (typeof userData.salary === 'string' ? parseFloat(userData.salary) : userData.salary) : 0,
        is_active: isActive,
        last_login: userData.last_login || new Date().toISOString(),
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString()
      };
      
      // Store in localStorage
      localStorage.setItem('userData', JSON.stringify(mappedUserData));
      
      // Update state
      setAuthState({
        isLoggedIn: true,
        role: mappedUserData.role,
        userData: mappedUserData,
        isLoading: false
      });
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isLoggedIn: true, userData: mappedUserData }
      }));
      
      console.log('Login successful, user data from database stored:', mappedUserData);
      
    } catch (error) {
      console.error('Login success handling failed:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    try {
      // Store the current URL for potential redirect after login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Clear session storage
      sessionStorage.removeItem('redirectAfterLogin');
      
      setAuthState({
        isLoggedIn: false,
        role: 'user',
        userData: null,
        isLoading: false
      });
      
      // Dispatch storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'authToken',
        oldValue: 'exists',
        newValue: null,
        url: window.location.href,
        storageArea: localStorage
      }));
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isLoggedIn: false, userData: null }
      }));
      
      console.log('Logout successful');
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Force clear localStorage as fallback
      localStorage.clear();
      window.location.href = buildAppPath('/login');
    }
  };

  // Handle global errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Optional: Show dev tools only in development
  const [showDevTools, setShowDevTools] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'd') {
          setShowDevTools(prev => !prev);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router basename={routerBaseName}>
        <Suspense
          fallback={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  animation: 'spin 1s linear infinite',
                  borderRadius: '50%',
                  height: '48px',
                  width: '48px',
                  borderBottom: '2px solid #3b82f6',
                  margin: '0 auto'
                }}></div>
                <p style={{ marginTop: '16px', color: '#4b5563' }}>Loading page...</p>
              </div>
            </div>
          }
        >
        <div className="App">
          {/* Development tools - only shown in development mode */}
          {import.meta.env.DEV && showDevTools && (
            <div style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              zIndex: 9999,
              fontSize: '12px',
              maxWidth: '300px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>Dev Tools</h4>
              <div style={{ marginBottom: '10px' }}>
                <div><strong>Auth State:</strong> {authState.isLoggedIn ? '✅ Logged In' : '❌ Logged Out'}</div>
                <div><strong>Role:</strong> {authState.role}</div>
                {authState.userData && (
                  <>
                    <div><strong>Name:</strong> {authState.userData.name}</div>
                    <div><strong>Email:</strong> {authState.userData.email}</div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = buildAppPath('/login');
                }}
                style={{
                  padding: '5px 10px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '3px',
                  color: 'white',
                  cursor: 'pointer',
                  marginRight: '5px'
                }}
              >
                Clear Storage
              </button>
              <button
                onClick={() => setShowDevTools(false)}
                style={{
                  padding: '5px 10px',
                  background: '#6b7280',
                  border: 'none',
                  borderRadius: '3px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Hide
              </button>
            </div>
          )}

          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login 
                    onLoginSuccess={(role, userData) => {
                      // This receives the actual database user data from Login component
                      console.log('Login successful - received from database:', { role, userData });
                      handleLoginSuccess(role, userData);
                    }}
                  />
                </PublicRoute>
              } 
            />
            
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute>
                  <Dashboard 
                    onLogout={handleLogout}
                    user={authState.userData || null}
                  />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/" 
              element={
                <Navigate to="/dashboard" replace />
              } 
            />
            
            {/* 404 Page */}
            <Route 
              path="*" 
              element={
                <div style={{
                  minHeight: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      marginBottom: '16px'
                    }}>
                      404
                    </h1>
                    <p style={{ 
                      color: '#4b5563', 
                      marginBottom: '24px',
                      fontSize: '18px'
                    }}>
                      Page not found
                    </p>
                    <a 
                      href={buildAppPath('/dashboard')} 
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: '500',
                        display: 'inline-block',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      Go to Dashboard
                    </a>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
