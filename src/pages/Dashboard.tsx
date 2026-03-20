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
import { Bell, Calendar, Users, Shield, Plus, User, ExternalLink, Heart, MessageCircle, MapPin, Clock, Search, X, ChevronDown, ChevronUp, CheckCheck, Award, Crown, Star, Medal, Gem, Sparkles, Waves, Wind, Leaf, Fish, Cherry, Mountain, Cloud, Sun, Moon, Droplets, Flower, TreePine, Bird, Rabbit, Turtle, Shell } from "lucide-react";
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

interface Membership {
  id: string;
  role: string;
  organizations: {
    id: string;
    name: string;
  };
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, isSAO, isSHSStudent, isUGStudent } = useUserRole();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [memberships, setMemberships] = useState<Membership[]>([]);
  
  // Event modal state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchNotifications();
      fetchMemberships();
      setupRealtimeSubscription();
      setupNotificationsSubscription();
    }
  }, [user]);

  const fetchMemberships = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select(`
          id,
          role,
          organizations (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (error) throw error;
      setMemberships(data || []);
    } catch (error) {
      console.error("Error fetching memberships:", error);
    }
  };

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

  // EXPANDED floating Japanese elements - 35 icons with better visibility
  const japaneseElements = [
    // Blue theme (Waves, Fish, Mountain, Droplets, Shell)
    { Icon: Waves, color: "#0057A3", top: "8%", left: "7%", delay: "0s", size: 28 },
    { Icon: Fish, color: "#0057A3", top: "16%", right: "12%", delay: "0.8s", size: 26 },
    { Icon: Mountain, color: "#0057A3", top: "24%", left: "15%", delay: "1.5s", size: 32 },
    { Icon: Droplets, color: "#0057A3", top: "32%", right: "18%", delay: "2.2s", size: 24 },
    { Icon: Shell, color: "#0057A3", top: "40%", left: "8%", delay: "2.9s", size: 26 },
    { Icon: Waves, color: "#0057A3", top: "48%", right: "8%", delay: "3.5s", size: 30 },
    { Icon: Fish, color: "#0057A3", top: "56%", left: "18%", delay: "4.2s", size: 25 },
    { Icon: Mountain, color: "#0057A3", top: "64%", right: "15%", delay: "4.9s", size: 28 },
    { Icon: Droplets, color: "#0057A3", top: "72%", left: "12%", delay: "5.5s", size: 22 },
    { Icon: Shell, color: "#0057A3", top: "80%", right: "10%", delay: "6.2s", size: 24 },
    
    // Red theme (Wind, Gem, Cloud, Flower, Bird)
    { Icon: Wind, color: "#B43B3B", top: "5%", right: "8%", delay: "0.3s", size: 30 },
    { Icon: Gem, color: "#B43B3B", top: "14%", left: "12%", delay: "1.1s", size: 28 },
    { Icon: Cloud, color: "#B43B3B", top: "22%", right: "15%", delay: "1.8s", size: 32 },
    { Icon: Flower, color: "#B43B3B", top: "30%", left: "20%", delay: "2.5s", size: 26 },
    { Icon: Bird, color: "#B43B3B", top: "38%", right: "10%", delay: "3.2s", size: 24 },
    { Icon: Wind, color: "#B43B3B", top: "46%", left: "5%", delay: "3.9s", size: 29 },
    { Icon: Gem, color: "#B43B3B", top: "54%", right: "20%", delay: "4.5s", size: 27 },
    { Icon: Cloud, color: "#B43B3B", top: "62%", left: "16%", delay: "5.2s", size: 31 },
    { Icon: Flower, color: "#B43B3B", top: "70%", right: "12%", delay: "5.9s", size: 25 },
    { Icon: Bird, color: "#B43B3B", top: "78%", left: "10%", delay: "6.5s", size: 23 },
    
    // Yellow theme (Leaf, Cherry, Sun, Star, Sparkles)
    { Icon: Leaf, color: "#FFD966", top: "10%", left: "20%", delay: "0.5s", size: 27 },
    { Icon: Cherry, color: "#FFD966", top: "18%", right: "5%", delay: "1.3s", size: 29 },
    { Icon: Sun, color: "#FFD966", top: "26%", left: "10%", delay: "2.0s", size: 34 },
    { Icon: Star, color: "#FFD966", top: "34%", right: "22%", delay: "2.7s", size: 26 },
    { Icon: Sparkles, color: "#FFD966", top: "42%", left: "22%", delay: "3.4s", size: 28 },
    { Icon: Leaf, color: "#FFD966", top: "50%", right: "5%", delay: "4.1s", size: 25 },
    { Icon: Cherry, color: "#FFD966", top: "58%", left: "14%", delay: "4.8s", size: 27 },
    { Icon: Sun, color: "#FFD966", top: "66%", right: "18%", delay: "5.4s", size: 32 },
    { Icon: Star, color: "#FFD966", top: "74%", left: "8%", delay: "6.1s", size: 24 },
    { Icon: Sparkles, color: "#FFD966", top: "82%", right: "14%", delay: "6.8s", size: 26 },
    
    // Extra scattered small icons
    { Icon: Rabbit, color: "#0057A3", top: "15%", left: "25%", delay: "1.7s", size: 22 },
    { Icon: Turtle, color: "#B43B3B", top: "35%", right: "25%", delay: "2.8s", size: 24 },
    { Icon: TreePine, color: "#FFD966", top: "55%", left: "25%", delay: "3.8s", size: 26 },
    { Icon: Moon, color: "#0057A3", top: "75%", right: "22%", delay: "4.8s", size: 28 },
    { Icon: Cloud, color: "#B43B3B", top: "85%", left: "20%", delay: "5.8s", size: 30 },
  ];

  // Debug logging
  useEffect(() => {
    console.log("Dashboard - User:", user?.id);
    console.log("Dashboard - Profile:", profile);
    console.log("Dashboard - isAdmin:", isAdmin);
    console.log("Dashboard - isSAO:", isSAO);
  }, [user, profile, isAdmin, isSAO]);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Profile button clicked - navigating to /profile");
    navigate("/profile");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0057A3] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5 relative overflow-hidden">
      {/* Floating Japanese Elements - Dense and Visible */}
      {japaneseElements.map((item, index) => {
        const IconComponent = item.Icon;
        return (
          <div
            key={index}
            className="absolute pointer-events-none animate-float-playful"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              animationDelay: item.delay,
              animationDuration: "10s",
              opacity: 0.35,
              zIndex: 0,
            }}
          >
            <IconComponent 
              size={item.size} 
              color={item.color}
              strokeWidth={1.2}
            />
          </div>
        );
      })}

      {/* Header - with deeper blue */}
      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#0057A3]/30 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
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
          <div className="flex items-center gap-2">
            <Link to="/explore">
              <Button variant="ghost" size="sm" className="text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5">
                <Search className="h-4 w-4 mr-1"/>
                Explore
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5">
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </Link>
            <Link to="/create-organization">
              <Button variant="ghost" size="sm" className="text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5">
                <Plus className="h-4 w-4 mr-1" />
                Request org
              </Button>
            </Link>
            {(isAdmin || isSAO) && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
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
            
            {/* Profile Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              title="Profile"
              className="text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5"
              onClick={handleProfileClick}
            >
              <User className="h-5 w-5" />
            </Button>
            
            <SignOutButton variant="ghost" size="icon" className="text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Welcome Section with subtle depth */}
        <div className="mb-8 relative">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#0057A3]/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#B43B3B]/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <h1 className="mb-2 text-3xl font-bold text-[#1A1A2E]">
              Welcome back, Game Changer!
            </h1>
            <p className="text-[#4A5568]">
              Latest updates from your organizations
            </p>
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-b from-[#0057A3] to-[#0057A3]/70 bg-clip-text text-transparent">
                  {announcements.length}
                </div>
                <div className="text-sm text-[#4A5568]">Announcements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-b from-[#B43B3B] to-[#B43B3B]/70 bg-clip-text text-transparent">
                  {events.length}
                </div>
                <div className="text-sm text-[#4A5568]">Upcoming Events</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Feed */}
          <div className="lg:col-span-2 space-y-6">
            {announcements.length === 0 ? (
              <Card className="border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0057A3]/5 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-[#4A5568]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[#1A1A2E]">No announcements yet</h3>
                  <p className="text-[#4A5568] mb-4">
                    Join organizations or check back later for updates
                  </p>
                  <Link to="/explore">
                    <Button className="bg-[#FFD966] text-[#1A1A2E] hover:bg-[#FFC107] border border-[#0057A3]/30 shadow-sm">
                      Explore Organizations
                    </Button>
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
                  <Card key={announcement.id} className="overflow-hidden border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    {/* Post Header */}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-[#0057A3]/30">
                          <AvatarImage src={orgProfilePic || undefined} />
                          <AvatarFallback className="bg-[#0057A3]/5 text-[#0057A3]">
                            {orgName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base text-[#1A1A2E]">{orgName}</CardTitle>
                          <CardDescription className="text-[#4A5568]">
                            {format(new Date(announcement.created_at), "MMM d 'at' h:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Title */}
                      <h3 className="font-semibold text-lg text-[#1A1A2E]">{announcement.title}</h3>
                      
                      {/* Image */}
                      {announcement.image_url && (
                        <div className="rounded-lg overflow-hidden border border-[#0057A3]/20 bg-[#FCF9F5]">
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Description */}
                      <div className="space-y-2">
                        <p className="text-[#4A5568] whitespace-pre-wrap">
                          {displayContent}
                        </p>
                        {announcement.content.length > 300 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-[#0057A3] hover:text-[#0057A3]/80"
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
                      <div className="flex items-center gap-4 pt-4 border-t border-[#0057A3]/20">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`gap-2 ${likeData.userLiked ? 'text-[#B43B3B]' : 'text-[#4A5568]'} hover:text-[#B43B3B] hover:bg-[#B43B3B]/5`}
                          onClick={() => toggleLike(announcement.id)}
                        >
                          <Heart className={`h-4 w-4 ${likeData.userLiked ? 'fill-[#B43B3B]' : ''}`} />
                          <span>{likeData.count}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5"
                          onClick={() => toggleComments(announcement.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{commentCounts[announcement.id] || 0}</span>
                        </Button>
                      </div>

                      {/* Comments Section */}
                      {openComments[announcement.id] && (
                        <div className="border-t border-[#0057A3]/20 pt-4">
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
            {/* User Profile Card - with medals */}
            <Card className="border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0057A3]/5 to-transparent rounded-bl-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-[#1A1A2E]">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12 border border-[#0057A3]/30">
                    <AvatarImage src={profile?.profile_picture || undefined} />
                    <AvatarFallback className="bg-[#0057A3]/5 text-[#0057A3]">
                      {profile?.name ? getInitials(profile.name) : user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[#1A1A2E]">{profile?.name || user?.email?.split('@')[0]}</p>
                    <p className="text-sm text-[#4A5568]">{profile?.email || user?.email}</p>
                  </div>
                </div>

                {/* Medals Section - left-aligned */}
                <div className="flex items-center gap-3 mt-2">
                  {/* Game Changer Medal - for all users */}
                  <img 
                    src="/medals/game_medal.png" 
                    alt="Game Changer Medal" 
                    className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-default"
                    title="iACADEMY Game Changer"
                  />
                  
                  {/* Admin Medal - only for admins */}
                  {(isAdmin || isSAO) && (
                    <img 
                      src="/medals/admin_medal.png" 
                      alt="Admin Medal" 
                      className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-default"
                      title={isAdmin ? "System Administrator" : "Student Affairs Office"}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events Card - RED THEME with depth */}
            <Card className="border border-[#B43B3B]/30 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#B43B3B]/5 to-transparent rounded-bl-full"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1A1A2E]">
                  <Calendar className="h-5 w-5 text-[#B43B3B]" />
                  Upcoming Events
                </CardTitle>
                <CardDescription className="text-[#4A5568]">Events from your organizations</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#B43B3B]/5 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-[#4A5568]" />
                    </div>
                    <p className="text-sm text-[#4A5568]">No upcoming events</p>
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
                          className="w-full text-left group rounded-lg border border-[#B43B3B]/30 p-3 hover:border-[#FFD966] hover:shadow-md transition-all bg-white/50 hover:bg-white"
                        >
                          <div className="flex items-start gap-3">
                            {/* Date Box - Red theme */}
                            <div className="min-w-12 rounded-lg bg-[#B43B3B]/5 p-2 text-center border border-[#B43B3B]/30">
                              <div className="text-sm font-bold text-[#B43B3B]">
                                {format(eventDate, "d")}
                              </div>
                              <div className="text-xs text-[#4A5568]">
                                {format(eventDate, "MMM")}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#1A1A2E] truncate group-hover:text-[#B43B3B] transition-colors">
                                {event.name}
                              </h4>
                              
                              {/* Date & Time */}
                              <div className="mt-1 flex items-center gap-1 text-xs text-[#4A5568]">
                                <Clock className="h-3 w-3" />
                                {format(eventDate, "h:mm a")}
                              </div>
                              
                              {/* Organization Name - Red theme */}
                              <p className="mt-2 text-xs text-[#B43B3B] font-medium truncate">
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

            {/* Quick Links - with depth */}
            <Card className="border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0057A3]/5 to-transparent rounded-bl-full"></div>
              <CardHeader>
                <CardTitle className="text-[#1A1A2E]">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/explore">
                  <Button variant="ghost" className="w-full justify-start text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5">
                    <Users className="mr-2 h-4 w-4" />
                    Explore Organizations
                  </Button>
                </Link>
                <Link to="/calendar">
                  <Button variant="ghost" className="w-full justify-start text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar View
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5">
                    <User className="mr-2 h-4 w-4" />
                    Your Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Japanese Wisdom Quote */}
            <div className="text-center text-xs text-[#4A5568]/60 italic pt-2">
              <p>"You make the world a better place. So show up, okay?"</p>
              <div className="flex justify-center gap-1 mt-1">
                <Waves className="h-3 w-3 text-[#0057A3]/30" />
                <Wind className="h-3 w-3 text-[#B43B3B]/30" />
                <Leaf className="h-3 w-3 text-[#FFD966]/30" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal - RED THEME with depth */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-[#FCF9F5] border border-[#B43B3B]/30 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <DialogTitle className="text-xl font-bold text-[#1A1A2E]">Event Details</DialogTitle>
          </div>

          {selectedEvent && selectedEvent.organizations && (
            <>
              {/* Organization Header - Clickable */}
              <div 
                onClick={(e) => handleOrgClick(selectedEvent.org_id, e)}
                className="px-6 py-3 bg-[#B43B3B]/5 border-y border-[#B43B3B]/20 hover:bg-[#B43B3B]/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-[#B43B3B]/30">
                    <AvatarImage src={selectedEvent.organizations.profile_picture || undefined} />
                    <AvatarFallback className="bg-[#B43B3B]/5 text-[#B43B3B]">
                      {getInitials(selectedEvent.organizations.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1A1A2E]">{selectedEvent.organizations.name}</p>
                      <ExternalLink className="h-3 w-3 text-[#4A5568]" />
                    </div>
                    <p className="text-xs text-[#4A5568]">Click to view organization</p>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6 space-y-6">
                {/* Event Name */}
                <div>
                  <h3 className="text-2xl font-bold text-[#1A1A2E]">{selectedEvent.name}</h3>
                  {isPastEvent(selectedEvent.event_date) && (
                    <Badge variant="outline" className="mt-2 border-[#B43B3B]/30 text-[#B43B3B]">Past Event</Badge>
                  )}
                </div>

                {/* Date, Time, Location Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Date</p>
                    <div className="flex items-center gap-2 text-sm text-[#1A1A2E]">
                      <Calendar className="h-4 w-4 text-[#B43B3B]" />
                      <span>{format(new Date(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Time</p>
                    <div className="flex items-center gap-2 text-sm text-[#1A1A2E]">
                      <Clock className="h-4 w-4 text-[#B43B3B]" />
                      <span>{format(new Date(selectedEvent.event_date), "h:mm a")}</span>
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Location</p>
                      <div className="flex items-center gap-2 text-sm text-[#1A1A2E]">
                        <MapPin className="h-4 w-4 text-[#B43B3B]" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Description</p>
                    <div className="bg-[#B43B3B]/5 rounded-lg p-4 border border-[#B43B3B]/20">
                      <p className="text-sm text-[#1A1A2E] whitespace-pre-wrap leading-relaxed">
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

      {/* Footer */}
      <footer className="mt-12 bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-[#0057A3]/20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-[#FCF9F5]/60">
            <p>© 2026 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Add subtle floating animation */}
      <style>{`
        @keyframes float-playful {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-8px); }
          50% { transform: translateY(4px); }
          75% { transform: translateY(6px); }
        }
        .animate-float-playful {
          animation: float-playful 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;