// hooks/useUserRole.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserRole(orgId?: string) {
  const { user } = useAuth();
  const [globalRole, setGlobalRole] = useState<string | null>(null);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setGlobalRole(null);
        setOrgRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching role for user:", user.id); // Debug log
        
        // Fetch global role - use maybeSingle() to avoid errors
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching role:", error);
        }

        console.log("Role data:", roleData); // Debug log
        
        setGlobalRole(roleData?.role || null);

        // Fetch org-specific role if orgId provided
        if (orgId) {
          const { data: memberData } = await supabase
            .from("memberships")
            .select("role, status")
            .eq("user_id", user.id)
            .eq("org_id", orgId)
            .eq("status", "accepted")
            .maybeSingle();

          setOrgRole(memberData?.role || null);
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoles();
    });

    return () => subscription.unsubscribe();
  }, [user?.id, orgId]);

  // Organization-specific role helpers
  const isMember = !!orgRole;
  const isOfficer = orgRole === "officer" || orgRole === "leader";
  const isLeader = orgRole === "leader";
  
  // Global role helpers
  const isAdmin = globalRole === "admin";
  const isSAO = globalRole === "sao";
  const isSHSStudent = globalRole === "senior_highschool_student";
  const isUGStudent = globalRole === "undergraduate_student";
  const isStudent = isSHSStudent || isUGStudent;

  return { 
    // Raw roles
    globalRole, 
    orgRole, 
    loading,
    
    // Role helpers
    isMember,
    isOfficer, 
    isLeader, 
    isAdmin, 
    isSAO,
    isSHSStudent,
    isUGStudent,
    isStudent
  };
}