import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useUIStore, useAuthStore, usePresenceStore } from '@/store';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNotificationStore } from '@/store';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import PageView from '@/pages/PageView';
import TasksPage from '@/pages/TasksPage';
import InboxPage from '@/pages/InboxPage';
import SettingsPage from '@/pages/SettingsPage';
import TrashPage from '@/pages/TrashPage';
import TodayPage from '@/pages/TodayPage';
import DatabasePage from '@/pages/DatabasePage';
import TemplatesPage from '@/pages/TemplatesPage';
import { CommandMenu } from '@/components/layout/CommandMenu';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { theme } = useUIStore();

  const connect = usePresenceStore((s) => s.connect);
  const disconnect = usePresenceStore((s) => s.disconnect);
  const user = useAuthStore((s) => s.user);
  const { setAuth, clearAuth, setLoading, loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        // Here we ideally sync with our backend user table
        // For now, we'll set the token and a minimal user object
        setAuth({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          avatar: firebaseUser.photoURL || null,
        }, token, '');
      } else {
        clearAuth();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setAuth, clearAuth, setLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  // Handle socket connection and listeners
  useEffect(() => {
    if (user) {
      connect({ userId: user.id, name: user.name ?? 'User', avatarUrl: user.avatar ?? undefined });
      useNotificationStore.getState().initSocketListeners();
    } else {
      useNotificationStore.getState().cleanupSocketListeners();
      disconnect();
    }

    return () => {
      useNotificationStore.getState().cleanupSocketListeners();
    };
  }, [user, connect, disconnect]);

  return (
    <>
      <CommandMenu />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/today" element={<TodayPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/pages/:pageId" element={<PageView />} />
                  <Route path="/databases/:databaseId" element={<DatabasePage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/trash" element={<TrashPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster richColors position="bottom-right" />
    </>
  );
}
