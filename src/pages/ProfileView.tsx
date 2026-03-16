import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Calendar, Users, Shield, Crown, User, School, GraduationCap, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import OrgLogo from "@/components/OrgLogo";

interface Profile {
  id: string;
  name: string;
  email: string;
  profile_picture: string | null;
  created_at: string;
}

interface Membership {
  id: string;
  role: 'member' | 'officer' | 'leader';
  joined_at: string;
  organizations: {
    id: string;
    name: string;
    profile_picture: string | null;
    is_shs_org: boolean;
  };
}

interface UserRole {
  role: 'senior_highschool_student' | 'undergraduate_student' | 'sao' | 'admin';
}

const ProfileView = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organizations');

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) throw roleError;
      setUserRole(roleData);

      // Fetch memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from("memberships")
        .select(`
          id,
          role,
          joined_at,
          organizations!inner (
            id,
            name,
            profile_picture,
            is_shs_org
          )
        `)
        .eq("user_id", userId)
        .eq("status", "accepted")
        .order("joined_at", { ascending: false });

      if (membershipsError) throw membershipsError;
      
      // Transform data to match our interface
      const transformedMemberships = membershipsData?.map((m: any) => ({
        id: m.id,
        role: m.role,
        joined_at: m.joined_at,
        organizations: m.organizations
      })) || [];
      
      setMemberships(transformedMemberships);

    } catch (error: any) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user profile");
      navigate("/explore");
    } finally {
      setLoading(false);
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

  const getRoleBadge = () => {
    if (!userRole) return null;

    switch (userRole.role) {
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>;
      case 'sao':
        return <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" /> SAO</Badge>;
      case 'senior_highschool_student':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
          <School className="h-3 w-3" /> SHS Student
        </Badge>;
      case 'undergraduate_student':
        return <Badge variant="outline" className="gap-1">
          <GraduationCap className="h-3 w-3" /> Undergraduate
        </Badge>;
      default:
        return null;
    }
  };

  const getOrgRoleBadge = (role: string) => {
    switch (role) {
      case 'leader':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 gap-1">
          <Crown className="h-3 w-3" /> Leader
        </Badge>;
      case 'officer':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
          <Shield className="h-3 w-3" /> Officer
        </Badge>;
      default:
        return <Badge variant="outline" className="gap-1">
          <User className="h-3 w-3" /> Member
        </Badge>;
    }
  };

  const handleOrgClick = (orgId: string) => {
    navigate(`/org/${orgId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>User not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/explore")}>Back to Explore</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Profile Header Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
              <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile.profile_picture || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-white text-4xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2 pb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">
                    {profile.name}
                  </h1>
                  {getRoleBadge()}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(profile.created_at), "MMMM yyyy")}
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="mt-4">
                    <Link to="/profile">
                      <Button variant="outline" size="sm">
                        <User className="mr-2 h-4 w-4" />
                        Edit Your Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="organizations" className="gap-2">
              <Users className="h-4 w-4" />
              Organizations ({memberships.length})
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <User className="h-4 w-4" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>
                  Organizations {profile.name} is a member of
                </CardDescription>
              </CardHeader>
              <CardContent>
                {memberships.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Not a member of any organizations yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memberships.map((membership) => (
                      <button
                        key={membership.id}
                        onClick={() => handleOrgClick(membership.organizations.id)}
                        className="w-full text-left group rounded-lg border p-4 hover:shadow-md hover:border-primary transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <OrgLogo 
                            src={membership.organizations.profile_picture} 
                            alt={membership.organizations.name} 
                            size="md"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {membership.organizations.name}
                              </h3>
                              {membership.organizations.is_shs_org && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                  SHS
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              {getOrgRoleBadge(membership.role)}
                              <span className="text-xs text-muted-foreground">
                                Joined {format(new Date(membership.joined_at), "MMMM yyyy")}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <ExternalLink className="h-3 w-3 mr-1 opacity-50" />
                              <span>Click to view organization</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>User information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h4>
                      <p className="text-foreground">{profile.name}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                      <p className="text-foreground">{profile.email}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Member Since</h4>
                      <p className="text-foreground">
                        {format(new Date(profile.created_at), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Account Type</h4>
                      <div className="flex items-center gap-2">
                        {getRoleBadge()}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Organizations</h4>
                      <p className="text-foreground">
                        Member of {memberships.length} organization{memberships.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {!userRole && (
                  <div className="rounded-lg bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">
                      This user hasn't been assigned a specific role yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileView;