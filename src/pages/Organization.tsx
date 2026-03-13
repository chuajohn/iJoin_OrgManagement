import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ArrowLeft, Calendar, MapPin, Trash2, Pencil, FileText, UserPlus, UserMinus, Clock, Users as UsersIcon, Image as ImageIcon, X } from "lucide-react";
import OrgLogo from "@/components/OrgLogo";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Organization {
  id: string;
  name: string;
  description: string;
  profile_picture: string | null;
  created_at: string;
  is_shs_org: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  posted_by: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  status: string;
  created_by: string;
  org_id: string;
  organizations?: {
    name: string;
    profile_picture: string | null;
  };
}

interface Member {
  id: string;
  user_id: string;
  name: string;
  profile_picture: string | null;
  role: string;
  joined_at: string;
}

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  uploaded_at: string;
}

interface OrgStats {
  member_count: number;
  leader_name: string | null;
}

const Organization = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOfficer, isLeader, isSAO, isAdmin, isSHSStudent, isUGStudent } = useUserRole(id);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [activeEventTab, setActiveEventTab] = useState<'upcoming' | 'past'>('upcoming');
  const [members, setMembers] = useState<Member[]>([]);
  const [orgStats, setOrgStats] = useState<OrgStats>({ member_count: 0, leader_name: null });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'announcement' | 'event'; id: string } | null>(null);
  
  // Membership state
  const [membershipStatus, setMembershipStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [membershipLoading, setMembershipLoading] = useState(false);
  
  // Edit state
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', name: '', description: '', location: '', event_date: '' });
  const [saving, setSaving] = useState(false);

  // Permission checks
  const canEditAnnouncements = isOfficer || isLeader || isSAO || isAdmin;
  const canDeleteAnnouncements = isOfficer || isLeader || isSAO || isAdmin;
  const canEditEvents = isOfficer || isLeader || isSAO || isAdmin;
  const canDeleteEvents = isLeader || isSAO || isAdmin;

  //leave Confirmation
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);

  // Check if current user is a member
  const isMember = membershipStatus === 'accepted';

  // Check if user can join this org based on their role and org type
  const canJoin = () => {
    if (!user || !organization) return false;
    if (isOfficer || isLeader || isMember) return false; // Already a member or officer
    if (isAdmin || isSAO) return false; // Admins/SAO cannot join
    
    // SHS students can only join SHS orgs
    if (isSHSStudent && organization.is_shs_org) return true;
    
    // UG students can only join college orgs
    if (isUGStudent && !organization.is_shs_org) return true;
    
    return false;
  };

  // Navigation fix - use absolute paths
  const handleBackClick = () => {
    navigate("/explore");
  };

  useEffect(() => {
    if (id) {
      fetchOrganizationData();
      fetchPhotos();
      fetchOrgPublicStats();
      if (user) {
        fetchMembershipStatus();
      }
    }
  }, [id, user]);

  // Fetch public stats (member count and leader) - bypasses RLS
  const fetchOrgPublicStats = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_org_public_stats', { org_uuid: id });
      
      if (error) throw error;
      
      // Cast the data to the expected shape
      const statsData = data as { member_count: number; leader_name: string | null };
      
      if (statsData) {
        setOrgStats({
          member_count: statsData.member_count || 0,
          leader_name: statsData.leader_name || null
        });
      }
    } catch (error) {
      console.error("Error fetching org stats:", error);
      // Set default values on error
      setOrgStats({
        member_count: 0,
        leader_name: null
      });
    }
  };

  // Fetch full member list - only if user is a member
  const fetchMembersList = async () => {
    if (!id || !isMember) return;
    
    try {
      console.log("Fetching members for org:", id);
      
      const { data, error } = await supabase
        .rpc('get_org_members', { target_org_id: id }); // Note: parameter name changed
      
      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }
      
      console.log("Members data received:", data);
      setMembers(data || []);
      
    } catch (error: any) {
      console.error("Error fetching members list:", error);
      toast.error("Failed to load members list");
    }
  };

  // Call fetchMembersList when membership status changes
  useEffect(() => {
    if (isMember) {
      fetchMembersList();
    } else {
      setMembers([]); // Clear members list when not a member
    }
  }, [isMember, id]);

  const fetchPhotos = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("organization_photos")
        .select("id, image_url, caption, uploaded_at")
        .eq("org_id", id)
        .order("display_order", { ascending: true })
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  };

  const fetchOrganizationData = async () => {
    try {
      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*")
        .eq("org_id", id)
        .order("created_at", { ascending: false });

      setAnnouncements(announcementsData || []);

      // Fetch upcoming events (future dates)
      const { data: upcomingData } = await supabase
        .from("events")
        .select("*")
        .eq("org_id", id)
        .eq("status", "approved")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      setEvents(upcomingData || []);

      // Fetch past events (past dates)
      const { data: pastData } = await supabase
        .from("events")
        .select("*")
        .eq("org_id", id)
        .eq("status", "approved")
        .lt("event_date", new Date().toISOString())
        .order("event_date", { ascending: false });

      setPastEvents(pastData || []);

    } catch (error: any) {
      console.error("Error fetching organization data:", error);
      toast.error("Failed to load organization");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipStatus = async () => {
    if (!user || !id) return;
    
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select("status")
        .eq("org_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setMembershipStatus(data.status === 'accepted' ? 'accepted' : 'pending');
      } else {
        setMembershipStatus('none');
      }
    } catch (error: any) {
      console.error("Error fetching membership status:", error);
    }
  };

  const handleJoinOrganization = async () => {
    if (!user || !id) {
      toast.error("Please sign in to join organizations");
      return;
    }

    if (!canJoin()) {
      toast.error("You are not eligible to join this organization");
      return;
    }

    setMembershipLoading(true);
    try {
      const { error } = await supabase
        .from("memberships")
        .insert({
          org_id: id,
          user_id: user.id,
          status: 'pending',
          role: 'member'
        });

      if (error) throw error;
      toast.success("Join request sent! Waiting for approval.");
      setMembershipStatus('pending');
    } catch (error: any) {
      toast.error(error.message || "Failed to send join request");
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!user || !id) return;

    setIsLeaving(true);
    try {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("org_id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("You have left the organization");
      setMembershipStatus('none');
      setLeaveConfirmationOpen(false);
      setConfirmText("");
      
      // Refresh public stats after leaving
      fetchOrgPublicStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to leave organization");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'announcement') {
        const { error } = await supabase
          .from("announcements")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;
        toast.success("Announcement deleted");
        setAnnouncements(announcements.filter(a => a.id !== deleteTarget.id));
      } else {
        const { error } = await supabase
          .from("events")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;
        
        // Remove from either upcoming or past events
        setEvents(events.filter(e => e.id !== deleteTarget.id));
        setPastEvents(pastEvents.filter(e => e.id !== deleteTarget.id));
        
        toast.success("Event deleted");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setEditForm({ ...editForm, title: announcement.title, content: announcement.content });
  };

  const openEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditForm({
      ...editForm,
      name: event.name,
      description: event.description || '',
      location: event.location || '',
      event_date: event.event_date.slice(0, 16),
    });
  };

  const handleSaveAnnouncement = async () => {
    if (!editingAnnouncement) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ title: editForm.title, content: editForm.content })
        .eq("id", editingAnnouncement.id);

      if (error) throw error;
      toast.success("Announcement updated");
      setAnnouncements(announcements.map(a =>
        a.id === editingAnnouncement.id ? { ...a, title: editForm.title, content: editForm.content } : a
      ));
      setEditingAnnouncement(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!editingEvent) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({
          name: editForm.name,
          description: editForm.description,
          location: editForm.location,
          event_date: editForm.event_date,
        })
        .eq("id", editingEvent.id);

      if (error) throw error;
      toast.success("Event updated");
      
      // Refresh events to re-sort between upcoming/past
      const { data: upcomingData } = await supabase
        .from("events")
        .select("*")
        .eq("org_id", id)
        .eq("status", "approved")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      const { data: pastData } = await supabase
        .from("events")
        .select("*")
        .eq("org_id", id)
        .eq("status", "approved")
        .lt("event_date", new Date().toISOString())
        .order("event_date", { ascending: false });

      setEvents(upcomingData || []);
      setPastEvents(pastData || []);
      
      setEditingEvent(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    } finally {
      setSaving(false);
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

  const isPastEvent = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedPhoto(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Organization not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/explore")}>Back to Explore</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Fixed back button - always goes to explore */}
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Explore
        </Button>

        {/* Organization Header Card */}
        <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <OrgLogo src={organization.profile_picture} alt={organization.name} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {organization.name}
                </h1>
                <Badge variant={organization.is_shs_org ? "secondary" : "outline"}>
                  {organization.is_shs_org ? "SHS Organization" : "College Organization"}
                </Badge>
              </div>
              
              {/* Member Count and Leader Info - Using public stats */}
              <div className="flex items-center gap-6 text-sm mb-4">
                {orgStats.leader_name && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Leader:</span>
                      <span className="font-medium">{orgStats.leader_name}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                  </>
                )}
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{orgStats.member_count}</span>
                  <span className="text-muted-foreground">members</span>
                </div>
              </div>

              {/* Description */}
              {organization.description && (
                <p className="text-muted-foreground mb-4">{organization.description}</p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Link to={`/org/${id}/documents`}>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    View Documents
                  </Button>
                </Link>
                
                {/* Join button - only shows if user can actually join */}
                {user && canJoin() && membershipStatus === 'none' && (
                  <Button 
                    size="sm" 
                    onClick={handleJoinOrganization}
                    disabled={membershipLoading}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {membershipLoading ? "Joining..." : "Join Organization"}
                  </Button>
                )}
                
                {/* Pending request button */}
                {user && membershipStatus === 'pending' && (
                  <Button size="sm" variant="secondary" disabled>
                    <Clock className="mr-2 h-4 w-4" />
                    Request Pending
                  </Button>
                )}
                
                {/* Leave button - only for members who are not officers/leaders */}
                {user && membershipStatus === 'accepted' && !isOfficer && !isLeader && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => setLeaveConfirmationOpen(true)}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Leave Organization
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section */}
        {photos.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-center mb-6 flex items-center justify-center gap-2">
            </h2>
            <div className="flex justify-center">
              <div 
                className="grid gap-6 justify-items-center"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(photos.length, 4)}, minmax(0, 1fr))`,
                  maxWidth: photos.length === 1 ? '300px' : 
                          photos.length === 2 ? '650px' : 
                          photos.length === 3 ? '1000px' : '1200px',
                  margin: '0 auto',
                }}
              >
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => openLightbox(photo)}
                    className="group relative aspect-square w-full rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'Organization photo'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {photo.caption && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="absolute bottom-2 left-2 right-2 text-sm text-white line-clamp-2 text-center">
                          {photo.caption}
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid - Announcements and Events */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Announcements (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>Latest updates from the organization</CardDescription>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No announcements yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="rounded-lg border bg-card p-4"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-semibold text-foreground">
                            {announcement.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(announcement.created_at), "MMM d")}
                            </span>
                            {canEditAnnouncements && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditAnnouncement(announcement)}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                            {canDeleteAnnouncements && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteTarget({ type: 'announcement', id: announcement.id })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {announcement.image_url && (
                          <div className="mb-3 flex justify-center bg-gray-50 rounded-lg p-2">
                            <img
                              src={announcement.image_url}
                              alt={announcement.title}
                              className="max-w-full h-auto rounded-lg object-contain"
                              style={{ 
                                maxHeight: '70vh',
                                width: 'auto'
                              }}
                            />
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {announcement.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Events and Members (1/3 width) */}
          <div className="space-y-6">
            {/* Events with Tabs */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Events
                </CardTitle>
              </CardHeader>
              
              {/* Tab Navigation */}
              <div className="px-6">
                <Tabs value={activeEventTab} onValueChange={(v) => setActiveEventTab(v as 'upcoming' | 'past')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upcoming" className="flex items-center gap-2">
                      Upcoming
                      {events.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                          {events.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="past" className="flex items-center gap-2">
                      Past
                      {pastEvents.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                          {pastEvents.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Upcoming Events Tab Content */}
                  <TabsContent value="upcoming" className="mt-0">
                    {events.length === 0 ? (
                      <div className="py-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No upcoming events scheduled
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {events.map((event) => {
                          const eventDate = new Date(event.event_date);
                          
                          return (
                            <div
                              key={event.id}
                              className="group rounded-lg border bg-card p-4 hover:shadow-md transition-all"
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
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-foreground truncate">
                                      {event.name}
                                    </h4>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {canEditEvents && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => openEditEvent(event)}
                                        >
                                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                      )}
                                      {canDeleteEvents && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => setDeleteTarget({ type: 'event', id: event.id })}
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Date & Time */}
                                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(eventDate, "h:mm a")}
                                  </div>
                                  
                                  {/* Location */}
                                  {event.location && (
                                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  )}
                                  
                                  {/* Description */}
                                  {event.description && (
                                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 border-t pt-2">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Past Events Tab Content */}
                  <TabsContent value="past" className="mt-0">
                    {pastEvents.length === 0 ? (
                      <div className="py-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No past events found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {pastEvents.map((event) => {
                          const eventDate = new Date(event.event_date);
                          
                          return (
                            <div
                              key={event.id}
                              className="group rounded-lg border bg-card p-4 opacity-75 hover:opacity-100 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                {/* Date Box - Past styling */}
                                <div className="min-w-12 rounded-lg bg-muted p-2 text-center border border-muted">
                                  <div className="text-sm font-bold text-muted-foreground">
                                    {format(eventDate, "d")}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(eventDate, "MMM")}
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-foreground">
                                        {event.name}
                                      </h4>
                                      <Badge variant="outline" className="text-[10px] px-1.5">
                                        Past
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {canEditEvents && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => openEditEvent(event)}
                                        >
                                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                      )}
                                      {canDeleteEvents && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => setDeleteTarget({ type: 'event', id: event.id })}
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Date & Time */}
                                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(eventDate, "h:mm a")}
                                  </div>
                                  
                                  {/* Location */}
                                  {event.location && (
                                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </Card>

            {/* Active Members List - Only visible to members */}
            {isMember && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Members ({members.length})
                  </CardTitle>
                  <CardDescription>Current members of this organization</CardDescription>
                </CardHeader>
                <CardContent>
                  {members.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No members yet
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile_picture || undefined} />
                            <AvatarFallback className="bg-primary/10 text-xs">
                              {member.name ? getInitials(member.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member.name}
                            </p>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 mt-0.5">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
          {selectedPhoto && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={closeLightbox}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.caption || 'Organization photo'}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              {selectedPhoto.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-center">{selectedPhoto.caption}</p>
                </div>
              )}
              <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                {format(new Date(selectedPhoto.uploaded_at), "MMM d, yyyy")}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={leaveConfirmationOpen} onOpenChange={setLeaveConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Leave Organization
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  Are you sure you want to leave <strong>{organization?.name}</strong>?
                </p>
                
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm font-medium text-destructive">
                    ⚠️ This action cannot be undone. You will:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-destructive/80">
                    <li>• Lose access to all organization content</li>
                    <li>• Be removed from all organization events</li>
                    <li>• Need to re-apply if you want to join again</li>
                  </ul>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-sm">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm:
                  </p>
                  <Input
                    placeholder="Type DELETE here"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="font-mono"
                  />
                  {confirmText && confirmText !== "DELETE" && (
                    <p className="text-sm text-destructive">
                      ❌ Text doesn't match. Please type "DELETE" exactly.
                    </p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setConfirmText("");
                setLeaveConfirmationOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveOrganization}
              disabled={confirmText !== "DELETE" || isLeaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Leaving...
                </>
              ) : (
                "Leave Organization"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteTarget?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>Update the announcement details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>Cancel</Button>
            <Button onClick={handleSaveAnnouncement} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update the event details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Event Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date & Time</Label>
                <Input
                  id="edit-date"
                  type="datetime-local"
                  value={editForm.event_date}
                  onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button onClick={handleSaveEvent} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organization;