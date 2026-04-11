import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UserRole = 'senior_highschool_student' | 'undergraduate_student' | 'sao' | 'admin';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_picture: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  userRole: UserRole | null;
  signUp: (email: string, password: string, name: string, userType: 'senior_highschool_student' | 'undergraduate_student') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  // Fetch user role from database
  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role as UserRole || null;
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      return null;
    }
  };

  // Update profile in database
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error("No user logged in");
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  };

  // Refresh profile and role data
  const refreshProfile = async () => {
    if (user) {
      const [newProfile, newRole] = await Promise.all([
        fetchUserProfile(user.id),
        fetchUserRole(user.id)
      ]);
      
      if (newProfile) setProfile(newProfile);
      if (newRole) setUserRole(newRole);
    }
  };

  // Handle session changes
  useEffect(() => {
    let isMounted = true;
    
    const handleSession = async (session: Session | null) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const [userProfile, userRoleData] = await Promise.all([
          fetchUserProfile(session.user.id),
          fetchUserRole(session.user.id)
        ]);
        
        if (isMounted) {
          setProfile(userProfile);
          setUserRole(userRoleData);
        }
      } else {
        setProfile(null);
        setUserRole(null);
      }
      
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ✅ SIMPLIFIED: Just call supabase.auth.signUp - TRIGGER HANDLES THE REST
  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    userType: 'senior_highschool_student' | 'undergraduate_student'
  ) => {
    try {
      console.log("Signing up with:", { email, name, userType });
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            user_type: userType  // Trigger uses this
          }
        }
      });

      if (error) {
        const errorMessage = error.message?.toLowerCase() ?? "";
        const isDuplicateEmail =
          errorMessage.includes("already registered") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("duplicate");

        if (isDuplicateEmail) {
          throw new Error("This email is already registered. Please sign in instead.");
        }

        throw error;
      }
      
      // No need to create profile or role - TRIGGER DOES IT!
      toast.success("Account created! Please check your email to verify.");
      
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error.message || "Failed to create account");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        const errorMessage = error.message?.toLowerCase() ?? "";
        const isMissingSessionError =
          errorMessage.includes("auth session missing") ||
          errorMessage.includes("session missing") ||
          errorMessage.includes("session not found");

        if (!isMissingSessionError) {
          throw error;
        }
      }
      
      setSession(null);
      setUser(null);
      setProfile(null);
      setUserRole(null);
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        userRole,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}