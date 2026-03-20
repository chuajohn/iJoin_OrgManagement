import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, School, GraduationCap, ExternalLink, Calendar, Users, Building2, User, Clock, Filter, Search, MoreHorizontal, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Organization = {
  id: string;
  name: string;
  description: string | null;
  status: 'pending' | 'active' | 'hold' | 'hiatus';
  created_at: string;
  created_by: string;
  is_shs_org: boolean;
  profiles?: {
    name: string;
    email: string;
  };
};

type Member = {
  id: string;
  user_id: string;
  role: 'member' | 'officer' | 'leader';
  status: string;
  joined_at: string;
  profiles: {
    name: string;
    email: string;
    profile_picture?: string | null;
  };
};

type OrgRole = 'member' | 'officer' | 'leader';

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    let filtered = [...organizations];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(org => 
        typeFilter === "shs" ? org.is_shs_org : !org.is_shs_org
      );
    }

    setFilteredOrgs(filtered);
  }, [searchQuery, statusFilter, typeFilter, organizations]);

  const fetchOrganizations = async () => {
    try {
      const { data } = await supabase
        .from("organizations")
        .select(`
          *,
          profiles:created_by (name, email)
        `)
        .order("status", { ascending: true })
        .order("created_at", { ascending: false });

      if (data) {
        setOrganizations(data as any);
        setFilteredOrgs(data as any);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    try {
      const { data } = await supabase
        .from("memberships")
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          profiles:user_id (name, email, profile_picture)
        `)
        .eq("org_id", orgId)
        .eq("status", "accepted");

      if (data) {
        setMembers(prev => ({ ...prev, [orgId]: data as any }));
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    }
  };

  const toggleExpand = async (orgId: string) => {
    if (expandedOrg === orgId) {
      setExpandedOrg(null);
    } else {
      setExpandedOrg(orgId);
      await fetchMembers(orgId);
    }
  };

  const approveOrganization = async (org: Organization) => {
    try {
      // Update organization status to active
      const { error: orgError } = await supabase
        .from("organizations")
        .update({ status: "active" })
        .eq("id", org.id);

      if (orgError) throw orgError;

      // Check if creator already has a membership
      const { data: existingMember } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", org.created_by)
        .eq("org_id", org.id)
        .maybeSingle();

      if (existingMember) {
        // Update existing membership to leader
        const { error: updateError } = await supabase
          .from("memberships")
          .update({ role: "leader", status: "accepted" })
          .eq("id", existingMember.id);

        if (updateError) throw updateError;
      } else {
        // Add creator as leader
        const { error: memberError } = await supabase
          .from("memberships")
          .insert({
            user_id: org.created_by,
            org_id: org.id,
            role: "leader",
            status: "accepted",
            joined_at: new Date().toISOString()
          });

        if (memberError) throw memberError;
      }

      toast.success(`Organization "${org.name}" approved successfully. Creator is now the leader.`);
      fetchOrganizations();
      
    } catch (error: any) {
      console.error("Error approving organization:", error);
      toast.error(`Failed to approve organization: ${error.message}`);
    }
  };

  const rejectOrganization = async (orgId: string, orgName: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status: "hold" })
        .eq("id", orgId);

      if (error) throw error;

      toast.success(`Organization "${orgName}" moved to hold`);
      fetchOrganizations();
    } catch (error) {
      console.error("Error rejecting organization:", error);
      toast.error("Failed to reject organization");
    }
  };

  const updateOrgStatus = async (orgId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status: newStatus as "pending" | "active" | "hold" | "hiatus" })
        .eq("id", orgId);

      if (error) throw error;

      toast.success("Organization status updated");
      fetchOrganizations();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update organization status");
    }
  };

  const updateMemberRole = async (membershipId: string, orgId: string, newRole: string, memberName: string) => {
    setUpdatingRole(membershipId);
    try {
      const role = newRole as OrgRole;
      
      const { error } = await supabase
        .from("memberships")
        .update({ role })
        .eq("id", membershipId);

      if (error) throw error;

      toast.success(`${memberName} is now a ${role}`);
      
      // Refresh members for this org
      const { data } = await supabase
        .from("memberships")
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          profiles:user_id (name, email, profile_picture)
        `)
        .eq("org_id", orgId)
        .eq("status", "accepted");

      if (data) {
        setMembers(prev => ({ ...prev, [orgId]: data as any }));
      }
      
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update member role");
    } finally {
      setUpdatingRole(null);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader':
        return <Badge variant="default" className="bg-yellow-500">Leader</Badge>;
      case 'officer':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Officer</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'hold':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Hold</Badge>;
      case 'hiatus':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Hiatus</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingOrgs = filteredOrgs.filter(org => org.status === "pending");
  const otherOrgs = filteredOrgs.filter(org => org.status !== "pending");

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>
                Manage organizations, approve requests, and view members
              </CardDescription>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                  <SelectItem value="hiatus">Hiatus</SelectItem>
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
              Total: {filteredOrgs.length}
            </Badge>
            {pendingOrgs.length > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                {pendingOrgs.length} pending
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="outline" className="text-xs">
                Filtered by: {statusFilter}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* PENDING REQUESTS SECTION */}
            {pendingOrgs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pending Approval
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {pendingOrgs.length} organization{pendingOrgs.length !== 1 ? 's' : ''} waiting for review
                  </span>
                </div>
                
                {pendingOrgs.map((org) => (
                  <div 
                    key={org.id} 
                    className="border-2 border-yellow-500 bg-yellow-50/50 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4 p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(org.id)}
                        className="mt-1"
                      >
                        {expandedOrg === org.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            to={`/org/${org.id}`}
                            className="font-semibold text-lg hover:text-primary hover:underline flex items-center gap-1 group"
                          >
                            {org.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          {getStatusBadge(org.status)}
                          {getOrgTypeBadge(org.is_shs_org)}
                        </div>
                        
                        {org.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{org.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              Requested by <span className="font-medium text-foreground">{org.profiles?.name || "Unknown"}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(org.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveOrganization(org)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectOrganization(org.id, org.name)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/org/${org.id}`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(org.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {expandedOrg === org.id && members[org.id] && (
                      <div className="border-t border-yellow-200 p-4 bg-white/50">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Members ({members[org.id].length})
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {members[org.id].map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell>
                                    <Link 
                                      to={`/profile/${member.user_id}`}
                                      className="flex items-center gap-2 hover:text-primary group"
                                    >
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={member.profiles.profile_picture || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {getInitials(member.profiles.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium group-hover:underline">
                                        {member.profiles.name}
                                      </span>
                                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {member.profiles.email}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={member.role}
                                      onValueChange={(value) => 
                                        updateMemberRole(member.id, org.id, value, member.profiles.name)
                                      }
                                      disabled={updatingRole === member.id}
                                    >
                                      <SelectTrigger className="w-[130px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="officer">Officer</SelectItem>
                                        <SelectItem value="leader">Leader</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ACTIVE/HOLD/HIATUS ORGANIZATIONS SECTION */}
            {otherOrgs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Badge variant="outline">All Organizations</Badge>
                  <span className="text-sm text-muted-foreground">
                    {otherOrgs.length} organization{otherOrgs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {otherOrgs.map((org) => (
                  <div key={org.id} className="border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(org.id)}
                        className="mt-1"
                      >
                        {expandedOrg === org.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            to={`/org/${org.id}`}
                            className="font-semibold hover:text-primary hover:underline flex items-center gap-1 group"
                          >
                            {org.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          {getStatusBadge(org.status)}
                          {getOrgTypeBadge(org.is_shs_org)}
                        </div>
                        
                        {org.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{org.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Created by {org.profiles?.name || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(org.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={org.status}
                          onValueChange={(value) => updateOrgStatus(org.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="hold">Hold</SelectItem>
                            <SelectItem value="hiatus">Hiatus</SelectItem>
                          </SelectContent>
                        </Select>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/org/${org.id}`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(org.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {expandedOrg === org.id && members[org.id] && (
                      <div className="border-t p-4 bg-muted/20">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Members ({members[org.id].length})
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {members[org.id].map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell>
                                    <Link 
                                      to={`/profile/${member.user_id}`}
                                      className="flex items-center gap-2 hover:text-primary group"
                                    >
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={member.profiles.profile_picture || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {getInitials(member.profiles.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium group-hover:underline">
                                        {member.profiles.name}
                                      </span>
                                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {member.profiles.email}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={member.role}
                                      onValueChange={(value) => 
                                        updateMemberRole(member.id, org.id, value, member.profiles.name)
                                      }
                                      disabled={updatingRole === member.id}
                                    >
                                      <SelectTrigger className="w-[130px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="officer">Officer</SelectItem>
                                        <SelectItem value="leader">Leader</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* NO ORGANIZATIONS STATE */}
            {filteredOrgs.length === 0 && (
              <div className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium text-foreground mb-2">No organizations found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all" 
                    ? "Try adjusting your filters"
                    : "No organizations have been created yet"}
                </p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="h-2 w-2 p-0" />
                  <span>Pending: {organizations.filter(o => o.status === 'pending').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="h-2 w-2 p-0" />
                  <span>Active: {organizations.filter(o => o.status === 'active').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="h-2 w-2 p-0" />
                  <span>Hold: {organizations.filter(o => o.status === 'hold').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-2 w-2 p-0" />
                  <span>Hiatus: {organizations.filter(o => o.status === 'hiatus').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 h-2 w-2 p-0" />
                  <span>SHS: {organizations.filter(o => o.is_shs_org).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-2 w-2 p-0" />
                  <span>College: {organizations.filter(o => !o.is_shs_org).length}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Total Organizations: <span className="font-medium text-foreground">{organizations.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}