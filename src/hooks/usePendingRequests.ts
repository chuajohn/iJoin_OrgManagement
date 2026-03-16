import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PendingCounts {
  [orgId: string]: number;
}

export function usePendingRequests() {
  const { user } = useAuth();
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({});
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchPendingCounts();
    
    // Subscribe to changes
    const channel = supabase
      .channel('pending-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memberships',
          filter: `status=eq.pending`
        },
        () => {
          fetchPendingCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPendingCounts = async () => {
    if (!user) return;

    try {
      // First, get all organizations where user is an officer or leader
      const { data: memberships, error: membershipsError } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .in("role", ["officer", "leader"]);

      if (membershipsError) throw membershipsError;

      const orgIds = memberships?.map(m => m.org_id) || [];

      if (orgIds.length === 0) {
        setPendingCounts({});
        setTotalPending(0);
        setLoading(false);
        return;
      }

      // Get counts per organization
      const counts: PendingCounts = {};
      let total = 0;

      for (const orgId of orgIds) {
        const { count, error } = await supabase
          .from("memberships")
          .select("*", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("status", "pending");

        if (error) throw error;
        
        counts[orgId] = count || 0;
        total += count || 0;
      }

      setPendingCounts(counts);
      setTotalPending(total);
    } catch (error) {
      console.error("Error fetching pending counts:", error);
    } finally {
      setLoading(false);
    }
  };

  return { pendingCounts, totalPending, loading, refresh: fetchPendingCounts };
}