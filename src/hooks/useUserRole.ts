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
        setLoading(false);
        return;
      }

      try {
        // Fetch global role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        setGlobalRole(roleData?.role || null);

        // Fetch org-specific role if orgId provided
        if (orgId) {
          const { data: memberData } = await supabase
            .from("memberships")
            .select("role, status")
            .eq("user_id", user.id)
            .eq("org_id", orgId)
            .eq("status", "accepted")
            .single();

          setOrgRole(memberData?.role || null);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user, orgId]);

  const isOfficer = orgRole === "officer" || orgRole === "leader";
  const isLeader = orgRole === "leader";
  const isSAO = globalRole === "sao" || globalRole === "admin";
  const isAdmin = globalRole === "admin";

  return { globalRole, orgRole, isOfficer, isLeader, isSAO, isAdmin, loading };
}
