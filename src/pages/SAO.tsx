// src/pages/SAO.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar, 
  Users, 
  Building2,
  AlertCircle,
  School,
  GraduationCap,
  Search,
  Activity,
  Clock,
  MapPin,
  TrendingUp,
  BarChart3,
  Hourglass,
  ExternalLink,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  Bell,
  MoreHorizontal,
  Moon,
  Sun,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Image,
  Grid,
  List,
  Camera,
  User,
  LogOut,
  Plus,
  Heart,
  MessageCircle,
  Sparkles,
  Award,
  Crown,
  Star,
  Medal,
  Gem,
  Waves,
  Wind,
  Leaf,
  Fish,
  UserCheck,
  Download,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationItem } from "@/components/NotificationItem";
import { HelpModal } from "@/components/HelpModal";

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
  status: string;
  org_id: string;
  organizations: {
    name: string;
    profile_picture: string | null;
  } | null;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  profile_picture: string | null;
  is_shs_org: boolean;
  status: string;
  created_at: string;
}

interface PendingItem {
  id: string;
  type: 'event';
  name: string;
  org_name: string;
  created_at: string;
  status: string;
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

interface PhotoItem {
  id: string;
  title: string;
  image_url: string;
  org_name: string;
  org_id: string;
  created_at: string;
}

interface RSVPMember {
  id: string;
  user_id: string;
  status: string;
  registered_at: string;
  profiles: {
    name: string;
    email: string;
    profile_picture: string | null;
  };
}

const SAO = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState('week');
  
  // Expandable sections state
  const [expandedAnnouncements, setExpandedAnnouncements] = useState(false);
  const [expandedOrganizations, setExpandedOrganizations] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState(false);
  
  // Photo gallery state
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [photoView, setPhotoView] = useState<'grid' | 'list'>('grid');
  
  // Event modal state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventRSVPs, setEventRSVPs] = useState<RSVPMember[]>([]);
  const [loadingRSVPs, setLoadingRSVPs] = useState(false);
  
  // Announcement modal state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  
  // Event approval state
  const [processingEvent, setProcessingEvent] = useState<string | null>(null);

