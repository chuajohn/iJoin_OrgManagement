import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, User, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type UserWithRole = {
  id: string;
  email: string;
  name: string;
  role: 'senior_highschool_student' | 'undergraduate_student' | 'sao' | 'admin';
  organizations: {
    id: string;
    name: string;
    role: string;
    is_shs_org: boolean;
  }[];
};

type AppRole = 'senior_highschool_student' | 'undergraduate_student' | 'sao' | 'admin';

export function UserRoleManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users whenever search query or users change
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, name")
        .order("name");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch all active memberships with organization details
      const { data: memberships, error: membershipsError } = await supabase
        .from("memberships")
        .select(`
          user_id,
          role,
          status,
          organization:organizations (
            id,
            name,
            is_shs_org
          )
        `)
        .eq("status", "accepted");

      if (membershipsError) throw membershipsError;

      // Combine the data
      const usersWithDetails = profiles?.map(profile => {
        // Get user's role
        const userRole = roles?.find(r => r.user_id === profile.id)?.role || 'undergraduate_student';
        
        // Get user's organizations (filter out any null organizations)
        const userOrgs = memberships
          ?.filter(m => m.user_id === profile.id && m.organization !== null)
          .map(m => ({
            id: m.organization!.id,
            name: m.organization!.name,
            role: m.role,
            is_shs_org: m.organization!.is_shs_org
          })) || [];

        return {
          ...profile,
          role: userRole as UserWithRole['role'],
          organizations: userOrgs
        };
      }) || [];

      setUsers(usersWithDetails);
      setFilteredUsers(usersWithDetails);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Cast the string to AppRole type
      const role = newRole as AppRole;
      
      const { error } = await supabase
        .from("user_roles")
        .update({ role }) // Now TypeScript knows this is the correct type
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update user role");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'sao':
        return 'default';
      case 'senior_highschool_student':
        return 'secondary';
      case 'undergraduate_student':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'senior_highschool_student':
        return 'SHS Student';
      case 'undergraduate_student':
        return 'Undergraduate';
      case 'sao':
        return 'SAO';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  const getOrgRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'leader':
        return 'default';
      case 'officer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Role Management</CardTitle>
            <CardDescription>
              View and manage system-wide roles. Users can only join organizations matching their student type.
            </CardDescription>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Results Summary */}
        {searchQuery && (
          <div className="mb-4 text-sm text-muted-foreground">
            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} 
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">User</TableHead>
                <TableHead className="w-[200px]">System Role</TableHead>
                <TableHead>Organizations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    {searchQuery ? (
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No users found matching "{searchQuery}"
                        </p>
                        <Button 
                          variant="link" 
                          onClick={clearSearch}
                          className="text-primary"
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No users found</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group">
                    {/* User Info */}
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {user.name || 'Unnamed'}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="break-all">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* System Role Dropdown */}
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="senior_highschool_student">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">SHS Student</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="undergraduate_student">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Undergraduate</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="sao">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">SAO</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">Admin</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Organizations Column */}
                    <TableCell>
                      {user.organizations.length === 0 ? (
                        <span className="text-sm text-muted-foreground italic">
                          No organizations
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.organizations.map((org) => (
                            <div
                              key={org.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1 text-sm"
                            >
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{org.name}</span>
                              {org.is_shs_org && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  SHS
                                </Badge>
                              )}
                              <Badge 
                                variant={getOrgRoleBadgeVariant(org.role)}
                                className="text-[10px] px-1.5 py-0 ml-1"
                              >
                                {org.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="h-2 w-2 p-0" />
              <span>Admin: {users.filter(u => u.role === 'admin').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="h-2 w-2 p-0" />
              <span>SAO: {users.filter(u => u.role === 'sao').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-2 w-2 p-0" />
              <span>SHS: {users.filter(u => u.role === 'senior_highschool_student').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-2 w-2 p-0" />
              <span>Undergrad: {users.filter(u => u.role === 'undergraduate_student').length}</span>
            </div>
          </div>
          
          {/* Total Users */}
          <div className="text-sm text-muted-foreground">
            Total Users: <span className="font-medium text-foreground">{users.length}</span>
            {filteredUsers.length !== users.length && (
              <span className="ml-1">
                (showing <span className="font-medium">{filteredUsers.length}</span>)
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}