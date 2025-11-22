import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, Users, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
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
  const { user, signOut } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
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
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your organizations
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Recent Announcements
              </CardTitle>
              <CardDescription>Latest updates from your organizations</CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No announcements yet</p>
                  <Link to="/explore" className="mt-2 inline-block">
                    <Button variant="link" size="sm">
                      Join organizations to see announcements
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-foreground">
                          {announcement.title}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(announcement.created_at), "MMM d")}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      <p className="text-xs font-medium text-primary">
                        {announcement.organizations.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Don't miss these events</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No upcoming events</p>
                  <Link to="/explore" className="mt-2 inline-block">
                    <Button variant="link" size="sm">
                      Join organizations to see events
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-foreground">{event.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.event_date), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-primary">
                          {event.organizations.name}
                        </span>
                        {event.location && (
                          <span className="text-muted-foreground">{event.location}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
