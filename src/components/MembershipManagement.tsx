import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, UserCog } from "lucide-react";
import { toast } from "sonner";

interface MembershipManagementProps {
  orgId: string;
}

export function MembershipManagement({ orgId }: MembershipManagementProps) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
    setupRealtimeSubscription();
  }, [orgId]);

  const fetchPendingRequests = async () => {
    const { data, error } = await supabase
      .from("memberships")
      .select("*, profiles(name, email, profile_picture)")
      .eq("org_id", orgId)
      .eq("status", "pending")
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending requests:", error);
    } else {
      setPendingRequests(data || []);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`memberships-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memberships", filter: `org_id=eq.${orgId}` },
        () => fetchPendingRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRequest = async (membershipId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase
      .from("memberships")
      .update({ status })
      .eq("id", membershipId);

    if (error) {
      toast.error("Failed to update membership request");
    } else {
      toast.success(`Membership request ${status}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Membership Requests
        </CardTitle>
        <CardDescription>Review and approve pending membership requests</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No pending membership requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={request.profiles?.profile_picture} />
                    <AvatarFallback>
                      {request.profiles?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{request.profiles?.name}</p>
                    <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pending</Badge>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleRequest(request.id, "accepted")}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequest(request.id, "rejected")}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
