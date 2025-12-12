
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSession, useUser as useSupaUser } from '@supabase/auth-helpers-react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';


// This context is now a wrapper around Supabase's user state
// to maintain a consistent `useUser` hook API throughout the app.

export interface UserHookResult {
  user: User | null; // Supabase user type is different from Firebase
  isUserLoading: boolean;
  userError: Error | null;
}

const UserContext = createContext<UserHookResult | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const session = useSession();
  const user = useSupaUser();
  
  const value = useMemo(() => ({
    user: user,
    isUserLoading: !session && session !== null, // More accurate loading state
    userError: session?.user ? null : (session === null ? null : new Error("No session"))
  }), [user, session]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserHookResult => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider (now Supabase Context).');
  }
  return context;
};

// Dummy exports to prevent breaking imports in other files.
// These should be refactored out over time.
export const useFirebase = () => { throw new Error("Firebase is deprecated. Use Supabase.") };
export const useAuth = () => useSupabaseClient()?.auth;
export const useFirestore = () => useSupabaseClient(); // This will act as the Supabase client
export const useFirebaseApp = () => { throw new Error("Firebase is deprecated. Use Supabase.") };
