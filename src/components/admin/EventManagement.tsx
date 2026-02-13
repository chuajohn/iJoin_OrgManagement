import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, FileText, School, GraduationCap } from "lucide-react";

type Event = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  status: "pending" | "approved" | "rejected";
  visibility: "public" | "private";
  document_url: string | null;
  organizations: {
    name: string;
    is_shs_org: boolean;
  } | null;
};

export function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

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

  const getOrgTypeBadge = (is_shs_org: boolean) => {
    if (is_shs_org) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 gap-1 ml-2">
          <School className="h-3 w-3" />
          SHS
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1 ml-2">
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
    return <div className="flex justify-center p-8">Loading events...</div>;
  }

  const pendingEvents = events.filter((e) => e.status === "pending");
  const approvedEvents = events.filter((e) => e.status === "approved");
  const rejectedEvents = events.filter((e) => e.status === "rejected");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Management</CardTitle>
        <CardDescription>Approve or reject event requests from organizations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Pending Requests</h3>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {pendingEvents.length} pending
            </Badge>
          </div>
          
          {pendingEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No pending events</p>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map((event) => (
                <div key={event.id} className="border-2 border-yellow-200 bg-yellow-50/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h4 className="font-semibold text-lg">{event.name}</h4>
                        {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Hosted by:</span>
                        <span className="font-medium">{event.organizations?.name}</span>
                      </div>
                      {event.description && (
                        <p className="text-sm mt-2 bg-white/50 p-3 rounded-md border">
                          {event.description}
                        </p>
                      )}
                    </div>
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
                      Approve Event
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateEventStatus(event.id, "rejected")}
                    >
                      Reject Event
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Events */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Approved Events</h3>
            <Badge variant="default" className="bg-green-600">
              {approvedEvents.length} approved
            </Badge>
          </div>
          
          {approvedEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No approved events</p>
          ) : (
            <div className="space-y-3">
              {approvedEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{event.name}</h4>
                        {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.organizations?.name}
                      </p>
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
                    <Badge variant="default" className="bg-green-600">
                      Approved
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejected Events */}
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
                <div key={event.id} className="border border-destructive/20 bg-destructive/5 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{event.name}</p>
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
      </CardContent>
    </Card>
  );
}