import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useOutletContext, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
// ActiveTimerProvider removed (Bridge Pattern)
import { UIProvider, useUI } from './context/UIContext';
import { cn } from './utils/cn';
import { LayoutProvider } from './context/LayoutContext';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { CategoryProvider, useCategoryContext } from './context/CategoryContext';
import { PlaylistProvider } from './context/PlaylistContext';
import { SoundProvider } from './context/SoundContext';
// FocusSessionProvider removed - useFocusSession now uses SessionContext directly
import { SessionProvider } from './context/SessionContext';
import Dashboard, { DashboardContextType } from './components/Dashboard';
import { lazyWithRetry } from './utils/lazyWithRetry';

const TaskListView = lazyWithRetry(() => import('./features/tasks/TaskListView'));
// Lazy load heavy views
const AnalyticsView = lazyWithRetry(() => import('./features/analytics/AnalyticsView'));
const ProfileView = lazyWithRetry(() => import('./features/auth/ProfileView'));
const PlaylistManager = lazyWithRetry(() => import('./features/playlists/PlaylistManager'));
const FocusView = lazyWithRetry(() => import('./features/focus/FocusView'));
import { ThemeProvider } from './context/ThemeContext';

import { useTranslation } from 'react-i18next';

// ...
const Loading = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-64 w-full" aria-label={t('common.loading')}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );
};

import { useGlobalTimer } from './hooks/useGlobalTimer';

// Wrappers to consume context from Dashboard Outlet
const TaskListWrapper = () => {
  const {
    tasks, addTask, toggleComplete
  } = useTaskContext();
  const { categories } = useCategoryContext();
  // DECOUPLED: Dashboard now uses Global Timer (Simple Priority)
  const { startTimer, stopTimer, isRunning } = useGlobalTimer();

  const {
    filter, scrollContainer,
    getProjectNote, saveProjectNote,
    onEdit,
    onDeleteTask
  } = useOutletContext<DashboardContextType>();

  const handleToggleTimer = (id: string) => {
    if (isRunning(id)) {
      stopTimer(id);
    } else {
      startTimer(id, 'dashboard');
    }
  };

  return (
    <TaskListView
      tasks={tasks} categories={categories} filter={filter}
      onAdd={addTask} onToggleComplete={toggleComplete}
      onEdit={onEdit}
      onToggleTimer={handleToggleTimer} onDelete={onDeleteTask}
      scrollContainer={scrollContainer}
      getProjectNote={getProjectNote}
      saveProjectNote={saveProjectNote}
    />
  );
};

const AnalyticsWrapper = () => {
  const { tasks } = useTaskContext();
  const { categories } = useCategoryContext();
  return <AnalyticsView tasks={tasks} categories={categories} />;
};

const ProfileWrapper = () => {
  const { user, setUser, updateAvatar, logout, deleteProfile } = useOutletContext<DashboardContextType>();
  if (!user) return <Loading />;

  return <ProfileView
    user={user}
    setUser={setUser}
    updateAvatar={updateAvatar}
    logout={logout}
    deleteProfile={() => deleteProfile(user.id)}
  />;
};

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginView from './features/auth/LoginView';
import { StorageProvider } from './context/StorageContext';

// ... other imports

const PageTransitionWrapper = ({ children, noPadding = false }: { children: React.ReactNode, noPadding?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className={cn(
      "w-full min-h-full",
      noPadding ? "p-0" : "p-4 md:p-8 lg:p-12"
      // Bottom padding is now handled internally by pages via <NavSpacer />
    )}
  >
    {children}
  </motion.div>
);

import { useCloudSync } from './hooks/useCloudSync';
import { useThemeColor } from './hooks/useThemeColor';
import { TaskOrchestrator } from './components/TaskOrchestrator';
import { ReloadPrompt } from './components/ReloadPrompt';

const AppContent = () => {
  // Features Cloud Sync (TimeLedger)
  useCloudSync();

  const { isMobileMenuOpen, setMobileMenuOpen } = useUI();
  useThemeColor();

  const { user, isLoading } = useAuth();
  const { i18n } = useTranslation();



  if (isLoading) {
    return <Loading />;
  }

  // Unauthenticated Routes
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="*" element={<LoginView />} />
      </Routes>
    );
  }

  // Authenticated Routes
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={
          <Suspense fallback={<Loading />}>
            <PageTransitionWrapper noPadding>
              <TaskListWrapper />
            </PageTransitionWrapper>
          </Suspense>
        } />
        <Route path="analytics" element={
          <Suspense fallback={<Loading />}>
            <PageTransitionWrapper noPadding>
              <AnalyticsWrapper />
            </PageTransitionWrapper>
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<Loading />}>
            <PageTransitionWrapper noPadding>
              <ProfileWrapper />
            </PageTransitionWrapper>
          </Suspense>
        } />
        <Route path="playlists" element={
          <Suspense fallback={<Loading />}>
            <PageTransitionWrapper noPadding>
              <PlaylistManager />
            </PageTransitionWrapper>
          </Suspense>
        } />
        <Route path="focus" element={
          <Suspense fallback={<Loading />}>
            <FocusView />
          </Suspense>
        } />
        <Route path="focus/:id" element={
          <Suspense fallback={<Loading />}>
            <FocusView />
          </Suspense>
        } />
      </Route>
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
};


// ...

import { ActiveTimerProvider } from './context/ActiveTimerContext';
import { ToastProvider } from './components/ui/ToastContext';
// ... (imports)

// ...

export default function App() {
  const { i18n } = useTranslation();

  // Sync html lang attribute
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ToastProvider>
      <AuthProvider>
        <StorageProvider>
          <SessionProvider>
            <ActiveTimerProvider>
              <TaskProvider>
                <CategoryProvider>
                  <PlaylistProvider>
                    <TaskOrchestrator />
                    <ReloadPrompt />
                    <SoundProvider>
                      <UIProvider>
                        <LayoutProvider>
                          <ThemeProvider>
                            <AppContent />
                          </ThemeProvider>
                        </LayoutProvider>
                      </UIProvider>
                    </SoundProvider>
                  </PlaylistProvider>
                </CategoryProvider>
              </TaskProvider>
            </ActiveTimerProvider>
          </SessionProvider>
        </StorageProvider>
      </AuthProvider>
    </ToastProvider >
  );
}