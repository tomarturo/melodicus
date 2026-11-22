import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Subscription, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { useNotify } from '../lib/notify';
import { errorCause } from '../lib/errors';

type AuthResult = { error: unknown };

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    /**
     * Emails a one-time login code. The same for new and returning people:
     * Supabase creates the account the first time an email is used.
     */
    sendCode: (email: string) => Promise<AuthResult>;
    /** Logs in with the code from that email. */
    verifyCode: (email: string, code: string) => Promise<AuthResult>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const notify = useNotify();

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setUser(session?.user ?? null);
                setLoading(false);
            })
            .catch(() => {
                // Supabase unavailable (e.g. project paused) — fall through to guest mode
                setUser(null);
                setLoading(false);
            });

        // Listen for changes on auth state (logged in, signed out, etc.)
        let subscription: Subscription | undefined;
        try {
            const result = supabase.auth.onAuthStateChange((_event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
            });
            subscription = result.data.subscription;
        } catch {
            // Supabase unavailable — app continues in guest mode
            setLoading(false);
        }

        return () => subscription?.unsubscribe();
    }, []);

    const sendCode = async (email: string): Promise<AuthResult> => {
        try {
            const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            // Shown in the dialog, which stays open to try again.
            return { error };
        }
    };

    const verifyCode = async (email: string, code: string): Promise<AuthResult> => {
        try {
            const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
            if (error) throw error;
            // No toast: the dialog closes and the sidebar shows the account.
            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            notify({ tone: 'success', title: 'Logged out' });
        } catch (error) {
            notify({ tone: 'error', title: 'Couldn’t log out', description: errorCause(error) });
        }
    };

    const value: AuthContextValue = {
        user,
        loading,
        sendCode,
        verifyCode,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};