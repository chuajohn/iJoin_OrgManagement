import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarCheck, CalendarX, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RSVPButtonProps {
  eventId: string;
  eventName: string;
  visibility?: string; // Changed from 'public' | 'private' to string
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showCount?: boolean;
}

type RSVPStatusType = 'registered' | 'cancelled' | 'attended' | null;

interface RSVPStatus {
  status: RSVPStatusType;
  count: {
    registered: number;
    cancelled: number;
    attended: number;
    total: number;
  };
}

export function RSVPButton({ 
  eventId, 
  eventName, 
  visibility = 'public',
  className,
  variant = 'default',
  size = 'default',
  showCount = true
}: RSVPButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>({
    status: null,
    count: { registered: 0, cancelled: 0, attended: 0, total: 0 }
  });

  useEffect(() => {
    fetchRSVPStatus();
  }, [eventId, user]);

  const fetchRSVPStatus = async () => {
    try {
      // Get user's RSVP status
      if (user) {
        const { data: userRsvp } = await supabase
          .from("rsvp")
          .select("status")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle();
        
        const status = userRsvp?.status as RSVPStatusType || null;
        
        setRsvpStatus(prev => ({
          ...prev,
          status
        }));
      }

      // Get RSVP count
      const { data: countData } = await supabase
        .rpc('get_event_rsvp_count', { event_uuid: eventId });

      if (countData && countData[0]) {
        setRsvpStatus(prev => ({
          ...prev,
          count: countData[0]
        }));
      }
    } catch (error) {
      console.error("Error fetching RSVP status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!user) {
      toast.error("Please sign in to RSVP for events");
      return;
    }

    setActionLoading(true);
    try {
      if (rsvpStatus.status === 'registered') {
        // Cancel RSVP
        const { error } = await supabase
          .from("rsvp")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
        
        setRsvpStatus(prev => ({
          ...prev,
          status: null,
          count: {
            ...prev.count,
            registered: prev.count.registered - 1,
            total: prev.count.total - 1
          }
        }));
        toast.success(`Removed from ${eventName}`);
      } else {
        // Register for event
        const { error } = await supabase
          .from("rsvp")
          .insert({
            event_id: eventId,
            user_id: user.id,
            status: 'registered'
          });

        if (error) throw error;
        
        setRsvpStatus(prev => ({
          ...prev,
          status: 'registered',
          count: {
            ...prev.count,
            registered: prev.count.registered + 1,
            total: prev.count.total + 1
          }
        }));
        toast.success(`Registered for ${eventName}!`);
      }
      
      await fetchRSVPStatus();
    } catch (error) {
      console.error("Error updating RSVP:", error);
      toast.error("Failed to update registration");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className={className} size={size}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  const isRegistered = rsvpStatus.status === 'registered';
  const totalRegistered = rsvpStatus.count.registered;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showCount && totalRegistered > 0 && (
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {totalRegistered} registered
        </Badge>
      )}
      
      <Button
        onClick={handleRSVP}
        disabled={actionLoading}
        variant={isRegistered ? "outline" : variant}
        size={size}
        className={cn(
          isRegistered && "border-green-500 text-green-600 hover:bg-green-50",
          !isRegistered && variant === 'default' && "bg-[#00A3FF] hover:bg-[#00A3FF]/90"
        )}
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : isRegistered ? (
          <CalendarX className="h-4 w-4 mr-2" />
        ) : (
          <CalendarCheck className="h-4 w-4 mr-2" />
        )}
        {isRegistered ? "Cancel Registration" : "RSVP for Event"}
      </Button>
    </div>
  );
}