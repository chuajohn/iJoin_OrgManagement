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

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  organizations: {
    name: string;
  };
}

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  organizations: {
    name: string;
  };
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

      // Fetch announcements from joined orgs
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*, organizations(name)")
        .in("org_id", orgIds)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch upcoming events from joined orgs
      const { data: eventsData } = await supabase
        .from("events")
        .select("*, organizations(name)")
        .in("org_id", orgIds)
        .gte("event_date", new Date().toISOString())
        .eq("status", "approved")
        .order("event_date", { ascending: true })
        .limit(5);

      setAnnouncements(announcementsData || []);
      setEvents(eventsData || []);
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
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 bg-blue-500">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">iJoin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/explore">
              <Button variant="ghost" size="sm">
                Explore
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link to="/create-organization">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Org
              </Button>
            </Link>
            {(isAdmin || isSAO) && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Link to="/profile">
              <Button variant="ghost" size="icon" title="Profile">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {(announcements.length > 0 || events.length > 0) && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <Separator />
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {announcements.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Announcements</h4>
                          <div className="space-y-2">
                            {announcements.slice(0, 3).map((announcement) => (
                              <div key={announcement.id} className="rounded-lg border bg-card p-3">
                                <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {announcement.content}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-primary">{announcement.organizations.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(announcement.created_at), "MMM d")}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {events.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Upcoming Events</h4>
                          <div className="space-y-2">
                            {events.slice(0, 3).map((event) => (
                              <div key={event.id} className="rounded-lg border bg-card p-3">
                                <p className="text-sm font-semibold text-foreground">{event.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(event.event_date), "MMM d, h:mm a")}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-primary">{event.organizations.name}</span>
                                  {event.location && (
                                    <span className="text-xs text-muted-foreground">{event.location}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {announcements.length === 0 && events.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No recent notifications</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-foreground">
            Welcome back, {profile?.name || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Latest updates from your organizations
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Instagram-like feed (2/3 width) */}
          <div className="lg:col-span-2">
            {announcements.length === 0 ? (
              <div className="rounded-xl border bg-white p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No announcements yet</h3>
                <p className="mb-4 text-muted-foreground">
                  Join organizations or check back later for updates
                </p>
                <Link to="/explore">
                  <Button>Explore Organizations</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    {/* Post Header */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-light/20">
                            {announcement.organizations.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {announcement.organizations.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(announcement.created_at), "MMM d 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Announcement Title */}
                    <div className="px-4 pb-3">
                      <h2 className="text-lg font-bold text-foreground">
                        {announcement.title}
                      </h2>
                    </div>

                    {/* Announcement Image - Full view without cropping */}
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
                        <Button variant="ghost" size="icon">
                          <Heart className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-6 w-6" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Bookmark className="h-6 w-6" />
                      </Button>
                    </div>

                    {/* Announcement Content */}
                    <div className="px-4 pb-4">
                      <div className="mb-3">
                        <span className="font-semibold text-foreground mr-2">
                          {announcement.organizations.name}
                        </span>
                        <span className="text-foreground">{announcement.content}</span>
                      </div>
                      
                      {/* View Comments/Likes (Placeholder) */}
                      <div className="mb-3 text-sm text-muted-foreground">
                        <button className="hover:text-foreground">View all comments</button>
                        <span className="mx-2">•</span>
                        <span>42 likes</span>
                      </div>
                      
                      {/* Add Comment (Placeholder) */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            className="w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                          />
                        </div>
                        <Button variant="link" className="h-auto p-0 text-sm text-primary">
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Events (1/3 width, minimal like Instagram sidebar) */}
          <div className="lg:col-span-1">
            {/* User Profile Card */}
            <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                  <AvatarImage src={profile?.profile_picture} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-white">
                    {profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {profile?.name || user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.email || user?.email || ''}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>

            {/* Upcoming Events Card */}
            <Card className="sticky top-24 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Events from your organizations</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Calendar className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      No upcoming events
                    </p>
                    <Link to="/explore">
                      <Button variant="outline" size="sm">
                        Find Events
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <Link 
                        key={event.id} 
                        to={`/event/${event.id}`}
                        className="block"
                      >
                        <div className="group rounded-lg border border-transparent p-3 transition-all hover:border-primary/20 hover:bg-accent/5">
                          <div className="flex items-start gap-3">
                            <div className="min-w-12 rounded-lg bg-primary/10 p-2 text-center">
                              <div className="text-sm font-bold text-primary">
                                {format(new Date(event.event_date), "d")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(event.event_date), "MMM")}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">
                                {event.name}
                              </h4>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(event.event_date), "h:mm a")}
                                </div>
                                {event.location && (
                                  <>
                                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              <p className="mt-2 text-xs text-primary font-medium truncate">
                                {event.organizations.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    {events.length > 0 && (
                      <Link to="/calendar">
                        <Button variant="ghost" className="w-full mt-2" size="sm">
                          View All Events
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
              <h4 className="mb-3 font-semibold text-sm">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/explore">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Explore Organizations
                  </Button>
                </Link>
                <Link to="/calendar">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar View
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    Your Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>© 2024 iJoin. All rights reserved.</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <Link to="/about" className="hover:text-primary">About</Link>
                <Link to="/help" className="hover:text-primary">Help</Link>
                <Link to="/privacy" className="hover:text-primary">Privacy</Link>
                <Link to="/terms" className="hover:text-primary">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;