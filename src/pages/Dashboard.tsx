import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Bell, Calendar, Users, Shield, Plus, User, ExternalLink, Heart, MessageCircle, MapPin, Clock, Search, X, ChevronDown, ChevronUp, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import { SignOutButton } from "@/components/SignOutButton";
import { CommentSection } from "@/components/CommentSection";
import { NotificationItem } from "@/components/NotificationItem";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  org_id: string;
  organizations: {
    name: string;
    profile_picture: string | null;
  } | null;
}

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  org_id: string;
  organizations: {
    name: string;
    profile_picture: string | null;
  } | null;
}

interface LikeState {
  count: number;
  userLiked: boolean;
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

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, isSAO } = useUserRole();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  
  // Event modal state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchNotifications();
      setupRealtimeSubscription();
      setupNotificationsSubscription();
    }
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

      if (orgIds.length === 0) {
        setAnnouncements([]);
        setEvents([]);
        setLoading(false);
        return;
      }

      // Fetch announcements from joined orgs
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
        .limit(50);

      const validAnnouncements = announcementsData?.filter(a => a.organizations !== null) || [];
      setAnnouncements(validAnnouncements);

      // Fetch comment counts and likes for each announcement
      const counts: Record<string, number> = {};
      const likesData: Record<string, LikeState> = {};
      
      await Promise.all(
        validAnnouncements.map(async (a) => {
          const { count: commentCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("announcement_id", a.id);
          counts[a.id] = commentCount || 0;

          const { count: likeCount } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("announcement_id", a.id);

          const { data: userLike } = await supabase
            .from("likes")
            .select("id")
            .eq("announcement_id", a.id)
            .eq("user_id", user.id)
            .maybeSingle();

          likesData[a.id] = {
            count: likeCount || 0,
            userLiked: !!userLike
          };
        })
      );
      
      setCommentCounts(counts);
      setLikes(likesData);

      // Fetch upcoming events (future dates only)
      const now = new Date().toISOString();
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
        .gte("event_date", now)
        .eq("status", "approved")
        .order("event_date", { ascending: true })
        .limit(5);

      setEvents(eventsData?.filter(e => e.organizations !== null) || []);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      
      // Transform the data with proper type casting
      const transformedNotifications: Notification[] = (data || []).map(item => ({
        id: item.id,
        type: item.type as Notification['type'], // Cast to the correct type
        title: item.title,
        message: item.message,
        data: item.data as Notification['data'], // Cast data
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          if (payload.new && 'announcement_id' in payload.new) {
            const announcementId = payload.new.announcement_id as string;
            fetchCommentCount(announcementId);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        (payload) => {
          if (payload.new && 'announcement_id' in payload.new) {
            const announcementId = payload.new.announcement_id as string;
            fetchLikeData(announcementId);
          } else if (payload.old && 'announcement_id' in payload.old) {
            const announcementId = payload.old.announcement_id as string;
            fetchLikeData(announcementId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const setupNotificationsSubscription = () => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const newItem = payload.new as any;
          const newNotification: Notification = {
            id: newItem.id,
            type: newItem.type as Notification['type'], // Cast to the correct type
            title: newItem.title,
            message: newItem.message,
            data: newItem.data as Notification['data'], // Cast data
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

  const fetchCommentCount = async (announcementId: string) => {
    const { count } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("announcement_id", announcementId);
    
    setCommentCounts(prev => ({
      ...prev,
      [announcementId]: count || 0
    }));
  };

  const fetchLikeData = async (announcementId: string) => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("announcement_id", announcementId);

      const { data: userLike } = await supabase
        .from("likes")
        .select("id")
        .eq("announcement_id", announcementId)
        .eq("user_id", user.id)
        .maybeSingle();

      setLikes(prev => ({
        ...prev,
        [announcementId]: {
          count: count || 0,
          userLiked: !!userLike
        }
      }));
    } catch (error) {
      console.error("Error fetching like data:", error);
    }
  };

  const toggleLike = async (announcementId: string) => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    const currentLike = likes[announcementId];
    
    try {
      if (currentLike?.userLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("announcement_id", announcementId)
          .eq("user_id", user.id);

        if (error) throw error;

        setLikes(prev => ({
          ...prev,
          [announcementId]: {
            count: (prev[announcementId]?.count || 1) - 1,
            userLiked: false
          }
        }));
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({
            announcement_id: announcementId,
            user_id: user.id
          });

        if (error) throw error;

        setLikes(prev => ({
          ...prev,
          [announcementId]: {
            count: (prev[announcementId]?.count || 0) + 1,
            userLiked: true
          }
        }));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const toggleComments = (announcementId: string) => {
    setOpenComments(prev => ({
      ...prev,
      [announcementId]: !prev[announcementId]
    }));
  };

  const toggleDescription = (announcementId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [announcementId]: !prev[announcementId]
    }));
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleOrgClick = (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/org/${orgId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateText = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const isPastEvent = (eventDate: string) => {
    return new Date(eventDate) < new Date();
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
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-50 to-white border-b shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img 
                src="/logo.svg" 
                alt="logo" 
                className="h-8 w-auto md:h-10"
              />
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">iJoin</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/explore">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-1"/>
                Explore
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </Link>
            <Link to="/create-organization">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Request org
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark all as read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[500px]">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
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
            <Link to="/profile">
              <Button variant="ghost" size="icon" title="Profile">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <SignOutButton variant="ghost" size="icon" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome back, {profile?.name || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600">
            Latest updates from your organizations
          </p>
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
          {/* Main Content - Feed */}
          <div className="lg:col-span-2 space-y-6">
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Join organizations or check back later for updates
                  </p>
                  <Link to="/explore">
                    <Button>Explore Organizations</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              announcements.map((announcement) => {
                const org = announcement.organizations;
                const orgName = org?.name || 'Unknown Organization';
                const orgProfilePic = org?.profile_picture || null;
                const likeData = likes[announcement.id] || { count: 0, userLiked: false };
                const isExpanded = expandedDescriptions[announcement.id] || false;
                const displayContent = isExpanded 
                  ? announcement.content 
                  : truncateText(announcement.content, 300);

                return (
                  <Card key={announcement.id} className="overflow-hidden">
                    {/* Post Header */}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={orgProfilePic || undefined} />
                          <AvatarFallback>{orgName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{orgName}</CardTitle>
                          <CardDescription>
                            {format(new Date(announcement.created_at), "MMM d 'at' h:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Title */}
                      <h3 className="font-semibold text-lg">{announcement.title}</h3>
                      
                      {/* Image */}
                      {announcement.image_url && (
                        <div className="rounded-lg overflow-hidden bg-muted/20">
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Description */}
                      <div className="space-y-2">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {displayContent}
                        </p>
                        {announcement.content.length > 300 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-primary"
                            onClick={() => toggleDescription(announcement.id)}
                          >
                            {isExpanded ? (
                              <>Show less <ChevronUp className="ml-1 h-4 w-4" /></>
                            ) : (
                              <>Read more <ChevronDown className="ml-1 h-4 w-4" /></>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center gap-4 pt-4 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`gap-2 ${likeData.userLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                          onClick={() => toggleLike(announcement.id)}
                        >
                          <Heart className={`h-4 w-4 ${likeData.userLiked ? 'fill-current' : ''}`} />
                          <span>{likeData.count}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-muted-foreground"
                          onClick={() => toggleComments(announcement.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{commentCounts[announcement.id] || 0}</span>
                        </Button>
                      </div>

                      {/* Comments Section */}
                      {openComments[announcement.id] && (
                        <div className="border-t pt-4">
                          <CommentSection 
                            announcementId={announcement.id} 
                            orgId={announcement.org_id}
                            onCommentAdded={() => fetchCommentCount(announcement.id)}
                            userAvatar={profile?.profile_picture}
                            userInitials={profile?.name ? getInitials(profile.name) : user?.email?.charAt(0).toUpperCase()}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.profile_picture || undefined} />
                    <AvatarFallback>
                      {profile?.name ? getInitials(profile.name) : user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{profile?.name || user?.email?.split('@')[0]}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <SignOutButton variant="outline" className="w-full" />
              </CardContent>
            </Card>

            {/* Upcoming Events Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Events from your organizations</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="py-6 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => {
                      const org = event.organizations;
                      const orgName = org?.name || 'Unknown Organization';
                      const eventDate = new Date(event.event_date);
                      
                      return (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="w-full text-left group rounded-lg border p-3 hover:border-primary hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            {/* Date Box */}
                            <div className="min-w-12 rounded-lg bg-primary/10 p-2 text-center border border-primary/20">
                              <div className="text-sm font-bold text-primary">
                                {format(eventDate, "d")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(eventDate, "MMM")}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {event.name}
                              </h4>
                              
                              {/* Date & Time */}
                              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(eventDate, "h:mm a")}
                              </div>
                              
                              {/* Organization Name */}
                              <p className="mt-2 text-xs text-primary font-medium truncate">
                                {orgName}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/explore">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Explore Organizations
                  </Button>
                </Link>
                <Link to="/calendar">
                  <Button variant="ghost" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar View
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    Your Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <DialogTitle className="text-xl font-bold">Event Details</DialogTitle>
          </div>

          {selectedEvent && selectedEvent.organizations && (
            <>
              {/* Organization Header - Clickable */}
              <div 
                onClick={(e) => handleOrgClick(selectedEvent.org_id, e)}
                className="px-6 py-3 bg-muted/20 border-y hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={selectedEvent.organizations.profile_picture || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedEvent.organizations.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{selectedEvent.organizations.name}</p>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Click to view organization</p>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6 space-y-6">
                {/* Event Name */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{selectedEvent.name}</h3>
                  {isPastEvent(selectedEvent.event_date) && (
                    <Badge variant="outline" className="mt-2">Past Event</Badge>
                  )}
                </div>

                {/* Date, Time, Location Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(new Date(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{format(new Date(selectedEvent.event_date), "h:mm a")}</span>
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</p>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</p>
                    <div className="bg-muted/20 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;