
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { User as UserType, CompanyRole } from './types';
import { mockLogin } from './services/store';
import { Users, Calendar, UserCheck, LogOut, LayoutDashboard, Menu, X, Tag, Clock, Briefcase, PieChart } from 'lucide-react';

// --- Auth Context ---
interface AuthContextType {
  user: UserType | null;
  login: (role: CompanyRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('shiftsync_user');
    if (saved) setUser(JSON.parse(saved));
    setIsLoading(false);
  }, []);

  const login = async (role: CompanyRole) => {
    setIsLoading(true);
    try {
      const u = await mockLogin('demo@example.com', role);
      setUser(u);
      localStorage.setItem('shiftsync_user', JSON.stringify(u));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shiftsync_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// --- Layout Components ---

// Reusable Nav Links for both Mobile and Desktop
const NavLinks = ({ user, onItemClick }: { user: UserType | null, onItemClick?: () => void }) => {
  const location = useLocation();
  const isManager = user?.role === CompanyRole.MANAGER || user?.role === CompanyRole.OWNER;

  const LinkItem = ({ icon: Icon, label, to }: { icon: any, label: string, to: string }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        onClick={onItemClick}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 transition-colors ${
          isActive 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex-1 px-4 py-6 space-y-1">
      {/* Shared Views */}
      <LinkItem icon={LayoutDashboard} label="Roster View" to="/roster" />

      {/* Manager Only Views */}
      {isManager && (
        <>
          <LinkItem icon={Users} label="Employees" to="/employees" />
          <LinkItem icon={Tag} label="Positions" to="/positions" />
          <LinkItem icon={Clock} label="Time Tracking" to="/tracking" />
          <LinkItem icon={PieChart} label="Reports" to="/reports" />
        </>
      )}

      {/* Staff Views */}
      <LinkItem icon={UserCheck} label="My Shifts" to="/myshifts" />
      <LinkItem icon={Briefcase} label="My Work" to="/my-work" />
    </nav>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      
      {/* --- Mobile Header (Visible < md) --- */}
      <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-bold text-xl text-slate-800">ShiftSync</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* --- Mobile Sidebar Drawer (Overlay) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl flex flex-col transition-transform animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="font-bold text-lg text-slate-800">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <NavLinks user={user} onItemClick={() => setIsMobileMenuOpen(false)} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center mb-4 px-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                  {user?.name.charAt(0)}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-slate-700 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Desktop Sidebar (Fixed, Visible >= md) --- */}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 fixed h-full flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="font-bold text-xl text-slate-800">ShiftSync</span>
          </div>
        </div>
        
        <NavLinks user={user} />

        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 md:ml-64 min-w-0">
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// --- Pages imports ---
import LoginPage from './pages/Login';
import EmployeesPage from './pages/Employees';
import RosterPage from './pages/Roster';
import MyShiftsPage from './pages/MyShifts';
import AvailabilityPage from './pages/Availability';
import PositionsPage from './pages/Positions';
import TimeTrackingPage from './pages/TimeTracking';
import MyWorkPage from './pages/MyWork';
import ReportsPage from './pages/Reports';

// --- Main App Component ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/employees" element={
            <ProtectedRoute><EmployeesPage /></ProtectedRoute>
          } />
          
          <Route path="/positions" element={
            <ProtectedRoute><PositionsPage /></ProtectedRoute>
          } />

          <Route path="/availability/:employeeId" element={
            <ProtectedRoute><AvailabilityPage /></ProtectedRoute>
          } />
          
          <Route path="/roster" element={
            <ProtectedRoute><RosterPage /></ProtectedRoute>
          } />

          <Route path="/tracking" element={
            <ProtectedRoute><TimeTrackingPage /></ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute><ReportsPage /></ProtectedRoute>
          } />
          
          <Route path="/myshifts" element={
            <ProtectedRoute><MyShiftsPage /></ProtectedRoute>
          } />
          
          <Route path="/my-work" element={
            <ProtectedRoute><MyWorkPage /></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/roster" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
