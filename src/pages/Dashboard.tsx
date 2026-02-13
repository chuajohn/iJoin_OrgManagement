import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Calendar, Users, LogOut, Shield, Plus, User, ExternalLink, Heart, MessageCircle, Bookmark, MoreHorizontal, MapPin, Clock, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import { SignOutButton } from "@/components/SignOutButton";

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  organizations: {
    name: string;
    profile_picture: string | null;
  } | null; // 👈 Make nullable
}

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  organizations: {
    name: string;
    profile_picture: string | null;
  } | null; // 👈 Make nullable
}

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin, isSAO } = useUserRole();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    setupRealtimeSubscription();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user's joined organizations
      const { data: memberships } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      const orgIds = memberships?.map((m) => m.org_id) || [];

      // If no orgs, set empty arrays and return early
      if (orgIds.length === 0) {
        setAnnouncements([]);
        setEvents([]);
        setLoading(false);
        return;
      }

      // Fetch announcements from joined orgs WITH organization profile_picture
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select(`
          *,
          organizations!announcements_org_id_fkey (
            name,
            profile_picture
          )
        `)
        .in("org_id", orgIds)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch upcoming events from joined orgs WITH organization profile_picture
      const { data: eventsData } = await supabase
        .from("events")
        .select(`
          *,
          organizations!events_org_id_fkey (
            name,
            profile_picture
          )
        `)
        .in("org_id", orgIds)
        .gte("event_date", new Date().toISOString())
        .eq("status", "approved")
        .order("event_date", { ascending: true })
        .limit(5);

      // ✅ Filter out items with null organizations
      setAnnouncements(announcementsData?.filter(a => a.organizations !== null) || []);
      setEvents(eventsData?.filter(e => e.organizations !== null) || []);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("dashboard-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => fetchDashboardData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with simple color accents */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-50 to-white border-b shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-400">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">iJoin</span>
              <span className="ml-2 text-sm text-blue-600 font-medium">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/explore">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              >
                Explore
              </Button>
            </Link>
            <Link to="/calendar">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link to="/create-organization">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Org
              </Button>
            </Link>
            {(isAdmin || isSAO) && (
              <Link to="/admin">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 relative"
                >
                  <Bell className="h-5 w-5" />
                  {(announcements.length > 0 || events.length > 0) && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 border-gray-200 shadow-lg" align="end">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <Separator />
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {announcements.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Announcements</h4>
                          <div className="space-y-2">
                            {announcements.slice(0, 3).map((announcement) => {
                              // ✅ Safe access with fallbacks
                              const orgName = announcement.organizations?.name || 'Unknown Organization';
                              return (
                                <div key={announcement.id} className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="text-sm font-semibold text-gray-900">{announcement.title}</p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {announcement.content}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-blue-600 font-medium">
                                      {orgName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(announcement.created_at), "MMM d")}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {events.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Upcoming Events</h4>
                          <div className="space-y-2">
                            {events.slice(0, 3).map((event) => {
                              // ✅ Safe access with fallbacks
                              const orgName = event.organizations?.name || 'Unknown Organization';
                              return (
                                <div key={event.id} className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="text-sm font-semibold text-gray-900">{event.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {format(new Date(event.event_date), "MMM d, h:mm a")}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-blue-600 font-medium">
                                      {orgName}
                                    </span>
                                    {event.location && (
                                      <span className="text-xs text-gray-500">{event.location}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {announcements.length === 0 && events.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8">No recent notifications</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
            <Link to="/profile">
              <Button 
                variant="ghost" 
                size="icon" 
                title="Profile"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <SignOutButton 
              variant="ghost" 
              size="icon" 
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Clean Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome back, {profile?.name || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600">
            Latest updates from your organizations
          </p>
          {/* Simple stats */}
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{announcements.length}</div>
              <div className="text-sm text-gray-500">Announcements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{events.length}</div>
              <div className="text-sm text-gray-500">Upcoming Events</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Instagram-like feed (2/3 width) */}
          <div className="lg:col-span-2">
            {announcements.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No announcements yet</h3>
                <p className="mb-4 text-gray-600">
                  Join organizations or check back later for updates
                </p>
                <Link to="/explore">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Explore Organizations
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {announcements.map((announcement) => {
                  // ✅ SAFE - Extract with null checks
                  const org = announcement.organizations;
                  const orgName = org?.name || 'Unknown Organization';
                  const orgProfilePic = org?.profile_picture || null;
                  
                  return (
                    <div key={announcement.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      {/* Post Header */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage 
                              src={orgProfilePic || undefined}
                              alt={orgName}
                              onError={(e) => {
                                console.log(`Failed to load profile picture for ${orgName}:`, orgProfilePic);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <AvatarFallback className="bg-gray-100 text-gray-700">
                              {orgName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {orgName}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {format(new Date(announcement.created_at), "MMM d 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-700">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Announcement Title */}
                      <div className="px-4 pb-3">
                        <h2 className="text-lg font-bold text-gray-900">
                          {announcement.title}
                        </h2>
                      </div>

                      {/* Announcement Image */}
                      {announcement.image_url && (
                        <div className="bg-gray-50">
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full max-h-[500px] object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                            <Heart className="h-6 w-6" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-500">
                            <MessageCircle className="h-6 w-6" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-500">
                            <Share2 className="h-6 w-6" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-500">
                          <Bookmark className="h-6 w-6" />
                        </Button>
                      </div>

                      {/* Announcement Content */}
                      <div className="px-4 pb-4">
                        <div className="mb-3">
                          <span className="font-semibold text-gray-900 mr-2">
                            {orgName}
                          </span>
                          <span className="text-gray-700">{announcement.content}</span>
                        </div>
                        
                        {/* View Comments/Likes */}
                        <div className="mb-3 text-sm text-gray-500">
                          <button className="hover:text-gray-700">View all comments</button>
                          <span className="mx-2">•</span>
                          <span>42 likes</span>
                        </div>
                        
                        {/* Add Comment */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gray-100 text-gray-700">
                              {(profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              className="w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-0 placeholder-gray-400"
                            />
                          </div>
                          <Button variant="link" className="h-auto p-0 text-sm text-blue-600 font-medium">
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar - Fixed column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* User Profile Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                    <AvatarImage src={profile?.profile_picture || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {profile?.name || user?.email?.split('@')[0] || 'User'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {profile?.email || user?.email || ''}
                    </p>
                  </div>
                </div>
                <SignOutButton 
                  variant="outline"
                  className="mt-4 w-full border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  showIcon
                  showText
                  text="Log Out"
                  iconPosition="left"
                />
              </div>

              {/* Upcoming Events Card */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-900">Upcoming Events</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">Events from your organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="py-6 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Calendar className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        No upcoming events
                      </p>
                      <Link to="/explore">
                        <Button variant="outline" size="sm" className="border-gray-300">
                          Find Events
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event) => {
                        // ✅ SAFE - Extract with null checks
                        const org = event.organizations;
                        const orgName = org?.name || 'Unknown Organization';
                        const orgProfilePic = org?.profile_picture || null;
                        
                        return (
                          <Link 
                            key={event.id} 
                            to={`/event/${event.id}`}
                            className="block"
                          >
                            <div className="group rounded-lg border border-gray-200 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/30">
                              <div className="flex items-start gap-3">
                                <div className="min-w-12 rounded-lg bg-blue-50 p-2 text-center border border-blue-100">
                                  <div className="text-sm font-bold text-blue-600">
                                    {format(new Date(event.event_date), "d")}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {format(new Date(event.event_date), "MMM")}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {event.name}
                                  </h4>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {format(new Date(event.event_date), "h:mm a")}
                                    </div>
                                    {event.location && (
                                      <>
                                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          <span className="truncate">{event.location}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <p className="mt-2 text-xs text-blue-600 font-medium truncate">
                                    {orgProfilePic ? (
                                      <span className="flex items-center gap-1">
                                        <img 
                                          src={orgProfilePic} 
                                          alt={orgName}
                                          className="h-3 w-3 rounded-full mr-1"
                                          onError={(e) => {
                                            console.log(`Failed to load org picture for event: ${orgName}`);
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                        {orgName}
                                      </span>
                                    ) : (
                                      orgName
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      
                      {events.length > 0 && (
                        <Link to="/calendar">
                          <Button variant="ghost" className="w-full mt-2" size="sm">
                            <span className="text-blue-600 font-medium">
                              View All Events
                            </span>
                            <ExternalLink className="ml-2 h-3 w-3 text-blue-600" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="mb-3 font-semibold text-sm text-gray-900">Quick Links</h4>
                <div className="space-y-2">
                  <Link to="/explore">
                    <Button variant="ghost" className="w-full justify-start hover:bg-gray-50" size="sm">
                      <Users className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Explore Organizations</span>
                    </Button>
                  </Link>
                  <Link to="/calendar">
                    <Button variant="ghost" className="w-full justify-start hover:bg-gray-50" size="sm">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Calendar View</span>
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="ghost" className="w-full justify-start hover:bg-gray-50" size="sm">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Your Profile</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>© 2024 iJoin - iACADEMY Student Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;