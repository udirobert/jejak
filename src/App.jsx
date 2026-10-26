import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { AppProvider } from '@/lib/AppContext';
import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
const Flow = React.lazy(() => import('@/pages/Flow'));
const Embedded = React.lazy(() => import('@/pages/Embedded'));
const Impact = React.lazy(() => import('@/pages/Impact'));
const Explore = React.lazy(() => import('@/pages/Explore'));
const Landing = React.lazy(() => import('@/pages/Landing'));
const Journal = React.lazy(() => import('@/pages/Journal'));
const Room = React.lazy(() => import('@/pages/Room'));
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const ForgotPassword = React.lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword'));
const OAuthConsent = React.lazy(() => import('@/pages/OAuthConsent'));

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F3EDE2]">
    <span className="font-serif-display text-xl italic text-[#1E1B16]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}>Jejak</span>
  </div>
);
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AppProvider>
      <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Add your page Route elements here */}
        <Route element={<AppLayout />}>
          <Route path="/trace" element={<Flow />} />
          <Route path="/atlas" element={<Explore />} />
          <Route path="/explore" element={<Navigate to="/atlas" replace />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/room" element={<Room />} />
          <Route path="/floor" element={<Navigate to="/room" replace />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/embedded" element={<Embedded />} />
        </Route>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-consent" element={<OAuthConsent />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
    </AppProvider>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        {/* Every toast in the app comes from sonner, so it needs its own
            outlet — the shadcn Toaster above is a separate store. */}
        <Sonner
          position="bottom-center"
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "!rounded-none !border !border-journal-rule !bg-journal-card !font-grotesk !text-journal-ink !shadow-[3px_3px_0_0_rgba(30,27,22,0.12)]",
              description: "!text-journal-ink-soft",
              actionButton: "!bg-journal-ink !text-journal-card !rounded-none",
              closeButton: "!text-journal-ink-soft",
            },
          }}
        />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App