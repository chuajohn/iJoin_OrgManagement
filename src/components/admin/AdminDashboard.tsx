import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Download,
  Settings,
  RefreshCw,
  Loader2,
  Image,
  Images,
  Grid,
  List,
  Camera,
  Eye,
  X,
  UserCheck,
  UserPlus,
  UserMinus,
  FileText,
  BookOpen,
  Heart
} from "lucide-react";
import { format } from "date-fns";

// Match the exact structure from Dashboard.tsx
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
  type: 'organization' | 'event';
  name: string;
  org_name: string;
  created_at: string;
  status: string;
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

interface AdminDashboardProps {
  announcements: Announcement[];
  events: Event[];
  organizations: Organization[];
  pendingItems: PendingItem[];
  stats: {
    totalOrgs: number;
    totalEvents: number;
    totalAnnouncements: number;
    pendingOrgs: number;
    pendingEvents: number;
    shsOrgs: number;
    collegeOrgs: number;
  };
  loading?: boolean;
  profile?: any;
  user?: any;
}

export function AdminDashboard({ 
  announcements, 
  events, 
  organizations, 
  pendingItems, 
  stats,
  profile,
  user
}: AdminDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  const photosWithImages = announcements.filter(a => a.image_url !== null).map(a => ({
    id: a.id,
    title: a.title,
    image_url: a.image_url!,
    org_name: a.organizations?.name || 'Unknown',
    org_id: a.org_id,
    created_at: a.created_at
  }));

  const pendingOrgs = pendingItems.filter(i => i.type === 'organization');
  const pendingEvents = pendingItems.filter(i => i.type === 'event');

  const displayedAnnouncements = expandedAnnouncements ? announcements : announcements.slice(0, 5);
  const displayedOrganizations = expandedOrganizations ? organizations : organizations.slice(0, 5);
  const displayedEvents = expandedEvents ? events : events.slice(0, 4);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge className="bg-green-100 text-green-700">Registered</Badge>;
      case 'attended':
        return <Badge className="bg-blue-100 text-blue-700">Attended</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background [&_.bg-white]:dark:bg-card [&_.text-gray-900]:dark:text-foreground [&_.text-gray-700]:dark:text-foreground [&_.text-gray-600]:dark:text-muted-foreground [&_.text-gray-500]:dark:text-muted-foreground [&_.text-gray-400]:dark:text-muted-foreground [&_.border-gray-200]:dark:border-border [&_.border-gray-100]:dark:border-border [&_.bg-gray-50]:dark:bg-muted/40 [&_.bg-gray-100]:dark:bg-muted">
      {/* Header */}
      <div className="border-b border-border bg-background/95 px-8 py-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-base text-muted-foreground mt-2">
              Welcome back, {profile?.name?.split(' ')[0] || 'Admin'} • Here's what's happening
            </p>
          </div>
        </div>
      </div>

      {/* Stats & Quick Actions */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Stats Cards (unchanged) */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-background hover:shadow-md transition-shadow dark:from-blue-950/20 dark:to-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Organizations</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrgs}</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 px-2 py-1">
                      <School className="h-3.5 w-3.5 mr-1" /> {stats.shsOrgs} SHS
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700 px-2 py-1">
                      <GraduationCap className="h-3.5 w-3.5 mr-1" /> {stats.collegeOrgs} College
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-background hover:shadow-md transition-shadow dark:from-emerald-950/20 dark:to-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Events</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>+{stats.totalEvents} this month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-background hover:shadow-md transition-shadow dark:from-amber-950/20 dark:to-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">Announcements</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAnnouncements}</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>+{announcements.length} recent</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-background hover:shadow-md transition-shadow dark:from-rose-950/20 dark:to-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-rose-600">Pending</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingOrgs + stats.pendingEvents}</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-rose-100 flex items-center justify-center">
                      <Hourglass className="h-6 w-6 text-rose-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 px-2 py-1">
                      {stats.pendingOrgs} orgs
                    </Badge>
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 px-2 py-1">
                      {stats.pendingEvents} events
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="border border-border bg-card h-full hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded bg-amber-100 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-base font-medium text-gray-700">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="ghost" size="default" className="h-auto py-3 px-2 flex-col gap-2 hover:bg-blue-50" onClick={() => navigate('/admin?tab=organizations')}>
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="text-xs text-gray-600">Orgs</span>
                  </Button>
                  <Button variant="ghost" size="default" className="h-auto py-3 px-2 flex-col gap-2 hover:bg-emerald-50" onClick={() => navigate('/admin?tab=events')}>
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs text-gray-600">Events</span>
                  </Button>
                  <Button variant="ghost" size="default" className="h-auto py-3 px-2 flex-col gap-2 hover:bg-amber-50" onClick={() => navigate('/admin?tab=users')}>
                    <Users className="h-5 w-5 text-amber-600" />
                    <span className="text-xs text-gray-600">Users</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pending Items */}
      <div className="px-8 py-3">
        {pendingItems.length > 0 && (
          <Card className="border border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-base font-medium text-amber-800">Pending Approval</h3>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 px-2 py-1 text-sm">
                    {pendingItems.length} total
                  </Badge>
                </div>
                <Link to="/admin" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-4">
                {pendingItems.slice(0, 4).map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.type === 'organization' ? `/admin?tab=organizations` : `/admin?tab=events`}
                    className="flex-1 min-w-[220px] bg-white rounded-lg border border-amber-200 p-4 hover:shadow-md hover:border-amber-300 transition-all group dark:bg-card dark:border-amber-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.type === 'organization' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                        {item.type === 'organization' ? <Building2 className="h-5 w-5 text-blue-600" /> : <Calendar className="h-5 w-5 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.org_name} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-amber-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Tabs */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-gray-100/80 p-1 dark:bg-muted/70">
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
              <Button variant="outline" size="icon" className="h-9 w-9">
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
                    <Button variant="ghost" size="sm" className="gap-1 text-sm text-blue-600 hover:text-blue-700" onClick={() => setExpandedAnnouncements(!expandedAnnouncements)}>
                      {expandedAnnouncements ? <>Show less <ChevronUp className="h-4 w-4" /></> : <>View all <ChevronDown className="h-4 w-4" /></>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {displayedAnnouncements.length === 0 ? (
                    <p className="text-sm text-gray-500 py-6 text-center">No recent announcements</p>
                  ) : (
                    <div className={`space-y-3 ${expandedAnnouncements ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                      {displayedAnnouncements.map((announcement) => {
                        const org = organizations.find(o => o.id === announcement.org_id);
                        return (
                          <div
                            key={announcement.id}
                            onClick={() => handleAnnouncementClick(announcement)}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
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
                                {announcement.image_url && <Camera className="h-3.5 w-3.5 text-blue-500" />}
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
                          </div>
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
                    <Button variant="ghost" size="sm" className="gap-1 text-sm text-blue-600 hover:text-blue-700" onClick={() => setExpandedOrganizations(!expandedOrganizations)}>
                      {expandedOrganizations ? <>Show less <ChevronUp className="h-4 w-4" /></> : <>View all <ChevronDown className="h-4 w-4" /></>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {displayedOrganizations.length === 0 ? (
                    <p className="text-sm text-gray-500 py-6 text-center">No organizations yet</p>
                  ) : (
                    <div className={`space-y-3 ${expandedOrganizations ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                      {displayedOrganizations.map((org) => (
                        <Link key={org.id} to={`/org/${org.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={org.profile_picture || undefined} />
                            <AvatarFallback className="text-sm bg-gray-100">{org.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{org.name}</p>
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

            {/* Upcoming Events */}
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
                    <Button variant="ghost" size="sm" className="gap-1 text-sm text-blue-600 hover:text-blue-700" onClick={() => setExpandedEvents(!expandedEvents)}>
                      {expandedEvents ? <>Show less <ChevronUp className="h-4 w-4" /></> : <>View all <ChevronDown className="h-4 w-4" /></>}
                    </Button>
                    <Link to="/calendar" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">Calendar <ChevronRight className="h-4 w-4" /></Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {displayedEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">No upcoming events</p>
                ) : (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${expandedEvents ? 'max-h-[500px] overflow-y-auto pr-2' : ''}`}>
                    {displayedEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="min-w-12 h-12 rounded bg-blue-50 flex flex-col items-center justify-center border border-blue-100">
                          <span className="text-sm font-bold text-blue-600">{new Date(event.event_date).getDate()}</span>
                          <span className="text-[10px] uppercase text-gray-500">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">{event.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{event.organizations?.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
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
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-700">All Announcements</CardTitle>
                  <div className="flex items-center gap-3">
                    {photosWithImages.length > 0 && (
                      <Button variant="outline" size="sm" className="gap-2 h-10" onClick={() => setPhotoGalleryOpen(true)}>
                        <Image className="h-4 w-4" /> Photos ({photosWithImages.length})
                      </Button>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input placeholder="Search announcements..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 w-[220px] text-sm" />
                    </div>
                    <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                      <SelectTrigger className="h-10 w-[160px] text-sm"><SelectValue placeholder="Organization" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-sm">All Orgs</SelectItem>
                        {organizations.map(org => (<SelectItem key={org.id} value={org.id} className="text-sm">{org.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="h-10 w-[100px] text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
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
                    filteredAnnouncements.map((announcement) => (
                      <div
                        key={announcement.id}
                        onClick={() => handleAnnouncementClick(announcement)}
                        className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-200"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={announcement.organizations?.profile_picture || undefined} />
                          <AvatarFallback className="text-base bg-gray-100">{announcement.organizations?.name?.charAt(0) || 'O'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{announcement.title}</h3>
                            {announcement.image_url && (<Badge variant="outline" className="text-xs px-2 py-0.5 gap-1"><Camera className="h-3 w-3" /> Photo</Badge>)}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{announcement.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">{announcement.organizations?.name}</span>
                            <span>•</span>
                            <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(announcement.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
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
                      <Input placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 w-[220px] text-sm" />
                    </div>
                    <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                      <SelectTrigger className="h-10 w-[160px] text-sm"><SelectValue placeholder="Organization" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-sm">All Orgs</SelectItem>
                        {organizations.map(org => (<SelectItem key={org.id} value={org.id} className="text-sm">{org.name}</SelectItem>))}
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
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-200"
                      >
                        <div className="min-w-14 h-14 rounded bg-blue-50 flex flex-col items-center justify-center border border-blue-100">
                          <span className="text-base font-bold text-blue-600">{new Date(event.event_date).getDate()}</span>
                          <span className="text-[10px] uppercase text-gray-500">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{event.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">{event.organizations?.name}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            {event.location && (<><span>•</span><div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> <span className="truncate max-w-[150px]">{event.location}</span></div></>)}
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
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-700">All Organizations</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input placeholder="Search organizations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 w-[220px] text-sm" /></div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="h-10 w-[100px] text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
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
                    organizations.filter(org => {
                      if (selectedType === 'shs') return org.is_shs_org;
                      if (selectedType === 'college') return !org.is_shs_org;
                      return true;
                    }).filter(org => !searchQuery || org.name.toLowerCase().includes(searchQuery.toLowerCase()) || org.description?.toLowerCase().includes(searchQuery.toLowerCase())).map((org) => (
                      <Link key={org.id} to={`/org/${org.id}`} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200">
                        <Avatar className="h-12 w-12"><AvatarImage src={org.profile_picture || undefined} /><AvatarFallback className="text-base bg-gray-100">{org.name.charAt(0)}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2"><h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">{org.name}</h3>{org.is_shs_org && (<Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">SHS</Badge>)}</div>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{org.description || 'No description'}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400"><span>Created {new Date(org.created_at).toLocaleDateString()}</span><span>•</span><Badge variant="outline" className="text-xs px-2 py-0.5">{org.status}</Badge></div>
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

      {/* Photo Gallery Dialog */}
      <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Images className="h-5 w-5" /> Announcement Photos <Badge variant="secondary" className="ml-2">{photosWithImages.length} photos</Badge></div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${photoView === 'grid' ? 'bg-gray-100' : ''}`} onClick={() => setPhotoView('grid')}><Grid className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${photoView === 'list' ? 'bg-gray-100' : ''}`} onClick={() => setPhotoView('list')}><List className="h-4 w-4" /></Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto p-1 max-h-[60vh]">
            {photoView === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photosWithImages.map((photo) => (
                  <button key={photo.id} onClick={() => setSelectedPhoto(photo)} className="group relative aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-all">
                    <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2"><p className="text-xs text-white font-medium truncate">{photo.title}</p><p className="text-[10px] text-white/80 truncate">{photo.org_name}</p></div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {photosWithImages.map((photo) => (
                  <button key={photo.id} onClick={() => setSelectedPhoto(photo)} className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"><img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 text-left"><h4 className="text-sm font-medium text-gray-900">{photo.title}</h4><p className="text-xs text-gray-500 mt-1">{photo.org_name}</p><p className="text-xs text-gray-400 mt-1">{new Date(photo.created_at).toLocaleDateString()}</p></div>
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
              <div className="relative"><img src={selectedPhoto.image_url} alt={selectedPhoto.title} className="w-full h-auto max-h-[60vh] object-contain rounded-lg" /></div>
              <div className="space-y-2"><h3 className="text-lg font-semibold text-gray-900">{selectedPhoto.title}</h3><div className="flex items-center justify-between"><Link to={`/org/${selectedPhoto.org_id}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">{selectedPhoto.org_name}<ExternalLink className="h-3 w-3" /></Link><p className="text-xs text-gray-500">{new Date(selectedPhoto.created_at).toLocaleDateString()} at {new Date(selectedPhoto.created_at).toLocaleTimeString()}</p></div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}