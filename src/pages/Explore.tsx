import { useEffect, useState, useCallback } from "react"; // Add useCallback
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, ArrowLeft, Bell, Settings, School, GraduationCap, Sparkles, UserCheck, Shield } from "lucide-react";
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

type TabFilter = 'all' | 'shs' | 'college' | 'myorgs';

const Explore = () => {
  const { user } = useAuth();
  const { isSHSStudent, isUGStudent, isAdmin, isSAO } = useUserRole();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0); // Add cache timestamp

  const isStudent = isSHSStudent || isUGStudent;

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

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchOrganizations = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent fetching too often (cache for 30 seconds)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 30000 && organizations.length > 0) {
      console.log("Using cached data");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching fresh organizations data...");
      
      // Fetch ALL active organizations
      const { data: orgsData, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch memberships
      const { data: membershipsData } = await supabase
        .from("memberships")
        .select("org_id, status, role")
        .eq("user_id", user.id);

      console.log("Memberships fetched:", membershipsData);

      const membershipMap = new Map(
        membershipsData?.map((m) => [m.org_id, { status: m.status, role: m.role }])
      );

      const orgsWithStatus = orgsData?.map((org) => {
        const membership = membershipMap.get(org.id);
        return {
          ...org,
          membershipStatus: isStudent ? (membership?.status || null) : null,
          membershipRole: isStudent ? (membership?.role || null) : null,
        };
      });

      console.log("Organizations with status:", orgsWithStatus);
      setOrganizations(orgsWithStatus || []);
      setLastFetchTime(now); // Update cache timestamp
      
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [user, isStudent, lastFetchTime, organizations.length]);

  // Initial fetch
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Filter organizations based on search and tab
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
    } else if (activeTab === 'myorgs') {
      if (isStudent) {
        filtered = filtered.filter(org => 
          org.membershipStatus === "accepted" || org.membershipStatus === "pending"
        );
      }
    }

    setFilteredOrgs(filtered);
  }, [searchQuery, organizations, activeTab, isStudent]);

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
        // Force refresh data
        await fetchOrganizations(true);
      }
    } catch (error) {
      console.error("Error joining organization:", error);
      toast.error("Failed to send join request");
    }
  };

  // Check if user can join this org
  const canJoinOrg = (org: Organization) => {
    if (!user) return false;
    if (!isStudent) return false;
    if (isSHSStudent) return org.is_shs_org === true;
    if (isUGStudent) return org.is_shs_org === false;
    return false;
  };

  const isJoinable = (org: Organization) => {
    return canJoinOrg(org) && org.membershipStatus !== "accepted" && org.membershipStatus !== "pending";
  };

  const canManageOrg = (org: Organization) => {
    if (!user) return false;
    if (!isStudent) return false;
    return org.membershipStatus === "accepted" && 
           (org.membershipRole === "officer" || org.membershipRole === "leader");
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
      {/* Header (unchanged) */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Icon + Image Logo */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              {/* Logo Image */}
              <img 
                src="/logo.svg" 
                alt="logo" 
                className="h-8 w-auto md:h-10"
              />
              {/* Brand Name */}
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">iJoin</span>
            </Link>
          </div>
          
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
              {isAdmin && (
                <Badge variant="destructive" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              {isSAO && (
                <Badge variant="default" className="gap-1">
                  <Shield className="h-3 w-3" />
                  SAO
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
            {isAdmin || isSAO 
              ? "Manage and oversee all student organizations"
              : "Discover student organizations at iAcademy"}
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
            {isStudent && (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 gap-1">
                <UserCheck className="mr-1 h-3 w-3" />
                {organizations.filter(o => o.membershipStatus === "accepted").length} Joined
              </Badge>
            )}
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

        {/* Tab Filters */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabFilter)} className="w-full">
            <TabsList className={`grid w-full ${isStudent ? 'grid-cols-4' : 'grid-cols-3'} max-w-2xl mx-auto`}>
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
              {isStudent && (
                <TabsTrigger value="myorgs" className="gap-2">
                  <UserCheck className="h-4 w-4" />
                  My Orgs
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredOrgs.length} {filteredOrgs.length === 1 ? 'organization' : 'organizations'}
        </div>

        {/* Organizations Grid */}
        {filteredOrgs.length === 0 ? (
          <div className="py-12 text-center">
            {/* ... empty state ... */}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => {
              const canJoin = isJoinable(org);
              const manage = canManageOrg(org);
              const isMember = org.membershipStatus === "accepted" && isStudent;
              const isPending = org.membershipStatus === "pending" && isStudent;

              console.log(`Org ${org.name}:`, { // Debug log
                membershipStatus: org.membershipStatus,
                membershipRole: org.membershipRole,
                manage,
                isMember
              });

              return (
                <Card key={org.id} className="group transition-all hover:shadow-lg relative flex flex-col h-full">
                  {/* Level badge */}
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

                  {/* Status badges */}
                  {isStudent && (
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                      {isMember && !manage && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Member
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending
                        </Badge>
                      )}
                      {manage && (
                        <Badge variant="default" className="bg-amber-500 text-white border-amber-600 gap-1">
                          <Settings className="h-3 w-3" />
                          {org.membershipRole === "leader" ? "Leader" : "Officer"}
                        </Badge>
                      )}
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
                    <Link to={`/org/${org.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Organization
                      </Button>
                    </Link>

                    {manage && (
                      <Link to={`/org/${org.id}/manage`} className="w-full">
                        <Button variant="secondary" className="w-full gap-2">
                          <Settings className="h-4 w-4" />
                          Manage
                        </Button>
                      </Link>
                    )}

                    {isStudent && !manage && !isMember && !isPending && canJoin ? (
                      <Button 
                        className="w-full" 
                        onClick={() => handleJoinOrg(org.id)}
                      >
                        Join Organization
                      </Button>
                    ) : null}

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