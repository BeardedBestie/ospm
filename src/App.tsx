import React, { useEffect, useState } from 'react';
import { Sun, Moon, Layout, User, LogOut, Settings } from 'lucide-react';
import { useStore } from './lib/store';
import { supabase } from './lib/supabase';
import AuthModal from './components/auth/AuthModal';
import ProfileModal from './components/profile/ProfileModal';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/admin/AdminPanel';

function App() {
  const { theme, setTheme, user, setUser, userProfile, setUserProfile } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }}) => {
      if (session?.user) {
        setUser(session.user);
        // Get user profile
        supabase
          .from('user_profiles')
          .select('role, status')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUserProfile(profile);
            }
            setLoading(false);
          });
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Get user profile
        supabase
          .from('user_profiles')
          .select('role, status')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUserProfile(profile);
            }
          });
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (userProfile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account is pending administrator approval.
            <br />
            Please check back later.
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (userProfile?.status === 'disabled') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Account Disabled</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account has been disabled.
            <br />
            Please contact an administrator for assistance.
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="fixed top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setShowAdminPanel(false)}
                className="flex items-center hover:text-primary-600 transition-colors"
              >
                <Layout className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-semibold">ProjectHub</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              {user ? (
                <>
                  {userProfile?.role === 'admin' && (
                    <button
                      onClick={() => setShowAdminPanel(!showAdminPanel)}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        showAdminPanel ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                      title="Admin Panel"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <User className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {user ? (
          showAdminPanel ? <AdminPanel /> : <Dashboard />
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Welcome to ProjectHub</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Sign in to start managing your projects and tasks
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </div>
  );
}

export default App;