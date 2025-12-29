import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useOutletContext, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ActiveTimerProvider } from './context/ActiveTimerContext';
import { UIProvider } from './context/UIContext';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { CategoryProvider, useCategoryContext } from './context/CategoryContext';
import { PlaylistProvider } from './context/PlaylistContext';
import { SoundProvider } from './context/SoundContext';
import { FocusSessionProvider, useFocusContext } from './context/FocusSessionContext';
import Dashboard, { DashboardContextType } from './components/Dashboard';
import TaskListView from './components/views/TaskListView';

// Lazy load heavy views
const AnalyticsView = lazy(() => import('./components/analytics/AnalyticsView'));
const ProfileView = lazy(() => import('./components/views/ProfileView'));
const PlaylistManager = lazy(() => import('./components/views/PlaylistManager'));
const FocusView = lazy(() => import('./components/views/FocusView'));

import { useTranslation } from 'react-i18next';

// ...
const Loading = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-64 w-full" aria-label={t('common.loading')}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

// Wrappers to consume context from Dashboard Outlet
const TaskListWrapper = () => {
  const {
    tasks, addTask, toggleComplete
  } = useTaskContext();
  const { categories } = useCategoryContext();
  const { startSession, activeSession, isPaused, pauseSession, resumeSession } = useFocusContext();

  const {
    filter, scrollContainer,
    getProjectNote, saveProjectNote,
    onEdit,
    onDeleteTask
  } = useOutletContext<DashboardContextType>();

  const handleToggleTimer = (id: string) => {
    if (activeSession?.taskId === id) {
      if (isPaused) resumeSession();
      else pauseSession();
    } else {
      startSession(id);
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
  return <ProfileView
    user={user}
    setUser={setUser}
    updateAvatar={updateAvatar}
    logout={logout}
    deleteProfile={() => deleteProfile(user.id)}
  />;
};

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginView from './components/views/LoginView';
import { StorageProvider } from './context/StorageContext';

// ... other imports

const PageTransitionWrapper = ({ children, noPadding = false }: { children: React.ReactNode, noPadding?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className={`w-full h-full ${noPadding ? 'p-0' : 'p-4 md:p-8 lg:p-12'}`}
  >
    {children}
  </motion.div>
);

const AppContent = () => {
  const { user, isLoading } = useAuth();

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
      <Route path="/" element={
        <UIProvider>
          <Dashboard />
        </UIProvider>
      }>
        <Route index element={<PageTransitionWrapper><TaskListWrapper /></PageTransitionWrapper>} />
        <Route path="analytics" element={
          <Suspense fallback={<Loading />}>
            <PageTransitionWrapper>
              <AnalyticsWrapper />
            </PageTransitionWrapper>
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<Loading />}>
            <PageTransitionWrapper>
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

export default function App() {
  const { i18n } = useTranslation();

  // Sync html lang attribute
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <StorageProvider>
        <ActiveTimerProvider>
          <FocusSessionProvider>
            <TaskProvider>
              <CategoryProvider>
                <PlaylistProvider>
                  <SoundProvider>
                    <AppContent />
                  </SoundProvider>
                </PlaylistProvider>
              </CategoryProvider>
            </TaskProvider>
          </FocusSessionProvider>
        </ActiveTimerProvider>
      </StorageProvider>
    </AuthProvider>
  );
}