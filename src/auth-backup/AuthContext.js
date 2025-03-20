import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '@chakra-ui/react';

// Create the context with an empty object as default value
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
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
                description: error.message,
                status: "error",
                duration: 5000,
            });
            return { data: null, error };
        }
    };

    const signup = async (email, password) => {
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
                description: error.message,
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
                description: error.message,
                status: "error",
                duration: 5000,
            });
        }
    };

    const value = {
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