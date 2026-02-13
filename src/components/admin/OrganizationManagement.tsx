import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, School, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  created_by: string;
  is_shs_org: boolean; // Add this field
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
  profiles: {
    name: string;
    email: string;
  };
};

type OrgRole = 'member' | 'officer' | 'leader';

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

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
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    if (members[orgId]) return;

    try {
      const { data } = await supabase
        .from("memberships")
        .select(`
          id,
          user_id,
          role,
          status,
          profiles:user_id (name, email)
        `)
        .eq("org_id", orgId);

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

      // Create leader membership for the creator
      const { error: memberError } = await supabase
        .from("memberships")
        .insert({
          user_id: org.created_by,
          org_id: org.id,
          role: "leader",
          status: "accepted"
        });

      if (memberError) throw memberError;

      toast.success(`Organization "${org.name}" approved successfully`);
      fetchOrganizations();
    } catch (error) {
      console.error("Error approving organization:", error);
      toast.error("Failed to approve organization");
    }
  };

  const rejectOrganization = async (orgId: string, orgName: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status: "hold" }) // Change from "rejected" to "hold"
        .eq("id", orgId);

      if (error) throw error;

      toast.success(`Organization "${orgName}" rejected and placed on hold`);
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
        .update({ status: newStatus as "pending" | "active" | "hold" | "hiatus"})
        .eq("id", orgId);

      if (error) throw error;

      toast.success("Organization status updated");
      fetchOrganizations();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update organization status");
    }
  };

  const updateMemberRole = async (membershipId: string, orgId: string, newRole: string) => {
    try {
      const role = newRole as OrgRole;
      
      const { error } = await supabase
        .from("memberships")
        .update({ role })
        .eq("id", membershipId);

      if (error) throw error;

      toast.success("Member role updated");
      
      const { data } = await supabase
        .from("memberships")
        .select(`
          id,
          user_id,
          role,
          status,
          profiles:user_id (
            name,
            email
          )
        `)
        .eq("org_id", orgId);

      if (data) {
        const transformedMembers = data
          .filter((item: any) => item.profiles !== null)
          .map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            role: item.role as 'member' | 'officer' | 'leader',
            status: item.status,
            profiles: {
              name: item.profiles.name,
              email: item.profiles.email
            }
          }));
        
        setMembers(prev => ({ ...prev, [orgId]: transformedMembers }));
      }
      
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update member role");
    }
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

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // Separate pending organizations from the rest
  const pendingOrgs = organizations.filter(org => org.status === "pending");
  const otherOrgs = organizations.filter(org => org.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Management</CardTitle>
        <CardDescription>
          Approve pending requests and manage organizations
        </CardDescription>
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
                  className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg"
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
                        <h3 className="font-semibold text-lg">{org.name}</h3>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          pending
                        </Badge>
                        {getOrgTypeBadge(org.is_shs_org)}
                      </div>
                      
                      {org.description && (
                        <p className="text-sm text-muted-foreground">{org.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Requested by <span className="font-medium text-foreground">{org.profiles?.name || "Unknown"}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(org.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
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
                    </div>
                  </div>

                  {expandedOrg === org.id && members[org.id] && (
                    <div className="border-t border-yellow-200 dark:border-yellow-800 p-4">
                      <h4 className="font-semibold mb-4">Members</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members[org.id].map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>{member.profiles.name}</TableCell>
                              <TableCell>{member.profiles.email}</TableCell>
                              <TableCell>
                                <Select
                                  value={member.role}
                                  onValueChange={(value: OrgRole) =>
                                    updateMemberRole(member.id, org.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="officer">Officer</SelectItem>
                                    <SelectItem value="leader">Leader</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <span className="capitalize">{member.status}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                <Badge variant="outline">Active Organizations</Badge>
                <span className="text-sm text-muted-foreground">
                  {otherOrgs.length} organization{otherOrgs.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {otherOrgs.map((org) => (
                <div key={org.id} className="border rounded-lg">
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
                        <h3 className="font-semibold">{org.name}</h3>
                        <Badge 
                          variant={org.status === "active" ? "default" : org.status === "hold" ? "secondary" : "outline"}
                        >
                          {org.status}
                        </Badge>
                        {getOrgTypeBadge(org.is_shs_org)}
                      </div>
                      
                      {org.description && (
                        <p className="text-sm text-muted-foreground">{org.description}</p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Created by {org.profiles?.name || "Unknown"} on {new Date(org.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Select
                      value={org.status}
                      onValueChange={(value) => updateOrgStatus(org.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                        <SelectItem value="hiatus">Hiatus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {expandedOrg === org.id && members[org.id] && (
                    <div className="border-t p-4">
                      <h4 className="font-semibold mb-4">Members</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members[org.id].map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>{member.profiles.name}</TableCell>
                              <TableCell>{member.profiles.email}</TableCell>
                              <TableCell>
                                <Select
                                  value={member.role}
                                  onValueChange={(value: OrgRole) =>
                                    updateMemberRole(member.id, org.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="officer">Officer</SelectItem>
                                    <SelectItem value="leader">Leader</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <span className="capitalize">{member.status}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* NO ORGANIZATIONS STATE */}
          {organizations.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No organizations found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}