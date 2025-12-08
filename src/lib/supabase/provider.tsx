
'use-client';
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './client';

type SupabaseContextType = {
    supabase: SupabaseClient;
    user: User | null;
    isLoading: boolean;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
    const [supabase] = useState(() => createClient());
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    // Initial check
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            }
            setIsLoading(false);
        }
        checkUser();
    }, [supabase]);

    return (
        <SupabaseContext.Provider value={{ supabase, user, isLoading }}>
            {children}
        </SupabaseContext.Provider>
    );
};

export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};

// Compatibility hook for migration
export const useUser = () => {
    const { user, isLoading } = useSupabase();
    return { user, isUserLoading: isLoading, userError: null };
}
