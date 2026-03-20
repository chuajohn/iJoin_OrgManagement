import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Mail, User, Search, X, Calendar, Shield, Crown, School, GraduationCap, Users, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type UserWithRole = {
  id: string;
  email: string;
  name: string;
  profile_picture: string | null;
  created_at: string;
  role: 'senior_highschool_student' | 'undergraduate_student' | 'sao' | 'admin';
  organizations: {
    id: string;
    name: string;
    role: string;
    is_shs_org: boolean;
    joined_at: string;
  }[];
};

type AppRole = 'senior_highschool_student' | 'undergraduate_student' | 'sao' | 'admin';
type FilterType = 'all' | 'shs' | 'ug' | 'sao' | 'admin';

interface FilterOption {
  id: FilterType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverColor: string;
  borderColor: string;
  count?: number;
}

export function UserRoleManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...users];

    // Apply role filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (activeFilter === 'shs') return user.role === 'senior_highschool_student';
        if (activeFilter === 'ug') return user.role === 'undergraduate_student';
        if (activeFilter === 'sao') return user.role === 'sao';
        if (activeFilter === 'admin') return user.role === 'admin';
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, activeFilter]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles with profile_picture
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, name, profile_picture, created_at")
        .order("name");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch all active memberships with organization details and joined_at
      const { data: memberships, error: membershipsError } = await supabase
        .from("memberships")
        .select(`
          user_id,
          role,
          status,
          joined_at,
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
            is_shs_org: m.organization!.is_shs_org,
            joined_at: m.joined_at
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
      const role = newRole as AppRole;
      
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      let error;
      
      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        error = updateError;
      } else {
        // Insert new role
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        error = insertError;
      }

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'sao':
        return <Shield className="h-3 w-3" />;
      case 'senior_highschool_student':
        return <School className="h-3 w-3" />;
      case 'undergraduate_student':
        return <GraduationCap className="h-3 w-3" />;
      default:
        return null;
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

  const getOrgRoleIcon = (role: string) => {
    switch (role) {
      case 'leader':
        return <Crown className="h-3 w-3" />;
      case 'officer':
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const filterOptions: FilterOption[] = [
    { 
      id: 'all', 
      label: 'All Users', 
      icon: <Users className="h-4 w-4" />,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      hoverColor: 'hover:bg-gray-200',
      borderColor: 'border-gray-300',
      count: users.length
    },
    { 
      id: 'shs', 
      label: 'SHS Students', 
      icon: <School className="h-4 w-4" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      borderColor: 'border-blue-300',
      count: users.filter(u => u.role === 'senior_highschool_student').length
    },
    { 
      id: 'ug', 
      label: 'Undergraduates', 
      icon: <GraduationCap className="h-4 w-4" />,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      borderColor: 'border-green-300',
      count: users.filter(u => u.role === 'undergraduate_student').length
    },
    { 
      id: 'sao', 
      label: 'SAO Members', 
      icon: <Shield className="h-4 w-4" />,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      borderColor: 'border-purple-300',
      count: users.filter(u => u.role === 'sao').length
    },
    { 
      id: 'admin', 
      label: 'Admins', 
      icon: <Shield className="h-4 w-4" />,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      hoverColor: 'hover:bg-red-100',
      borderColor: 'border-red-300',
      count: users.filter(u => u.role === 'admin').length
    },
  ];

  const activeFilterData = filterOptions.find(f => f.id === activeFilter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
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

        <CardContent className="space-y-4">
          {/* Modern Filter Chips - Keeping these */}
          <div className="flex items-center gap-2 flex-wrap pb-2">
            <div className="flex items-center mr-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4 mr-1" />
              <span>Filter by:</span>
            </div>
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  "border",
                  activeFilter === option.id 
                    ? `${option.bgColor} ${option.color} ${option.borderColor} shadow-sm` 
                    : "bg-white text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className={activeFilter === option.id ? option.color : "text-muted-foreground"}>
                  {option.icon}
                </span>
                <span>{option.label}</span>
                {option.count !== undefined && option.count > 0 && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "ml-1 px-1.5 py-0 text-xs",
                      activeFilter === option.id 
                        ? `${option.bgColor} ${option.color} border-0` 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {option.count}
                  </Badge>
                )}
              </button>
            ))}
            
            {activeFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('all')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear filter
              </Button>
            )}
          </div>

          {/* Search Results Summary */}
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} 
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}

          {/* Table - Expanded height for better scrolling */}
          <div className="rounded-md border">
            <div className="max-h-[70vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[350px]">User</TableHead>
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
                      <TableRow key={user.id} className="group hover:bg-muted/50">
                        {/* User Info */}
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={user.profile_picture || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(user.name || 'User')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <button
                                onClick={() => navigate(`/profile/${user.id}`)}
                                className="font-medium hover:text-primary hover:underline transition-colors text-left"
                              >
                                {user.name || 'Unnamed'}
                              </button>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="break-all">{user.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>Joined {format(new Date(user.created_at), "MMM d, yyyy")}</span>
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
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(user.role)}
                                  <span>{getRoleDisplayName(user.role)}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="senior_highschool_student">
                                <div className="flex items-center gap-2">
                                  <School className="h-4 w-4" />
                                  <span>SHS Student</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="undergraduate_student">
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>Undergraduate</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="sao">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  <span>SAO</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  <span>Admin</span>
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
                                <Tooltip key={org.id}>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => navigate(`/org/${org.id}`)}
                                      className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1 text-sm hover:bg-accent hover:border-primary transition-colors group"
                                    >
                                      <Building2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                                      <span className="font-medium max-w-[150px] truncate">
                                        {org.name}
                                      </span>
                                      {org.is_shs_org && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          SHS
                                        </Badge>
                                      )}
                                      <Badge 
                                        variant={getOrgRoleBadgeVariant(org.role)}
                                        className="text-[10px] px-1.5 py-0 ml-1 gap-0.5"
                                      >
                                        {getOrgRoleIcon(org.role)}
                                        <span className="ml-0.5">{org.role}</span>
                                      </Badge>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Joined {format(new Date(org.joined_at), "MMM d, yyyy")}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
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
          </div>

          {/* Summary Stats */}
          <div className="flex flex-wrap items-center justify-between pt-4">
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
    </TooltipProvider>
  );
}