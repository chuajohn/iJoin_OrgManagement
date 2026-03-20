import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  FileText, 
  School, 
  GraduationCap,
  Search,
  Filter,
  ExternalLink,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Copy,
  Users,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Event = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  status: "pending" | "approved" | "rejected";
  visibility: "public" | "private";
  document_url: string | null;
  org_id: string;
  organizations: {
    name: string;
    is_shs_org: boolean;
  } | null;
};

export function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(event => 
        typeFilter === "shs" ? event.organizations?.is_shs_org : !event.organizations?.is_shs_org
      );
    }

    setFilteredEvents(filtered);
  }, [searchQuery, statusFilter, typeFilter, events]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          name,
          description,
          event_date,
          location,
          status,
          visibility,
          document_url,
          org_id,
          organizations (
            name,
            is_shs_org
          )
        `)
        .order("event_date", { ascending: true });

      if (error) throw error;
      
      // Filter out events with null organizations
      const validEvents = data?.filter(event => event.organizations !== null) || [];
      setEvents(validEvents as Event[]);
      setFilteredEvents(validEvents as Event[]);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEventStatus = async (eventId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ status })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event ${status} successfully`,
      });

      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
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

  const getOrgTypeBadge = (is_shs_org: boolean) => {
    if (is_shs_org) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
          <School className="h-3 w-3" />
          SHS
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1">
          <GraduationCap className="h-3 w-3" />
          College
        </Badge>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingEvents = filteredEvents.filter((e) => e.status === "pending");
  const approvedEvents = filteredEvents.filter((e) => e.status === "approved");
  const rejectedEvents = filteredEvents.filter((e) => e.status === "rejected");

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>
                Approve or reject event requests from organizations
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="shs">SHS Only</SelectItem>
                  <SelectItem value="college">College Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results summary */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Total: {filteredEvents.length}
            </Badge>
            {pendingEvents.length > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                {pendingEvents.length} pending
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="outline" className="text-xs">
                Filtered by: {statusFilter}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* PENDING EVENTS SECTION */}
          {pendingEvents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Pending Approval
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {pendingEvents.length} event{pendingEvents.length !== 1 ? 's' : ''} waiting for review
                </span>
              </div>
              
              {pendingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="border-2 border-yellow-500 bg-yellow-50/50 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/org/${event.org_id}`}
                            className="font-semibold text-lg hover:text-primary hover:underline flex items-center gap-1 group"
                          >
                            {event.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Hosted by:</span>
                        <Link 
                          to={`/org/${event.org_id}`}
                          className="font-medium hover:text-primary hover:underline flex items-center gap-1"
                        >
                          {event.organizations?.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      {event.description && (
                        <p className="text-sm mt-2 bg-white/50 p-3 rounded-md border">
                          {event.description}
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(`/org/${event.org_id}`, '_blank')}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Organization
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(event.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Event ID
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground bg-white/50 p-3 rounded-md border">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.event_date), "EEEE, MMMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(event.event_date), "h:mm a")}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <Badge variant="outline">
                        {event.visibility === "public" ? "Public Event" : "Private Event"}
                      </Badge>
                    </div>
                  </div>

                  {event.document_url && (
                    <div className="bg-white/50 p-3 rounded-md border">
                      <a
                        href={event.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Event Document (PDF)
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => updateEventStatus(event.id, "approved")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateEventStatus(event.id, "rejected")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* APPROVED EVENTS SECTION */}
          {approvedEvents.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Approved Events</h3>
                <Badge variant="default" className="bg-green-600">
                  {approvedEvents.length} approved
                </Badge>
              </div>
              
              <div className="space-y-3">
                {approvedEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="border rounded-lg p-4 hover:bg-accent/5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link 
                            to={`/org/${event.org_id}`}
                            className="font-semibold hover:text-primary hover:underline flex items-center gap-1 group"
                          >
                            {event.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                          </Link>
                          {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Hosted by:</span>
                          <Link 
                            to={`/org/${event.org_id}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {event.organizations?.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(event.event_date), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.event_date), "h:mm a")}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          Approved
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/org/${event.org_id}`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Organization
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(event.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Event ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REJECTED EVENTS SECTION */}
          {rejectedEvents.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Rejected Events</h3>
                <Badge variant="destructive">
                  {rejectedEvents.length} rejected
                </Badge>
              </div>
              <div className="space-y-2">
                {rejectedEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="border border-destructive/20 bg-destructive/5 rounded-lg p-3 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/org/${event.org_id}`}
                            className="font-medium hover:text-primary hover:underline flex items-center gap-1"
                          >
                            {event.name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.organizations?.name} • {format(new Date(event.event_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NO EVENTS STATE */}
          {filteredEvents.length === 0 && (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-foreground mb-2">No events found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No events have been created yet"}
              </p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 h-2 w-2 p-0" />
                  <span>Pending: {events.filter(e => e.status === 'pending').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600 h-2 w-2 p-0" />
                  <span>Approved: {events.filter(e => e.status === 'approved').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="h-2 w-2 p-0" />
                  <span>Rejected: {events.filter(e => e.status === 'rejected').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 h-2 w-2 p-0" />
                  <span>SHS: {events.filter(e => e.organizations?.is_shs_org).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-2 w-2 p-0" />
                  <span>College: {events.filter(e => !e.organizations?.is_shs_org).length}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Total Events: <span className="font-medium text-foreground">{events.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}