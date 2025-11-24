import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, FileText } from "lucide-react";

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
          organizations (name)
        `)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
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

  if (loading) {
    return <div>Loading events...</div>;
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
          <h3 className="text-lg font-semibold mb-3">Pending Requests ({pendingEvents.length})</h3>
          {pendingEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending events</p>
          ) : (
            <div className="space-y-3">
              {pendingEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold">{event.name}</h4>
                      <p className="text-sm text-muted-foreground">{event.organizations?.name}</p>
                      {event.description && (
                        <p className="text-sm mt-2">{event.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {event.visibility === "public" ? "Public" : "Private"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.event_date), "MMM dd, yyyy")}
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
                  </div>

                  {event.document_url && (
                    <div className="pt-2 border-t">
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

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateEventStatus(event.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateEventStatus(event.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Events */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Approved Events ({approvedEvents.length})</h3>
          {approvedEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No approved events</p>
          ) : (
            <div className="space-y-2">
              {approvedEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.organizations?.name} • {format(new Date(event.event_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Badge>Approved</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejected Events */}
        {rejectedEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Rejected Events ({rejectedEvents.length})</h3>
            <div className="space-y-2">
              {rejectedEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.organizations?.name} • {format(new Date(event.event_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Badge variant="destructive">Rejected</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
