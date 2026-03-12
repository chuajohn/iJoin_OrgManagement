import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoleManagement } from "@/components/admin/UserRoleManagement";
import { OrganizationManagement } from "@/components/admin/OrganizationManagement";
import { EventManagement } from "@/components/admin/EventManagement";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Settings, Users, Calendar } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Admin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    organizations: 0,
    events: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users (profiles count)
      const { count: usersCount, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Get total organizations (active only)
      const { count: orgsCount, error: orgsError } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (orgsError) throw orgsError;

      // Get total events (approved only)
      const { count: eventsCount, error: eventsError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      if (eventsError) throw eventsError;

      setStats({
        users: usersCount || 0,
        organizations: orgsCount || 0,
        events: eventsCount || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#00A3FF]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#B43B3B]/5 rounded-full blur-3xl"></div>

      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#00A3FF]/30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
              className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#B43B3B]/10 border border-[#B43B3B]/30 flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#B43B3B]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A2E]">Admin Dashboard</h1>
            </div>
          </div>
          <SignOutButton 
            variant="ghost" 
            size="icon" 
            className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5"
          />
        </div>
      </header>

      {/* Stats Cards - Same size as original */}
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <div className="bg-white/50 backdrop-blur-sm border border-[#00A3FF]/20 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#00A3FF]/5 border border-[#00A3FF]/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-[#00A3FF]" />
            </div>
            <div>
              <p className="text-xs text-[#4A5568]">Total Users</p>
              <p className="text-xl font-bold text-[#1A1A2E]">
                {loading ? "..." : stats.users}
              </p>
            </div>
          </div>
          <div className="bg-white/50 backdrop-blur-sm border border-[#B43B3B]/20 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#B43B3B]/5 border border-[#B43B3B]/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-[#B43B3B]" />
            </div>
            <div>
              <p className="text-xs text-[#4A5568]">Organizations</p>
              <p className="text-xl font-bold text-[#1A1A2E]">
                {loading ? "..." : stats.organizations}
              </p>
            </div>
          </div>
          <div className="bg-white/50 backdrop-blur-sm border border-[#FFD966]/20 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#FFD966]/5 border border-[#FFD966]/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#FFD966]" />
            </div>
            <div>
              <p className="text-xs text-[#4A5568]">Events</p>
              <p className="text-xl font-bold text-[#1A1A2E]">
                {loading ? "..." : stats.events}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-2 relative z-10">
        <div className="space-y-8 max-w-5xl mx-auto">
          <UserRoleManagement />
          <OrganizationManagement />
          <EventManagement />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-[#1A1A2E] border-t border-[#00A3FF]/20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-[#FCF9F5]/40">
            <p>© 2026 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}