import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, ArrowLeft, Bell, Settings, School, GraduationCap, Sparkles, UserCheck, Shield, CheckCheck, PlusCircle, Compass } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OrgLogo from "@/components/OrgLogo";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationItem } from "@/components/NotificationItem";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { format } from "date-fns";

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

interface Notification {
  id: string;
  type: 'membership_accepted' | 'new_announcement' | 'new_event' | 'org_approved';
  title: string;
  message: string;
  data: {
    org_id?: string;
    announcement_id?: string;
    event_id?: string;
    membership_id?: string;
  };
  read: boolean;
  created_at: string;
  user_id: string;
}

type TabFilter = 'all' | 'shs' | 'college' | 'myorgs';

const Explore = () => {
  const { user } = useAuth();
  const { isSHSStudent, isUGStudent, isAdmin, isSAO } = useUserRole();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const isStudent = isSHSStudent || isUGStudent;

  const { pendingCounts } = usePendingRequests();

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

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const transformedNotifications: Notification[] = (data || []).map(item => ({
        id: item.id,
        type: item.type as Notification['type'],
        title: item.title,
        message: item.message,
        data: item.data as Notification['data'],
        read: item.read,
        created_at: item.created_at,
        user_id: item.user_id
      }));
      
      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Setup notifications subscription
  const setupNotificationsSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel("explore-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newItem = payload.new as any;
          const newNotification: Notification = {
            id: newItem.id,
            type: newItem.type as Notification['type'],
            title: newItem.title,
            message: newItem.message,
            data: newItem.data as Notification['data'],
            read: newItem.read,
            created_at: newItem.created_at,
            user_id: newItem.user_id
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const cleanup = setupNotificationsSubscription();
      return cleanup;
    }
  }, [user]);

  const fetchOrganizations = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 30000 && organizations.length > 0) {
      console.log("Using cached data");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching fresh organizations data...");
      
      const { data: orgsData, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

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
          membershipStatus: isStudent ? (membership?.status || null) : null,
          membershipRole: isStudent ? (membership?.role || null) : null,
        };
      });

      setOrganizations(orgsWithStatus || []);
      setLastFetchTime(now);
      
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [user, isStudent, lastFetchTime, organizations.length]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    let filtered = [...organizations];

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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

    if (isSHSStudent && !org.is_shs_org) {
      toast.error("SHS students can only join SHS organizations");
      return;
    }

    if (isUGStudent && org.is_shs_org) {
      toast.error("Undergraduate students cannot join SHS organizations");
      return;
    }

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
        await fetchOrganizations(true);
      }
    } catch (error) {
      console.error("Error joining organization:", error);
      toast.error("Failed to send join request");
    }
  };

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0057A3] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#0057A3]/30 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/logo.svg" 
                  alt="logo" 
                  className="h-8 w-auto md:h-10"
                />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#FFD966] border border-[#1A1A2E]"></div>
              </div>
              <span className="text-xl font-bold text-[#1A1A2E] hidden sm:inline">iJoin</span>
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              {isSHSStudent && (
                <Badge variant="secondary" className="gap-1 bg-[#0057A3]/5 text-[#0057A3] border-[#0057A3]/30">
                  <School className="h-3 w-3" />
                  SHS Student
                </Badge>
              )}
              {isUGStudent && (
                <Badge variant="outline" className="gap-1 border-[#B43B3B]/30 text-[#B43B3B] bg-transparent">
                  <GraduationCap className="h-3 w-3" />
                  Undergraduate
                </Badge>
              )}
              {isAdmin && (
                <Badge variant="destructive" className="gap-1 bg-[#B43B3B] text-white border-none">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              {isSAO && (
                <Badge variant="default" className="gap-1 bg-[#0057A3] text-white border-none">
                  <Shield className="h-3 w-3" />
                  SAO
                </Badge>
              )}
              
              {/* Notifications Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#B43B3B] text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0 border border-[#0057A3]/30 shadow-lg" align="end">
                  <div className="flex items-center justify-between p-4 border-b border-[#0057A3]/20">
                    <h3 className="font-semibold text-[#1A1A2E]">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1 text-[#0057A3] hover:text-[#0057A3] hover:bg-[#0057A3]/5"
                        onClick={markAllAsRead}
                      >
                        <CheckCheck className="h-3 w-3" />
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[500px]">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-[#4A5568]">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {notifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <SignOutButton variant="ghost" size="icon" className="text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5" />
            </div>
          )}
          {!user && (
            <Link to="/auth">
              <Button size="sm" className="bg-[#FFD966] text-[#1A1A2E] hover:bg-[#FFC107] border border-[#0057A3]/30 shadow-sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Decorative background elements - updated blue */}
        <div className="absolute top-20 left-0 w-64 h-64 bg-[#0057A3]/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-20 right-0 w-80 h-80 bg-[#B43B3B]/5 rounded-full blur-3xl -z-10"></div>
        
        {/* Header Section with Propose Org Button */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#0057A3]/10 rounded-full blur-2xl"></div>
            <h1 className="mb-2 text-3xl font-bold text-[#1A1A2E] flex items-center gap-2">
              <Compass className="h-8 w-8 text-[#0057A3]" />
              Explore Organizations
            </h1>
            <p className="text-[#4A5568]">
              {isAdmin || isSAO 
                ? "Manage and oversee all student organizations"
                : "Discover student organizations at iAcademy"}
            </p>
          </div>
          
          {/* Propose Org Button - Always visible when logged in */}
          {user && (
            <Link to="/create-organization">
              <Button size="lg" className="gap-2 bg-[#FFD966] text-[#1A1A2E] hover:bg-[#FFC107] border border-[#0057A3]/30 shadow-sm hover:shadow-md transition-all">
                <PlusCircle className="h-5 w-5" />
                Request New Organization
              </Button>
            </Link>
          )}
        </div>

        {/* Stats badges with depth - updated blue */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-[#0057A3]/30 text-[#1A1A2E] bg-white/80 backdrop-blur-sm">
            {organizations.length} total organizations
          </Badge>
          <Badge variant="secondary" className="bg-[#0057A3]/5 text-[#0057A3] border-[#0057A3]/30">
            <School className="mr-1 h-3 w-3" />
            {organizations.filter(o => o.is_shs_org).length} SHS
          </Badge>
          <Badge variant="outline" className="border-[#B43B3B]/30 text-[#B43B3B] bg-white/80 backdrop-blur-sm">
            <GraduationCap className="mr-1 h-3 w-3" />
            {organizations.filter(o => !o.is_shs_org).length} College
          </Badge>
          {isStudent && (
            <Badge variant="default" className="bg-[#FFD966] text-[#1A1A2E] border border-[#0057A3]/30 gap-1 shadow-sm">
              <UserCheck className="mr-1 h-3 w-3" />
              {organizations.filter(o => o.membershipStatus === "accepted").length} Joined
            </Badge>
          )}
        </div>

        {/* Search Bar with depth - updated blue */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4A5568]" />
            <Input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm focus-visible:ring-[#FFD966] shadow-sm"
            />
          </div>
        </div>

        {/* Tab Filters with depth - updated blue */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabFilter)} className="w-full">
            <TabsList className={`grid w-full ${isStudent ? 'grid-cols-4' : 'grid-cols-3'} max-w-2xl mx-auto bg-[#E1E8F0]/80 backdrop-blur-sm border border-[#0057A3]/30 p-1`}>
              <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-[#0057A3] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="shs" className="gap-2 data-[state=active]:bg-[#0057A3] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <School className="h-4 w-4" />
                SHS
              </TabsTrigger>
              <TabsTrigger value="college" className="gap-2 data-[state=active]:bg-[#0057A3] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <GraduationCap className="h-4 w-4" />
                College
              </TabsTrigger>
              {isStudent && (
                <TabsTrigger value="myorgs" className="gap-2 data-[state=active]:bg-[#0057A3] data-[state=active]:text-white data-[state=active]:shadow-sm">
                  <UserCheck className="h-4 w-4" />
                  My Orgs
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-[#4A5568]">
          Showing {filteredOrgs.length} {filteredOrgs.length === 1 ? 'organization' : 'organizations'}
        </div>

        {/* Organizations Grid - untouched below here except removing yellow dot */}
        {filteredOrgs.length === 0 ? (
          <div className="py-12 text-center bg-white/80 backdrop-blur-sm border border-[#0057A3]/30 rounded-lg shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-[#E1E8F0]/80 p-4 border border-[#0057A3]/30">
                <Users className="h-8 w-8 text-[#4A5568]" />
              </div>
            </div>
            <p className="text-lg font-medium text-[#1A1A2E]">
              {searchQuery
                ? "No organizations found matching your search"
                : `No ${activeTab === 'shs' ? 'SHS' : activeTab === 'college' ? 'College' : ''} organizations available yet`}
            </p>
            <p className="mt-2 text-sm text-[#4A5568]">
              Check back later for new organizations
            </p>
            {user && (
              <Link to="/create-organization" className="mt-4 inline-block">
                <Button variant="outline" className="gap-2 border border-[#0057A3]/30 text-[#1A1A2E] hover:bg-[#0057A3]/5">
                  <PlusCircle className="h-4 w-4" />
                  Request a New Organization
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => {
              const canJoin = isJoinable(org);
              const manage = canManageOrg(org);
              const isMember = org.membershipStatus === "accepted" && isStudent;
              const isPending = org.membershipStatus === "pending" && isStudent;

              return (
                <Card key={org.id} className="group transition-all hover:shadow-lg relative flex flex-col h-full border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm hover:bg-white overflow-hidden">
                  {/* Decorative corner accent - updated blue */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#0057A3]/5 to-transparent rounded-bl-full"></div>
                  
                  {/* Level badge - updated blue */}
                  <div className="absolute top-2 left-2 z-10">
                    {org.is_shs_org ? (
                      <Badge variant="secondary" className="bg-[#0057A3]/5 text-[#0057A3] border-[#0057A3]/30 gap-1">
                        <School className="h-3 w-3" />
                        SHS
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-[#B43B3B]/30 text-[#B43B3B] bg-white/80 gap-1">
                        <GraduationCap className="h-3 w-3" />
                        College
                      </Badge>
                    )}
                  </div>

                  {/* Status badges */}
                  {isStudent && (
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                      {isMember && !manage && (
                        <Badge variant="outline" className="bg-[#FFD966]/10 text-[#1A1A2E] border-[#FFD966]/50">
                          Member
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="outline" className="bg-[#B43B3B]/5 text-[#B43B3B] border-[#B43B3B]/30">
                          Pending
                        </Badge>
                      )}
                      {manage && (
                        <Badge variant="default" className="bg-[#FFD966] text-[#1A1A2E] border border-[#0057A3]/30 gap-1 shadow-sm">
                          <Settings className="h-3 w-3" />
                          {org.membershipRole === "leader" ? "Leader" : "Officer"}
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex justify-center pt-6">
                      <div className="relative">
                        <OrgLogo 
                          src={org.profile_picture} 
                          alt={org.name} 
                          size="lg" 
                          className="border border-[#0057A3]/30 rounded-xl"
                        />
                        {/* Removed the yellow dot here */}
                      </div>
                    </div>
                    <CardTitle className="line-clamp-1 text-center mt-2 text-[#1A1A2E]">
                      {org.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-center text-[#4A5568]">
                      {org.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col gap-3 mt-auto pt-2">
                    <Link to={`/org/${org.id}`} className="w-full">
                      <Button variant="outline" className="w-full border border-[#0057A3]/30 text-[#1A1A2E] hover:bg-[#0057A3]/5 hover:border-[#0057A3]/50">
                        View Organization
                      </Button>
                    </Link>

                    {manage && (
                      <Link to={`/org/${org.id}/manage`} className="relative w-full">
                        <Button variant="secondary" className="w-full gap-2 relative">
                          <Settings className="h-4 w-4" />
                          Manage
                          {pendingCounts[org.id] > 0 && (
                            <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                              {pendingCounts[org.id] > 9 ? '9+' : pendingCounts[org.id]}
                            </span>
                          )}
                        </Button>
                      </Link>
                    )}

                    {isStudent && !manage && !isMember && !isPending && canJoin ? (
                      <Button 
                        className="w-full bg-[#0057A3] text-white hover:bg-[#0057A3]/90 shadow-sm" 
                        onClick={() => handleJoinOrg(org.id)}
                      >
                        Join Organization
                      </Button>
                    ) : null}

                    {!user && (
                      <Button 
                        variant="default" 
                        className="w-full bg-[#0057A3] text-white hover:bg-[#0057A3]/90 shadow-sm"
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

      {/* Footer - Dark Navy from Landing Page */}
      <footer className="mt-12 bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-[#0057A3]/20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-[#FCF9F5]/60">
            <p>© 2026 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Explore;