import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthResponse, Subscription, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { useToast } from '@chakra-ui/react';
import { errorMessage } from '../lib/errors';

type AuthResult = { data: AuthResponse['data'] | null; error: unknown };

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    signup: (email: string, password: string) => Promise<AuthResult>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

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

    const login = async (email: string, password: string): Promise<AuthResult> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            toast({
                title: "Logged in successfully!",
                status: "success",
                duration: 3000,
            });
            return { data, error: null };
        } catch (error) {
            toast({
                title: "Error logging in",
                description: errorMessage(error),
                status: "error",
                duration: 5000,
            });
            return { data: null, error };
        }
    };

    const signup = async (email: string, password: string): Promise<AuthResult> => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            toast({
                title: "Sign up successful!",
                description: "Please check your email for verification.",
                status: "success",
                duration: 5000,
            });
            return { data, error: null };
        } catch (error) {
            toast({
                title: "Error signing up",
                description: errorMessage(error),
                status: "error",
                duration: 5000,
            });
            return { data: null, error };
        }
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast({
                title: "Logged out successfully",
                status: "success",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Error logging out",
                description: errorMessage(error),
                status: "error",
                duration: 5000,
            });
        }
    };

    const value: AuthContextValue = {
        user,
        loading,
        login,
        signup,
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