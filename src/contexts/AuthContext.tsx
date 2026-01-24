import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// CORRECTED: Match your exact database schema
interface UserProfile {
  id: string;
  email: string;
  name: string;  // ← Your database uses 'name' (not full_name)
  profile_picture: string | null;  // ← Your database uses 'profile_picture' (not avatar_url)
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log("Fetching profile for user:", userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        
        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          console.log("Profile doesn't exist, creating one...");
          return await createUserProfile(userId);
        }
        
        throw error;
      }

      console.log("Fetched profile:", data);
      return data;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  // Function to create a new user profile
  const createUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || "";
      
      const newProfile = {
        id: userId,
        email: email,
        name: "",  // ← CORRECT: your database uses 'name'
        profile_picture: null,  // ← CORRECT: your database uses 'profile_picture'
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;
      
      console.log("Created new profile:", data);
      return data;
    } catch (error) {
      console.error("Error creating profile:", error);
      return null;
    }
  };

  // Function to update profile in database
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error("No user logged in");
    }

    try {
      console.log("Updating profile with:", updates);
      
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const newProfile = await fetchUserProfile(user.id);
      if (newProfile) {
        setProfile(newProfile);
      }
    }
  };

  useEffect(() => {
  console.log("AuthContext: Starting auth setup");
  
  let isMounted = true;
  
  const handleSession = async (session: Session | null) => {
    if (!isMounted) return;
    
    console.log("AuthContext: Handling session", { hasSession: !!session });
    
    // Set immediate states FIRST (like original)
    setSession(session);
    setUser(session?.user ?? null);
    
    // Set loading false IMMEDIATELY (like original)
    setLoading(false);
    console.log("AuthContext: Loading set to false");
    
    // Then fetch profile in background
    if (session?.user) {
      try {
        console.log("AuthContext: Starting profile fetch");
        const userProfile = await fetchUserProfile(session.user.id);
        if (isMounted && userProfile) {
          console.log("AuthContext: Profile fetched successfully");
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("AuthContext: Profile fetch error:", error);
      }
    } else if (isMounted) {
      setProfile(null);
    }
  };

  // Set up listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      handleSession(session);
    }
  );

  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    handleSession(session);
  });

  return () => {
    console.log("AuthContext: Cleanup");
    isMounted = false;
    subscription.unsubscribe();
  };
}, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
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
      if (error) throw error;

      setProfile(null); // Clear profile on sign out
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