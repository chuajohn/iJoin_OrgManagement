import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, X, UserCog, Users, Shield, Crown, User, Loader2, Calendar, ChevronDown, ArrowUpDown, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useUserRole } from "@/hooks/useUserRole";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MembershipManagementProps {
  orgId: string;
}

type SortOrder = 'newest' | 'oldest';

export function MembershipManagement({ orgId }: MembershipManagementProps) {
  const navigate = useNavigate();
  const { isLeader, isAdmin, isSAO } = useUserRole(orgId);
  const { refresh: refreshPendingCounts } = usePendingRequests();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [processingBulk, setProcessingBulk] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  
  // Remove member state
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, [orgId]);

  // Sort requests whenever pendingRequests or sortOrder changes
  const getSortedRequests = () => {
    const sorted = [...pendingRequests];
    
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
    } else {
      sorted.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
    }
    
    return sorted;
  };

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

    // Fetch pending requests (initially sorted by newest)
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
      .order("joined_at", { ascending: false }); // Newest first by default

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
        () => {
          fetchData();
          refreshPendingCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRequest = async (membershipId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("memberships")
        .update({ status })
        .eq("id", membershipId);

      if (error) throw error;

      setSelectedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });

      await fetchData();
      await refreshPendingCounts();
      toast.success(`Membership request ${status}`);
    } catch (error) {
      toast.error("Failed to update membership request");
    }
  };

  const handleBulkAction = async (status: "accepted" | "rejected") => {
    if (selectedRequests.size === 0) {
      toast.error("No requests selected");
      return;
    }

    setProcessingBulk(true);
    try {
      const { error } = await supabase
        .from("memberships")
        .update({ status })
        .in("id", Array.from(selectedRequests));

      if (error) throw error;

      await fetchData();
      await refreshPendingCounts();
      setSelectedRequests(new Set());
      toast.success(`${selectedRequests.size} requests ${status}`);
    } catch (error) {
      toast.error(`Failed to ${status} selected requests`);
    } finally {
      setProcessingBulk(false);
    }
  };

  const toggleSelectAll = () => {
    const sortedRequests = getSortedRequests();
    if (selectedRequests.size === sortedRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(sortedRequests.map(r => r.id)));
    }
  };

  const toggleSelectRequest = (id: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleRoleChange = async (membershipId: string, newRole: string, memberName: string) => {
    if (newRole === "leader") {
      toast.error("Only system administrators can assign leader roles");
      return;
    }

    const validRole = newRole as "member" | "officer";
    
    setUpdatingRole(membershipId);
    try {
      const { error } = await supabase
        .from("memberships")
        .update({ role: validRole })
        .eq("id", membershipId);

      if (error) throw error;

      await fetchData();
      toast.success(`${memberName} is now an ${validRole === "officer" ? "officer" : "member"}`);
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    setRemovingMember(true);
    try {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", memberToRemove.id);

      if (error) throw error;

      toast.success(`${memberToRemove.profiles?.name} has been removed from the organization`);
      setMemberToRemove(null);
      setConfirmText("");
      await fetchData();
      await refreshPendingCounts();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    } finally {
      setRemovingMember(false);
    }
  };

  const handleViewProfile = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "leader":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "officer":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "leader":
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Leader</Badge>;
      case "officer":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Officer</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  const canModifyRole = (memberRole: string) => {
    if (isAdmin || isSAO) return true;
    if (isLeader && memberRole !== "leader") return true;
    return false;
  };

  const canRemoveMember = (memberRole: string) => {
    // Leaders can remove members and officers, but not other leaders
    if (isAdmin || isSAO) return true;
    if (isLeader && memberRole !== "leader") return true;
    return false;
  };

  const sortedRequests = getSortedRequests();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Members List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({members.length})
            </CardTitle>
            <CardDescription>
              {isLeader && "You can promote members to officers and remove members (leaders cannot be modified)"}
              {(isAdmin || isSAO) && "You have full control over all roles"}
            </CardDescription>
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
                {members.map((member) => {
                  const canModify = canModifyRole(member.role);
                  const canRemove = canRemoveMember(member.role);
                  const isUpdating = updatingRole === member.id;
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => handleViewProfile(member.user_id, e)}
                              className="relative"
                            >
                              <Avatar className="h-10 w-10 cursor-pointer transition-transform group-hover:scale-105">
                                <AvatarImage src={member.profiles?.profile_picture} />
                                <AvatarFallback className="bg-primary/10">
                                  {member.profiles?.name ? getInitials(member.profiles.name) : "U"}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View {member.profiles?.name}'s profile</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleViewProfile(member.user_id, e)}
                              className="font-semibold text-foreground hover:text-primary hover:underline transition-colors text-left"
                            >
                              {member.profiles?.name}
                            </button>
                            {getRoleBadge(member.role)}
                            {getRoleIcon(member.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined {format(new Date(member.joined_at), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Role Management Dropdown */}
                        {canModify && member.role !== "leader" && (
                          <div className="min-w-[140px]">
                            {isUpdating ? (
                              <div className="flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              <Select
                                value={member.role}
                                onValueChange={(value) => 
                                  handleRoleChange(member.id, value, member.profiles?.name)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      Member
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="officer">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-4 w-4" />
                                      Officer
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}

                        {/* Remove Member Button */}
                        {canRemove && member.role !== "leader" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setMemberToRemove(member)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove member from organization</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Show disabled state for leaders */}
                        {member.role === "leader" && (isLeader || isAdmin || isSAO) && (
                          <div className="text-xs text-muted-foreground italic">
                            Leaders cannot be modified
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Pending Requests Section with Mass Approval */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                <CardTitle>
                  Membership Requests
                  {pendingRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </CardTitle>
              </div>
              
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOrder('newest')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Newest first
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Oldest first
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CardDescription className="mt-2">
              Review and approve pending membership requests
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending membership requests</p>
              </div>
            ) : (
              <>
                {/* Bulk Actions Bar */}
                {sortedRequests.length > 0 && (
                  <div className="mb-4 flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedRequests.size === sortedRequests.length}
                          onCheckedChange={toggleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">
                          Select All ({selectedRequests.size}/{sortedRequests.length})
                        </label>
                      </div>
                      
                      {selectedRequests.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleBulkAction("accepted")}
                            disabled={processingBulk}
                          >
                            {processingBulk ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Accept Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleBulkAction("rejected")}
                            disabled={processingBulk}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject Selected
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Requests List */}
                <div className="space-y-4">
                  {sortedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/5 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedRequests.has(request.id)}
                          onCheckedChange={() => toggleSelectRequest(request.id)}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => handleViewProfile(request.user_id, e)}
                              className="relative"
                            >
                              <Avatar className="h-10 w-10 cursor-pointer transition-transform group-hover:scale-105">
                                <AvatarImage src={request.profiles?.profile_picture} />
                                <AvatarFallback className="bg-primary/10">
                                  {request.profiles?.name ? getInitials(request.profiles.name) : "U"}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View {request.profiles?.name}'s profile</p>
                          </TooltipContent>
                        </Tooltip>
                        <div>
                          <button
                            onClick={(e) => handleViewProfile(request.user_id, e)}
                            className="font-semibold text-foreground hover:text-primary hover:underline transition-colors text-left"
                          >
                            {request.profiles?.name}
                          </button>
                          <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              Requested {format(new Date(request.joined_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleRequest(request.id, "accepted")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Accept request</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRequest(request.id, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reject request</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => {
        setMemberToRemove(null);
        setConfirmText("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Remove Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  Are you sure you want to remove <strong>{memberToRemove?.profiles?.name}</strong> from this organization?
                </p>
                
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm font-medium text-destructive">
                    ⚠️ This action cannot be undone. This member will:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-destructive/80">
                    <li>• Lose access to all organization content</li>
                    <li>• Be removed from all organization events</li>
                    <li>• Need to re-apply if they want to join again</li>
                  </ul>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-sm">
                    Type <span className="font-mono font-bold">REMOVE</span> to confirm:
                  </p>
                  <Input
                    placeholder="Type REMOVE here"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="font-mono"
                  />
                  {confirmText && confirmText !== "REMOVE" && (
                    <p className="text-sm text-destructive">
                      ❌ Text doesn't match. Please type "REMOVE" exactly.
                    </p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setMemberToRemove(null);
                setConfirmText("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={confirmText !== "REMOVE" || removingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingMember ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}