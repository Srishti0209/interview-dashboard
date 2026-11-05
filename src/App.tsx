import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { AppBootstrap } from '@/components/AppBootstrap';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { AuthGate } from '@/components/auth/AuthGate';
import { ProfileGate } from '@/components/auth/ProfileGate';
import {
  queryClient,
  queryPersister,
  PERSIST_MAX_AGE,
} from '@/lib/queryClient';
// Registers the write queue's defaults.
import '@/lib/sync';
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
import Account from '@/pages/Account';
import NotFound from '@/pages/NotFound';
import StoryDetail from '@/pages/StoryDetail';
import StoryBuilder from '@/pages/StoryBuilder';
import JobDescriptions from '@/pages/JobDescriptions';
import JobDetail from '@/pages/JobDetail';

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

// Remount per question so autosave state and its unmount flush can never
// carry one question's pending edits over to another.
function QuestionDetailRoute() {
  const { id } = useParams();
  return <QuestionDetail key={id} />;
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
          <Route path="questions/:id" element={<QuestionDetailRoute />} />
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
          <Route path="stories/:id" element={<StoryDetail />} />
          <Route path="stories/:id/build" element={<StoryBuilder />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="jobs" element={<JobDescriptions />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route
            path="mock"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Mock />
              </Suspense>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: PERSIST_MAX_AGE,
        dehydrateOptions: {
          // Queued writes are kept in the sync outbox, not the cache.
          shouldDehydrateMutation: () => false,
          // AI availability is always checked live, never restored from disk.
          shouldDehydrateQuery: (q) => defaultShouldDehydrateQuery(q) && q.queryKey[0] !== 'ai-status',
        },
      }}
    >
      <AuthGate>
        <ProfileGate>
          <AppBootstrap>
            <BrowserRouter>
              <InnerApp />
            </BrowserRouter>
          </AppBootstrap>
        </ProfileGate>
      </AuthGate>
    </PersistQueryClientProvider>
  );
}
