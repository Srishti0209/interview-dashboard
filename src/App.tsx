import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { AppBootstrap } from '@/components/AppBootstrap';
import { CommandPalette } from '@/components/CommandPalette';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useTheme } from '@/hooks/useTheme';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import Dashboard from '@/pages/Dashboard';
import Questions from '@/pages/Questions';
import QuestionDetail from '@/pages/QuestionDetail';
import NewQuestion from '@/pages/NewQuestion';
import Stories from '@/pages/Stories';
import Companies from '@/pages/Companies';
import CompanyDetail from '@/pages/CompanyDetail';
import SettingsPage from '@/pages/SettingsPage';
import NotFound from '@/pages/NotFound';

// Heavy routes are code-split to keep the initial bundle small.
const Notes = lazy(() => import('@/pages/Notes'));
const Mock = lazy(() => import('@/pages/Mock'));

function RouteFallback() {
  return (
    <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

function InnerApp() {
  useTheme();
  useGlobalShortcuts();

  return (
    <>
      <CommandPalette />
      <InstallPrompt />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="questions" element={<Questions />} />
          <Route path="questions/:id" element={<QuestionDetail />} />
          <Route path="my-questions/new" element={<NewQuestion />} />
          <Route
            path="notes"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Notes />
              </Suspense>
            }
          />
          <Route
            path="notes/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Notes />
              </Suspense>
            }
          />
          <Route path="stories" element={<Stories />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route
            path="mock"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Mock />
              </Suspense>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppBootstrap>
      <BrowserRouter>
        <InnerApp />
      </BrowserRouter>
    </AppBootstrap>
  );
}
