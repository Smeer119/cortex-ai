import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

export interface UserProfile {
  _id: Id<"users">;
  email?: string;
  name?: string;
  age?: number;
  gender?: string;
  location?: string;
  status?: 'Student' | 'Working Professional';
  createdAt?: number;
  updatedAt?: number;
}

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  isProfileComplete: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // Convex queries and mutations
  const profile = useQuery(api.users.getCurrentUser);
  const isProfileComplete = useQuery(api.users.isProfileComplete);
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    // Sync Clerk user with Convex once signed in
    if (isLoaded && isSignedIn) {
      storeUser().then(() => {
        setIsInitializing(false);
      }).catch(err => {
        console.error("Failed to store user in Convex:", err);
        setIsInitializing(false);
      });
    } else if (isLoaded && !isSignedIn) {
      setIsInitializing(false);
    }
  }, [isLoaded, isSignedIn, storeUser]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      await updateProfileMutation({
        name: data.name,
        age: data.age,
        gender: data.gender,
        location: data.location,
        status: data.status,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const signOut = () => {
    clerkSignOut();
  };

  const value: AuthContextType = {
    profile: profile || null,
    loading: !isLoaded || isInitializing || (isSignedIn && (profile === undefined || isProfileComplete === undefined)),
    isProfileComplete: isProfileComplete || false,
    updateProfile,
    signOut,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

