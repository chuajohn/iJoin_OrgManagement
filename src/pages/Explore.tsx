import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, ArrowLeft, LogOut, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  description: string;
  profile_picture: string | null;
  created_at: string;
  membershipStatus?: string | null;
}

const Explore = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrgs(organizations);
    } else {
      const filtered = organizations.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrgs(filtered);
    }
  }, [searchQuery, organizations]);

  const fetchOrganizations = async () => {
    try {
      // Fetch all active organizations
      const { data: orgsData, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // If user is logged in, check membership status
      if (user) {
        const { data: membershipsData } = await supabase
          .from("memberships")
          .select("org_id, status")
          .eq("user_id", user.id);

        const membershipMap = new Map(
          membershipsData?.map((m) => [m.org_id, m.status])
        );

        const orgsWithStatus = orgsData?.map((org) => ({
          ...org,
          membershipStatus: membershipMap.get(org.id) || null,
        }));

        setOrganizations(orgsWithStatus || []);
      } else {
        setOrganizations(orgsData || []);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (orgId: string) => {
    if (!user) {
      toast.error("Please sign in to join organizations");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("memberships").insert({
        user_id: user.id,
        org_id: orgId,
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You've already requested to join this organization");
        } else {
          throw error;
        }
      } else {
        toast.success("Join request sent successfully!");
        fetchOrganizations();
      }
    } catch (error) {
      console.error("Error joining organization:", error);
      toast.error("Failed to send join request");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to={user ? "/dashboard" : "/"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">iJoin</span>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
          {!user && (
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Explore Organizations
          </h1>
          <p className="text-muted-foreground">
            Discover and join student organizations at iAcademy
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Organizations Grid */}
        {filteredOrgs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              {searchQuery
                ? "No organizations found matching your search"
                : "No organizations available yet"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => (
              <Card key={org.id} className="group transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="line-clamp-1">{org.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {org.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {org.membershipStatus === "pending" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Pending Approval
                    </Button>
                  ) : org.membershipStatus === "accepted" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Already a Member
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleJoinOrg(org.id)}
                    >
                      Join Organization
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
