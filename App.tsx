import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConvexReactClient } from 'convex/react';
import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileCompletion from './components/ProfileCompletion';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Clerk Publishable Key
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY. Please set it in .env.local");
}

const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const { profile, loading } = useAuth();
  
  if (loading) return null;
  if (profile) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            CORTEX
          </h1>
          <p className="text-slate-600">Your AI-powered second brain</p>
        </div>
        
        {mode === 'login' ? <Login /> : <Signup />}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />

            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/complete-profile" 
              element={
                <ProtectedRoute requireProfileComplete={false}>
                  <ProfileCompletion />
                </ProtectedRoute>
              } 
            />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

export default App;


