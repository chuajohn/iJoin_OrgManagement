import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, ArrowLeft, Bell, Settings, School, GraduationCap, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OrgLogo from "@/components/OrgLogo";
import { SignOutButton } from "@/components/SignOutButton";

interface Organization {
  id: string;
  name: string;
  description: string;
  profile_picture: string | null;
  created_at: string;
  is_shs_org: boolean;
  membershipStatus?: string | null;
  membershipRole?: string | null;
}

type TabFilter = 'all' | 'shs' | 'college';

const Explore = () => {
  const { user } = useAuth();
  const { isSHSStudent, isUGStudent, isAdmin, isSAO } = useUserRole();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // Set default tab based on user role
  useEffect(() => {
    if (isSHSStudent) {
      setActiveTab('shs');
    } else if (isUGStudent) {
      setActiveTab('college');
    } else {
      setActiveTab('all');
    }
  }, [isSHSStudent, isUGStudent]);

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  useEffect(() => {
    let filtered = [...organizations];

    // Apply search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tab filter
    if (activeTab === 'shs') {
      filtered = filtered.filter(org => org.is_shs_org === true);
    } else if (activeTab === 'college') {
      filtered = filtered.filter(org => org.is_shs_org === false);
    }
    // 'all' shows everything

    setFilteredOrgs(filtered);
  }, [searchQuery, organizations, activeTab]);

  const fetchOrganizations = async () => {
    try {
      // Fetch ALL active organizations
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
          .select("org_id, status, role")
          .eq("user_id", user.id);

        const membershipMap = new Map(
          membershipsData?.map((m) => [m.org_id, { status: m.status, role: m.role }])
        );

        const orgsWithStatus = orgsData?.map((org) => {
          const membership = membershipMap.get(org.id);
          return {
            ...org,
            membershipStatus: membership?.status || null,
            membershipRole: membership?.role || null,
          };
        });

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

    const org = organizations.find(o => o.id === orgId);
    if (!org) return;

    // Strict join restrictions
    if (isSHSStudent && !org.is_shs_org) {
      toast.error("SHS students can only join SHS organizations");
      return;
    }

    if (isUGStudent && org.is_shs_org) {
      toast.error("Undergraduate students cannot join SHS organizations");
      return;
    }

    // Admins/SAO cannot join orgs
    if (isAdmin || isSAO) {
      toast.error("Admins and SAO cannot join organizations");
      return;
    }

    try {
      const { error } = await supabase.from("memberships").insert({
        user_id: user.id,
        org_id: orgId,
        status: "pending",
        role: "member"
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

  // Check if user can join this org
  const canJoinOrg = (org: Organization) => {
    if (!user) return false;
    if (isAdmin || isSAO) return false;
    if (isSHSStudent) return org.is_shs_org === true;
    if (isUGStudent) return org.is_shs_org === false;
    return false;
  };

  // Check if this org is joinable by the current user
  const isJoinable = (org: Organization) => {
    return canJoinOrg(org) && org.membershipStatus !== "accepted" && org.membershipStatus !== "pending";
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
          
          {/* User info badge */}
          {user && (
            <div className="flex items-center gap-4">
              {isSHSStudent && (
                <Badge variant="secondary" className="gap-1">
                  <School className="h-3 w-3" />
                  SHS Student
                </Badge>
              )}
              {isUGStudent && (
                <Badge variant="outline" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  Undergraduate
                </Badge>
              )}
              {(isAdmin || isSAO) && (
                <Badge variant={isAdmin ? "destructive" : "default"}>
                  {isAdmin ? "Admin" : "SAO"}
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <SignOutButton variant="ghost" size="icon" />
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
            Discover student organizations at iAcademy
          </p>
          
          {/* Stats badges */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-background">
              {organizations.length} total organizations
            </Badge>
            <Badge variant="secondary" className="bg-blue-50">
              <School className="mr-1 h-3 w-3" />
              {organizations.filter(o => o.is_shs_org).length} SHS
            </Badge>
            <Badge variant="outline">
              <GraduationCap className="mr-1 h-3 w-3" />
              {organizations.filter(o => !o.is_shs_org).length} College
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
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

        {/* Tab Filters - Everyone can use these */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabFilter)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="all" className="gap-2">
                <Users className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="shs" className="gap-2">
                <School className="h-4 w-4" />
                SHS
              </TabsTrigger>
              <TabsTrigger value="college" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                College
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Hint text showing current filter context */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            {activeTab === 'shs' && "Showing Senior High School organizations"}
            {activeTab === 'college' && "Showing College/Undergraduate organizations"}
            {activeTab === 'all' && "Showing all organizations"}
            {user && !isAdmin && !isSAO && activeTab === 'all' && " — You can only join organizations matching your level"}
          </p>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredOrgs.length} {filteredOrgs.length === 1 ? 'organization' : 'organizations'}
        </div>

        {/* Organizations Grid */}
        {filteredOrgs.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-lg font-medium text-foreground">
              {searchQuery
                ? "No organizations found matching your search"
                : `No ${activeTab === 'shs' ? 'SHS' : activeTab === 'college' ? 'College' : ''} organizations available yet`}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back later for new organizations
            </p>
            {(isAdmin || isSAO) && (
              <Link to="/admin/create-organization" className="mt-4 inline-block">
                <Button>Create Organization</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => {
              const canJoin = isJoinable(org);
              const isUserLevel = user && (
                (isSHSStudent && org.is_shs_org) || 
                (isUGStudent && !org.is_shs_org)
              );

              return (
                <Card key={org.id} className="group transition-all hover:shadow-lg relative flex flex-col h-full">
                  {/* Level badge - positioned at top */}
                  <div className="absolute top-2 left-2 z-10">
                    {org.is_shs_org ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
                        <School className="h-3 w-3" />
                        SHS
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm gap-1">
                        <GraduationCap className="h-3 w-3" />
                        College
                      </Badge>
                    )}
                  </div>

                  {/* Your level indicator */}
                  {isUserLevel && user && !isAdmin && !isSAO && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 gap-1">
                        <Sparkles className="h-3 w-3" />
                        Your Level
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex justify-center pt-6">
                      <OrgLogo 
                        src={org.profile_picture} 
                        alt={org.name} 
                        size="lg" 
                        className="border-2 border-muted rounded-xl"
                      />
                    </div>
                    <CardTitle className="line-clamp-1 text-center mt-2">
                      {org.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-center">
                      {org.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col gap-3 mt-auto pt-2">
                    {/* View Organization Button - ALWAYS VISIBLE */}
                    <Link to={`/org/${org.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Organization
                      </Button>
                    </Link>

                    {/* Join Button - ONLY SHOW if user can actually join */}
                    {canJoin ? (
                      <Button 
                        className="w-full" 
                        onClick={() => handleJoinOrg(org.id)}
                      >
                        Join Organization
                      </Button>
                    ) : (
                      /* Show nothing - no button at all */
                      user && org.membershipStatus === "pending" ? (
                        <Button variant="outline" className="w-full" disabled>
                          Pending Approval
                        </Button>
                      ) : org.membershipStatus === "accepted" ? (
                        <Button variant="outline" className="w-full" disabled>
                          Member
                        </Button>
                      ) : null
                    )}

                    {/* Show sign in prompt for non-logged in users */}
                    {!user && (
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => navigate("/auth")}
                      >
                        Sign in to Join
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;