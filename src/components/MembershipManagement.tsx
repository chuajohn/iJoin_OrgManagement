import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface MembershipManagementProps {
  orgId: string;
}

export function MembershipManagement({ orgId }: MembershipManagementProps) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, [orgId]);

  const fetchData = async () => {
    // Fetch accepted members
    const { data: membersData, error: membersError } = await supabase
      .from("memberships")
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id (name, email, profile_picture)
      `)
      .eq("org_id", orgId)
      .eq("status", "accepted")
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching members:", membersError);
    } else {
      setMembers(membersData || []);
    }

    // Fetch pending requests
    const { data: pendingData, error: pendingError } = await supabase
      .from("memberships")
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id (name, email, profile_picture)
      `)
      .eq("org_id", orgId)
      .eq("status", "pending")
      .order("joined_at", { ascending: false });

    if (pendingError) {
      console.error("Error fetching pending requests:", pendingError);
    } else {
      setPendingRequests(pendingData || []);
    }

    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`memberships-${orgId}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "memberships", 
          filter: `org_id=eq.${orgId}` 
        },
        () => fetchData()
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "leader":
        return <Badge variant="default">Leader</Badge>;
      case "officer":
        return <Badge variant="secondary">Officer</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
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
    <div className="space-y-6">
      {/* Members List Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
          <CardDescription>Current members of this organization</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No members yet</p>
              <p className="text-sm">Accept membership requests to add members</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profiles?.profile_picture} />
                      <AvatarFallback className="bg-primary/10">
                        {member.profiles?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {member.profiles?.name}
                        </p>
                        {getRoleBadge(member.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles?.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(member.joined_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Pending Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Membership Requests ({pendingRequests.length})
          </CardTitle>
          <CardDescription>Review and approve pending membership requests</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <UserCog className="h-12 w-12 mx-auto mb-3 opacity-50" />
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
                      <AvatarFallback className="bg-primary/10">
                        {request.profiles?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{request.profiles?.name}</p>
                      <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {new Date(request.joined_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending
                    </Badge>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleRequest(request.id, "accepted")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, "rejected")}
                      className="border-red-200 hover:bg-red-50 hover:text-red-600"
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
    </div>
  );
}