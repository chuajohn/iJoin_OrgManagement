// src/pages/SAO.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  Fish
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationItem } from "@/components/NotificationItem";

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

const SAO = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
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
  
  // Event approval state
  const [processingEvent, setProcessingEvent] = useState<string | null>(null);

  // Japanese floating elements
  const japaneseElements = [
    { Icon: Waves, color: "#00A3FF", top: "15%", right: "5%", delay: "0s", size: 24, opacity: 0.1 },
    { Icon: Wind, color: "#B43B3B", top: "40%", right: "8%", delay: "2s", size: 28, opacity: 0.1 },
    { Icon: Leaf, color: "#FFD966", bottom: "30%", right: "3%", delay: "1s", size: 26, opacity: 0.1 },
    { Icon: Fish, color: "#00A3FF", bottom: "60%", right: "12%", delay: "3s", size: 22, opacity: 0.1 },
    { Icon: Gem, color: "#B43B3B", top: "70%", right: "15%", delay: "1.5s", size: 24, opacity: 0.1 },
  ];

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00A3FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5 relative overflow-hidden">
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
      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#00A3FF]/30 shadow-sm flex-shrink-0">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/sao" className="flex items-center gap-3">
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
            <Badge variant="outline" className="ml-2 border-[#00A3FF]/30 text-[#00A3FF]">
              <Shield className="h-3 w-3 mr-1" />
              SAO
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/explore">
              <Button variant="ghost" size="sm" className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5">
                <Search className="h-4 w-4 mr-1"/>
                Explore
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5">
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </Link>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#B43B3B] text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 border border-[#00A3FF]/30 shadow-lg" align="end">
                <div className="flex items-center justify-between p-4 border-b border-[#00A3FF]/20">
                  <h3 className="font-semibold text-[#1A1A2E]">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1 text-[#00A3FF] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5"
                      onClick={markAllAsRead}
                    >
                      <CheckCircle className="h-3 w-3" />
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
            <Link to="/profile">
              <Button variant="ghost" size="icon" title="Profile" className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <SignOutButton variant="ghost" size="icon" className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5" />
          </div>
        </div>
      </header>

      {/* Main Content - flex-grow to fill remaining space */}
      <div className="flex-1">
        <div className="container mx-auto px-8 py-6">
          {/* Header Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#1A1A2E]">SAO Dashboard</h1>
            <p className="text-base text-[#4A5568] mt-1">
              Monitor and oversee all organization activities
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Organizations</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{organizations.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 px-2 py-1">
                    <School className="h-3.5 w-3.5 mr-1" /> {organizations.filter(o => o.is_shs_org).length} SHS
                  </Badge>
                  <Badge variant="outline" className="border-blue-200 text-blue-700 px-2 py-1">
                    <GraduationCap className="h-3.5 w-3.5 mr-1" /> {organizations.filter(o => !o.is_shs_org).length} College
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Events</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{events.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Upcoming events</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Announcements</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{announcements.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Total posts</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-600">Pending Events</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{pendingItems.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Hourglass className="h-6 w-6 text-rose-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-rose-600">
                  <span>Awaiting approval</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Events Section */}
          {pendingItems.length > 0 && (
            <div className="mb-6">
              <Card className="border border-rose-200 bg-rose-50/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      </div>
                      <h3 className="text-base font-medium text-rose-800">Pending Event Approval</h3>
                      <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 px-2 py-1 text-sm">
                        {pendingItems.length} events
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {pendingItems.slice(0, 4).map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex-1 min-w-[280px] bg-white rounded-lg border border-rose-200 p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-rose-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.org_name} • {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
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
                            className="flex-1 border-rose-200 hover:bg-rose-50 hover:text-rose-600"
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
              <TabsList className="bg-gray-100/80 p-1">
                <TabsTrigger value="overview" className="gap-2 text-sm py-2 px-4">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="announcements" className="gap-2 text-sm py-2 px-4">
                  <Activity className="h-4 w-4" />
                  Announcements
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2 text-sm py-2 px-4">
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="organizations" className="gap-2 text-sm py-2 px-4">
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
                <Card className="lg:col-span-2 border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        Recent Announcements
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({announcements.length} total)
                        </span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-sm text-blue-600 hover:text-blue-700"
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
                      <p className="text-sm text-gray-500 py-6 text-center">No announcements found</p>
                    ) : (
                      <div className={`space-y-3 ${expandedAnnouncements ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                        {displayedAnnouncements.map((announcement) => {
                          const org = organizations.find(o => o.id === announcement.org_id);
                          const hasImage = announcement.image_url !== null;
                          return (
                            <Link
                              key={announcement.id}
                              to={`/org/${announcement.org_id}`}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={announcement.organizations?.profile_picture || undefined} />
                                <AvatarFallback className="text-sm bg-gray-100">
                                  {announcement.organizations?.name?.charAt(0) || 'O'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {announcement.title}
                                  </p>
                                  {hasImage && (
                                    <Camera className="h-3.5 w-3.5 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                  <span>{announcement.organizations?.name}</span>
                                  <span>•</span>
                                  <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                  {org?.is_shs_org && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                                      SHS
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Organizations */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        Recent Organizations
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({organizations.length} total)
                        </span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-sm text-blue-600 hover:text-blue-700"
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
                      <p className="text-sm text-gray-500 py-6 text-center">No organizations yet</p>
                    ) : (
                      <div className={`space-y-3 ${expandedOrganizations ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                        {displayedOrganizations.map((org) => (
                          <Link
                            key={org.id}
                            to={`/org/${org.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={org.profile_picture || undefined} />
                              <AvatarFallback className="text-sm bg-gray-100">
                                {org.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {org.name}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span>{org.is_shs_org ? 'SHS' : 'College'}</span>
                                <span>•</span>
                                <span>{new Date(org.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Events Grid */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-700">
                      Upcoming Events
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({events.length} total)
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-sm text-blue-600 hover:text-blue-700"
                        onClick={() => setExpandedEvents(!expandedEvents)}
                      >
                        {expandedEvents ? (
                          <>Show less <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>View all <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                      <Link to="/calendar" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Calendar
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {displayedEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 py-6 text-center">No upcoming events</p>
                  ) : (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${expandedEvents ? 'max-h-[500px] overflow-y-auto pr-2' : ''}`}>
                      {displayedEvents.map((event) => (
                        <Link
                          key={event.id}
                          to={`/org/${event.org_id}`}
                          className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
                        >
                          <div className="min-w-12 h-12 rounded bg-blue-50 flex flex-col items-center justify-center border border-blue-100">
                            <span className="text-sm font-bold text-blue-600">
                              {new Date(event.event_date).getDate()}
                            </span>
                            <span className="text-[10px] uppercase text-gray-500">
                              {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {event.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {event.organizations?.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                              <Clock className="h-3 w-3" />
                              {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-700">All Announcements</CardTitle>
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
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                      <p className="text-sm text-gray-500 py-10 text-center">No announcements found</p>
                    ) : (
                      filteredAnnouncements.map((announcement) => {
                        const org = organizations.find(o => o.id === announcement.org_id);
                        const hasImage = announcement.image_url !== null;
                        return (
                          <Link
                            key={announcement.id}
                            to={`/org/${announcement.org_id}`}
                            className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={announcement.organizations?.profile_picture || undefined} />
                              <AvatarFallback className="text-base bg-gray-100">
                                {announcement.organizations?.name?.charAt(0) || 'O'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {announcement.title}
                                </h3>
                                {org?.is_shs_org && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
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
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {announcement.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="font-medium text-gray-700">{announcement.organizations?.name}</span>
                                <span>•</span>
                                <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{new Date(announcement.created_at).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-700">All Events</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                      <p className="text-sm text-gray-500 py-10 text-center col-span-2">No events found</p>
                    ) : (
                      events.map((event) => (
                        <Link
                          key={event.id}
                          to={`/org/${event.org_id}`}
                          className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                        >
                          <div className="min-w-14 h-14 rounded bg-blue-50 flex flex-col items-center justify-center border border-blue-100">
                            <span className="text-base font-bold text-blue-600">
                              {new Date(event.event_date).getDate()}
                            </span>
                            <span className="text-[10px] uppercase text-gray-500">
                              {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {event.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {event.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">{event.organizations?.name}</span>
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
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Organizations Tab */}
            <TabsContent value="organizations" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-700">All Organizations</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                      <p className="text-sm text-gray-500 py-10 text-center col-span-2">No organizations found</p>
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
                            className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={org.profile_picture || undefined} />
                              <AvatarFallback className="text-base bg-gray-100">
                                {org.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                  {org.name}
                                </h3>
                                {org.is_shs_org && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                                    SHS
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                                {org.description || 'No description'}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
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
                  className={`h-8 w-8 ${photoView === 'grid' ? 'bg-gray-100' : ''}`}
                  onClick={() => setPhotoView('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${photoView === 'list' ? 'bg-gray-100' : ''}`}
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
                    className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-medium text-gray-900">{photo.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{photo.org_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
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
                <h3 className="text-lg font-semibold text-gray-900">{selectedPhoto.title}</h3>
                <div className="flex items-center justify-between">
                  <Link
                    to={`/org/${selectedPhoto.org_id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {selectedPhoto.org_name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedPhoto.created_at).toLocaleDateString()} at{' '}
                    {new Date(selectedPhoto.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer - flex-shrink-0 prevents it from shrinking */}
      <footer className="flex-shrink-0 bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-[#00A3FF]/20 mt-auto">
        <div className="container mx-auto px-8 py-6">
          <div className="text-center text-sm text-[#FCF9F5]/60">
            <p>© 2026 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SAO;