  const japaneseElements = [
    { Icon: Waves, color: "hsl(var(--primary))", top: "15%", right: "5%", delay: "0s", size: 24, opacity: 0.1 },
    { Icon: Wind, color: "hsl(var(--destructive))", top: "40%", right: "8%", delay: "2s", size: 28, opacity: 0.1 },
    { Icon: Leaf, color: "hsl(var(--brand-yellow))", bottom: "30%", right: "3%", delay: "1s", size: 26, opacity: 0.1 },
    { Icon: Fish, color: "hsl(var(--primary))", bottom: "60%", right: "12%", delay: "3s", size: 22, opacity: 0.1 },
    { Icon: Gem, color: "hsl(var(--destructive))", top: "70%", right: "15%", delay: "1.5s", size: 24, opacity: 0.1 },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200">Registered</Badge>;
      case 'attended':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">Attended</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const fetchEventRSVPs = async (eventId: string) => {
    setLoadingRSVPs(true);
    try {
      const { data, error } = await supabase
        .from("rsvp")
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            profile_picture
          )
        `)
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      
      const transformedData: RSVPMember[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        status: item.status,
        registered_at: item.registered_at,
        profiles: {
          name: item.profiles.name,
          email: item.profiles.email,
          profile_picture: item.profiles.profile_picture
        }
      }));
      
      setEventRSVPs(transformedData);
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
    } finally {
      setLoadingRSVPs(false);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
    fetchEventRSVPs(event.id);
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsAnnouncementModalOpen(true);
  };

  useEffect(() => {
    fetchSAOData();
    fetchNotifications();
    setupNotificationsSubscription();
  }, []);

  const fetchSAOData = async () => {
    try {
      setLoading(true);
      
      // Fetch all active organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (orgsError) throw orgsError;
      
      // Fetch pending events only (SAO can approve events, not orgs)
      const { data: pendingEventsData, error: pendingEventsError } = await supabase
        .from("events")
        .select(`
          id,
          name,
          created_at,
          organizations!inner(name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingEventsError) throw pendingEventsError;

      // Fetch all announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from("announcements")
        .select(`
          *,
          organizations!inner (
            name,
            profile_picture
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (announcementsError) throw announcementsError;

      // Fetch all upcoming events (approved)
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(`
          *,
          organizations!inner (
            name,
            profile_picture
          )
        `)
        .eq("status", "approved")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(20);

      if (eventsError) throw eventsError;

      setOrganizations(orgsData?.map(org => ({
        ...org,
        is_shs_org: org.is_shs_org || false,
        status: org.status || 'active'
      })) || []);
      
      setAnnouncements(announcementsData?.filter(a => a.organizations) || []);
      setEvents(eventsData?.filter(e => e.organizations) || []);

      // Combine pending items (only events for SAO)
      const pending: PendingItem[] = [
        ...(pendingEventsData?.map(e => ({
          id: e.id,
          type: 'event' as const,
          name: e.name,
          org_name: e.organizations.name,
          created_at: e.created_at,
          status: 'pending'
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPendingItems(pending);

    } catch (error) {
      console.error("Error fetching SAO dashboard data:", error);
      toast.error("Failed to load dashboard data");
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

  const setupNotificationsSubscription = () => {
    const channel = supabase
      .channel("sao-notifications")
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

  const handleEventApproval = async (eventId: string, status: "approved" | "rejected") => {
    setProcessingEvent(eventId);
    try {
      const { error } = await supabase
        .from("events")
        .update({ status })
        .eq("id", eventId);

      if (error) throw error;

      toast.success(`Event ${status} successfully`);
      fetchSAOData();
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error(`Failed to ${status} event`);
    } finally {
      setProcessingEvent(null);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (selectedOrg !== 'all' && a.org_id !== selectedOrg) return false;
    
    if (selectedType !== 'all') {
      const org = organizations.find(o => o.id === a.org_id);
      if (!org) return false;
      if (selectedType === 'shs' && !org.is_shs_org) return false;
      if (selectedType === 'college' && org.is_shs_org) return false;
    }
    
    if (searchQuery) {
      return a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
             a.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             false;
    }
    return true;
  });

  // Get all announcements with images
  const photosWithImages = announcements.filter(a => a.image_url !== null).map(a => ({
    id: a.id,
    title: a.title,
    image_url: a.image_url!,
    org_name: a.organizations?.name || 'Unknown',
    org_id: a.org_id,
    created_at: a.created_at
  }));

  // Display items based on expanded state
  const displayedAnnouncements = expandedAnnouncements ? announcements : announcements.slice(0, 5);
  const displayedOrganizations = expandedOrganizations ? organizations : organizations.slice(0, 5);
  const displayedEvents = expandedEvents ? events : events.slice(0, 4);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Floating Japanese Elements */}
      {japaneseElements.map((item, index) => {
        const IconComponent = item.Icon;
        return (
          <div
            key={index}
            className="absolute pointer-events-none animate-float-subtle"
            style={{
              top: item.top,
              right: item.right,
              bottom: item.bottom,
              animationDelay: item.delay,
              animationDuration: "8s",
              opacity: item.opacity,
            }}
          >
            <IconComponent 
              size={item.size} 
              color={item.color}
              strokeWidth={1}
            />
          </div>
        );
      })}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm flex-shrink-0">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/sao" className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/logo.svg" 
                  alt="logo" 
                  className="h-8 w-auto md:h-10"
                />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-yellow border border-background"></div>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline">iJoin</span>
            </Link>
            <Badge variant="outline" className="ml-2 border-border text-primary">
              <Shield className="h-3 w-3 mr-1" />
              SAO
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/explore">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/5">
                <Search className="h-4 w-4 mr-1"/>
                Explore
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/5">
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </Link>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/5">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 border border-border shadow-lg" align="end">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/5"
                      onClick={markAllAsRead}
                    >
                      <CheckCircle className="h-3 w-3" />
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
              <Button variant="ghost" size="icon" title="Profile" className="text-muted-foreground hover:text-primary hover:bg-primary/5">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 border border-border shadow-lg" align="end">
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-none px-4 py-3 h-auto font-normal border-b border-border hover:bg-accent"
                  onClick={toggleTheme}
                >
                  <div className="flex items-center justify-between w-full cursor-pointer">
                    <span className="flex items-center gap-2">
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </span>
                    <Switch
                      checked={theme === "dark"}
                      className="ml-2 pointer-events-none"
                    />
                  </div>
                </Button>
                <HelpModal
                  variant="ghost"
                  className="w-full justify-start rounded-none px-4 py-3 h-auto font-normal border-b border-border hover:bg-accent"
                  showIcon={true}
                  text="Help"
                />
                <SignOutButton
                  variant="ghost"
                  className="w-full justify-start rounded-none px-4 py-3 h-auto font-normal text-destructive hover:bg-red-50/50 dark:hover:bg-red-950/20"
                  showIcon={true}
                  text="Sign Out"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Main Content - flex-grow to fill remaining space */}
      <div className="flex-1">
        <div className="container mx-auto px-8 py-6">
          {/* Header Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">SAO Dashboard</h1>
            <p className="text-base text-muted-foreground mt-1">
              Monitor and oversee all organization activities
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">Organizations</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{organizations.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 px-2 py-1">
                    <School className="h-3.5 w-3.5 mr-1" /> {organizations.filter(o => o.is_shs_org).length} SHS
                  </Badge>
                  <Badge variant="outline" className="border-primary/20 text-primary px-2 py-1">
                    <GraduationCap className="h-3.5 w-3.5 mr-1" /> {organizations.filter(o => !o.is_shs_org).length} College
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Events</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{events.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>Upcoming events</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Announcements</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{announcements.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>Total posts</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-500/10 to-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Pending Events</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{pendingItems.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <Hourglass className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
                  <span>Awaiting approval</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Events Section */}
          {pendingItems.length > 0 && (
            <div className="mb-6">
              <Card className="border border-destructive/20 bg-destructive/5">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </div>
                      <h3 className="text-base font-medium text-destructive">Pending Event Approval</h3>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-2 py-1 text-sm">
                        {pendingItems.length} events
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {pendingItems.slice(0, 4).map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex-1 min-w-[280px] bg-card rounded-lg border border-destructive/20 p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base text-foreground truncate">
                              {item.name}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.org_name} • {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleEventApproval(item.id, "approved")}
                            disabled={processingEvent === item.id}
                          >
                            {processingEvent === item.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleEventApproval(item.id, "rejected")}
                            disabled={processingEvent === item.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted/80 p-1">
                <TabsTrigger value="overview" className="gap-2 text-sm py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="announcements" className="gap-2 text-sm py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Activity className="h-4 w-4" />
                  Announcements
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2 text-sm py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="organizations" className="gap-2 text-sm py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Building2 className="h-4 w-4" />
                  Organizations
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day" className="text-sm">Today</SelectItem>
                    <SelectItem value="week" className="text-sm">This Week</SelectItem>
                    <SelectItem value="month" className="text-sm">This Month</SelectItem>
                    <SelectItem value="year" className="text-sm">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchSAOData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Announcements */}
                <Card className="lg:col-span-2 border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-foreground">
                        Recent Announcements
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({announcements.length} total)
                        </span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-sm text-primary hover:text-primary/80"
                        onClick={() => setExpandedAnnouncements(!expandedAnnouncements)}
                      >
                        {expandedAnnouncements ? (
                          <>Show less <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>View all <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {displayedAnnouncements.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">No announcements found</p>
                    ) : (
                      <div className={`space-y-3 ${expandedAnnouncements ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                        {displayedAnnouncements.map((announcement) => {
                          const org = organizations.find(o => o.id === announcement.org_id);
                          const hasImage = announcement.image_url !== null;
                          return (
                            <div
                              key={announcement.id}
                              onClick={() => handleAnnouncementClick(announcement)}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group cursor-pointer"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={announcement.organizations?.profile_picture || undefined} />
                                <AvatarFallback className="text-sm bg-muted text-foreground">
                                  {announcement.organizations?.name?.charAt(0) || 'O'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                                    {announcement.title}
                                  </p>
                                  {hasImage && (
                                    <Camera className="h-3.5 w-3.5 text-primary" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span>{announcement.organizations?.name}</span>
                                  <span>•</span>
                                  <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                  {org?.is_shs_org && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-0.5">
                                      SHS
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Organizations */}
                <Card className="border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-foreground">
                        Recent Organizations
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({organizations.length} total)
                        </span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-sm text-primary hover:text-primary/80"
                        onClick={() => setExpandedOrganizations(!expandedOrganizations)}
                      >
                        {expandedOrganizations ? (
                          <>Show less <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>View all <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {displayedOrganizations.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">No organizations yet</p>
                    ) : (
                      <div className={`space-y-3 ${expandedOrganizations ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                        {displayedOrganizations.map((org) => (
                          <Link
                            key={org.id}
                            to={`/org/${org.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={org.profile_picture || undefined} />
                              <AvatarFallback className="text-sm bg-muted text-foreground">
                                {org.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                                {org.name}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>{org.is_shs_org ? 'SHS' : 'College'}</span>
                                <span>•</span>
                                <span>{new Date(org.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Events Grid */}
              <Card className="border-0 shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Upcoming Events
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({events.length} total)
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-sm text-primary hover:text-primary/80"
                        onClick={() => setExpandedEvents(!expandedEvents)}
                      >
                        {expandedEvents ? (
                          <>Show less <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>View all <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                      <Link to="/calendar" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                        Calendar
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {displayedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No upcoming events</p>
                  ) : (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${expandedEvents ? 'max-h-[500px] overflow-y-auto pr-2' : ''}`}>
                      {displayedEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
                        >
                          <div className="min-w-12 h-12 rounded bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                            <span className="text-sm font-bold text-primary">
                              {new Date(event.event_date).getDate()}
                            </span>
                            <span className="text-[10px] uppercase text-muted-foreground">
                              {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {event.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.organizations?.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                              <Clock className="h-3 w-3" />
                              {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="space-y-4">
              <Card className="border-0 shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">All Announcements</CardTitle>
                    <div className="flex items-center gap-3">
                      {photosWithImages.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 h-10"
                          onClick={() => setPhotoGalleryOpen(true)}
                        >
                          <Image className="h-4 w-4" />
                          Photos ({photosWithImages.length})
                        </Button>
                      )}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search announcements..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-10 w-[220px] text-sm"
                        />
                      </div>
                      <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                        <SelectTrigger className="h-10 w-[160px] text-sm">
                          <SelectValue placeholder="Organization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-sm">All Orgs</SelectItem>
                          {organizations.map(org => (
                            <SelectItem key={org.id} value={org.id} className="text-sm">{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="h-10 w-[100px] text-sm">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-sm">All</SelectItem>
                          <SelectItem value="shs" className="text-sm">SHS</SelectItem>
                          <SelectItem value="college" className="text-sm">College</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredAnnouncements.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-10 text-center">No announcements found</p>
                    ) : (
                      filteredAnnouncements.map((announcement) => {
                        const org = organizations.find(o => o.id === announcement.org_id);
                        const hasImage = announcement.image_url !== null;
                        return (
                          <div
                            key={announcement.id}
                            onClick={() => handleAnnouncementClick(announcement)}
                            className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted transition-colors group border border-transparent hover:border-border cursor-pointer"
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={announcement.organizations?.profile_picture || undefined} />
                              <AvatarFallback className="text-base bg-muted text-foreground">
                                {announcement.organizations?.name?.charAt(0) || 'O'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                                  {announcement.title}
                                </h3>
                                {org?.is_shs_org && (
                                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-0.5">
                                    SHS
                                  </Badge>
                                )}
                                {hasImage && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 gap-1">
                                    <Camera className="h-3 w-3" />
                                    Photo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {announcement.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{announcement.organizations?.name}</span>
                                <span>•</span>
                                <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{new Date(announcement.created_at).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <Card className="border-0 shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">All Events</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search events..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-10 w-[220px] text-sm"
                        />
                      </div>
                      <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                        <SelectTrigger className="h-10 w-[160px] text-sm">
                          <SelectValue placeholder="Organization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-sm">All Orgs</SelectItem>
                          {organizations.map(org => (
                            <SelectItem key={org.id} value={org.id} className="text-sm">{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                    {events.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-10 text-center col-span-2">No events found</p>
                    ) : (
                      events.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted transition-colors group border border-transparent hover:border-border cursor-pointer"
                        >
                          <div className="min-w-14 h-14 rounded bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                            <span className="text-base font-bold text-primary">
                              {new Date(event.event_date).getDate()}
                            </span>
                            <span className="text-[10px] uppercase text-muted-foreground">
                              {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                              {event.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {event.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{event.organizations?.name}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              {event.location && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">{event.location}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Organizations Tab */}
            <TabsContent value="organizations" className="space-y-4">
              <Card className="border-0 shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">All Organizations</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search organizations..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-10 w-[220px] text-sm"
                        />
                      </div>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="h-10 w-[100px] text-sm">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-sm">All</SelectItem>
                          <SelectItem value="shs" className="text-sm">SHS</SelectItem>
                          <SelectItem value="college" className="text-sm">College</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                    {organizations.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-10 text-center col-span-2">No organizations found</p>
                    ) : (
                      organizations
                        .filter(org => {
                          if (selectedType === 'shs') return org.is_shs_org;
                          if (selectedType === 'college') return !org.is_shs_org;
                          return true;
                        })
                        .filter(org => {
                          if (!searchQuery) return true;
                          return org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 org.description?.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map((org) => (
                          <Link
                            key={org.id}
                            to={`/org/${org.id}`}
                            className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted transition-colors group border border-transparent hover:border-border"
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={org.profile_picture || undefined} />
                              <AvatarFallback className="text-base bg-muted text-foreground">
                                {org.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {org.name}
                                </h3>
                                {org.is_shs_org && (
                                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-0.5">
                                    SHS
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {org.description || 'No description'}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>Created {new Date(org.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  {org.status}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Photo Gallery Dialog */}
      <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Announcement Photos
                <Badge variant="secondary" className="ml-2">
                  {photosWithImages.length} photos
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${photoView === 'grid' ? 'bg-muted' : ''}`}
                  onClick={() => setPhotoView('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${photoView === 'list' ? 'bg-muted' : ''}`}
                  onClick={() => setPhotoView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto p-1 max-h-[60vh]">
            {photoView === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photosWithImages.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-all"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white font-medium truncate">{photo.title}</p>
                        <p className="text-[10px] text-white/80 truncate">{photo.org_name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {photosWithImages.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-medium text-foreground">{photo.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{photo.org_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Photo View Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-3xl">
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.title}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{selectedPhoto.title}</h3>
                <div className="flex items-center justify-between">
                  <Link
                    to={`/org/${selectedPhoto.org_id}`}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    {selectedPhoto.org_name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedPhoto.created_at).toLocaleDateString()} at{' '}
                    {new Date(selectedPhoto.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden bg-background">
          {selectedEvent && selectedEvent.organizations && (
            <>
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-xl font-bold">Event Details</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {selectedEvent.name} • {format(new Date(selectedEvent.event_date), "MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6">
                {/* Organization Header */}
                <div className="mb-6">
                  <Link to={`/org/${selectedEvent.org_id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedEvent.organizations.profile_picture || undefined} />
                      <AvatarFallback className="bg-primary/10">{getInitials(selectedEvent.organizations.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedEvent.organizations.name}</p>
                      <p className="text-xs text-muted-foreground">Host Organization</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                  </Link>
                </div>

                {/* Event Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</p><div className="flex items-center gap-2 text-sm mt-1"><Calendar className="h-4 w-4 text-primary" />{format(new Date(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}</div></div>
                  <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</p><div className="flex items-center gap-2 text-sm mt-1"><Clock className="h-4 w-4 text-primary" />{format(new Date(selectedEvent.event_date), "h:mm a")}</div></div>
                  {selectedEvent.location && (<div className="col-span-2"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</p><div className="flex items-center gap-2 text-sm mt-1"><MapPin className="h-4 w-4 text-primary" />{selectedEvent.location}</div></div>)}
                </div>

                {/* Description */}
                {selectedEvent.description && (<div className="mb-6"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</p><div className="bg-muted/50 rounded-lg p-4"><p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedEvent.description}</p></div></div>)}

                {/* RSVP List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4" /> Registered Participants ({eventRSVPs.length})</h3>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => { const csv = eventRSVPs.map(r => `${r.profiles.name},${r.profiles.email},${r.status},${format(new Date(r.registered_at), "MMM d, h:mm a")}`).join('\n'); const blob = new Blob([`Name,Email,Status,Registered\n${csv}`], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${selectedEvent.name.replace(/[^a-z0-9]/gi, '_')}_registrations.csv`; a.click(); URL.revokeObjectURL(url); }}>
                      <Download className="h-4 w-4" /> Export
                    </Button>
                  </div>
                  {loadingRSVPs ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : eventRSVPs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No registrations yet</p></div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {eventRSVPs.map((rsvp) => (
                        <div key={rsvp.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src={rsvp.profiles.profile_picture || undefined} /><AvatarFallback className="text-xs">{getInitials(rsvp.profiles.name)}</AvatarFallback></Avatar>
                            <div><p className="font-medium text-sm">{rsvp.profiles.name}</p><p className="text-xs text-muted-foreground">{rsvp.profiles.email}</p></div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(rsvp.status)}
                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(rsvp.registered_at), "MMM d, h:mm a")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Announcement Details Modal */}
      <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background">
          {selectedAnnouncement && selectedAnnouncement.organizations && (
            <>
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-xl font-bold">Announcement Details</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {format(new Date(selectedAnnouncement.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6">
                {/* Organization Header */}
                <div className="mb-6">
                  <Link to={`/org/${selectedAnnouncement.org_id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedAnnouncement.organizations.profile_picture || undefined} />
                      <AvatarFallback className="bg-primary/10">{getInitials(selectedAnnouncement.organizations.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedAnnouncement.organizations.name}</p>
                      <p className="text-xs text-muted-foreground">Posted by organization</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                  </Link>
                </div>

                {/* Announcement Title */}
                <h2 className="text-2xl font-bold mb-4">{selectedAnnouncement.title}</h2>

                {/* Announcement Image */}
                {selectedAnnouncement.image_url && (
                  <div className="mb-6 rounded-lg overflow-hidden border">
                    <img src={selectedAnnouncement.image_url} alt={selectedAnnouncement.title} className="w-full h-auto max-h-[400px] object-contain" />
                  </div>
                )}

                {/* Announcement Content */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedAnnouncement.content}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer - flex-shrink-0 prevents it from shrinking */}
      <footer className="flex-shrink-0 bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-border mt-auto">
        <div className="container mx-auto px-8 py-6">
          <div className="text-center text-sm text-muted-foreground/60">
            <p>© 2026 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SAO;