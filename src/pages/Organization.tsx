import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, MapPin, Trash2, Pencil, FileText, UserPlus, UserMinus, Clock } from "lucide-react";
import OrgLogo from "@/components/OrgLogo";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
}

const Organization = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOfficer, isLeader, isSAO, isAdmin } = useUserRole(id);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
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

  useEffect(() => {
    if (id) {
      fetchOrganizationData();
      if (user) {
        fetchMembershipStatus();
      }
    }
  }, [id, user]);

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

    setMembershipLoading(true);
    try {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("org_id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("You have left the organization");
      setMembershipStatus('none');
    } catch (error: any) {
      toast.error(error.message || "Failed to leave organization");
    } finally {
      setMembershipLoading(false);
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

      // Fetch events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("org_id", id)
        .eq("status", "approved")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      setEvents(eventsData || []);
    } catch (error: any) {
      console.error("Error fetching organization data:", error);
      toast.error("Failed to load organization");
    } finally {
      setLoading(false);
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
        toast.success("Event deleted");
        setEvents(events.filter(e => e.id !== deleteTarget.id));
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
      setEvents(events.map(e =>
        e.id === editingEvent.id ? { ...e, name: editForm.name, description: editForm.description, location: editForm.location, event_date: editForm.event_date } : e
      ));
      setEditingEvent(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    } finally {
      setSaving(false);
    }
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
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Organization Header */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <div className="flex items-start gap-6">
            <OrgLogo src={organization.profile_picture} alt={organization.name} size="lg" />
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-foreground">
                {organization.name}
              </h1>
              {organization.description && (
                <p className="text-muted-foreground">{organization.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/org/${id}/documents`}>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    View Documents
                  </Button>
                </Link>
                
                {user && !isOfficer && !isLeader && (
                  <>
                    {membershipStatus === 'none' && (
                      <Button 
                        size="sm" 
                        onClick={handleJoinOrganization}
                        disabled={membershipLoading}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {membershipLoading ? "Joining..." : "Join Organization"}
                      </Button>
                    )}
                    {membershipStatus === 'pending' && (
                      <Button size="sm" variant="secondary" disabled>
                        <Clock className="mr-2 h-4 w-4" />
                        Request Pending
                      </Button>
                    )}
                    {membershipStatus === 'accepted' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={handleLeaveOrganization}
                        disabled={membershipLoading}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        {membershipLoading ? "Leaving..." : "Leave Organization"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
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
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="mb-3 w-full rounded-lg object-cover max-h-64"
                        />
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

          {/* Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Don't miss these events</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No upcoming events
                </p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border bg-card p-4"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-foreground">{event.name}</h3>
                        <div className="flex items-center gap-1">
                          {canEditEvents && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditEvent(event)}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {canDeleteEvents && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteTarget({ type: 'event', id: event.id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(event.event_date), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                      {event.location && (
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
