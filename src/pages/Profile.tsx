import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Camera, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface Membership {
  id: string;
  role: string;
  joined_at: string;
  organizations: {
    id: string;
    name: string;
    profile_picture: string | null;
  };
}

const Profile = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth(); // Get from context
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPictureUrl, setEditPictureUrl] = useState("");

  // Initialize edit fields when profile loads
  useState(() => {
    if (profile) {
      setEditName(profile.name);
      setEditPictureUrl(profile.profile_picture || "");
    }
  });

  const fetchMemberships = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("memberships")
        .select("id, role, joined_at, organizations(id, name, profile_picture)")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (error) throw error;
      setMemberships(data || []);
    } catch (error) {
      console.error("Error fetching memberships:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect only for memberships since profile comes from context
  useState(() => {
    if (user) {
      fetchMemberships();
    }
  });

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      // Use the updateProfile function from AuthContext
      await updateProfile({
        name: editName.trim(),
        profile_picture: editPictureUrl.trim() || null,
      });

      // Refresh profile to get latest data
      await refreshProfile();
      
      setEditing(false);
      // No need for separate toast - updateProfile already shows one
    } catch (error) {
      console.error("Error updating profile:", error);
      // Error toast is already shown in updateProfile function
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please sign in to view your profile</p>
            <Link to="/" className="mt-4 inline-block">
              <Button>Go to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                My Profile
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.profile_picture || undefined} alt={profile.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-white text-2xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {format(new Date(profile.created_at), "MMMM yyyy")}
                  </p>
                </div>
              </div>

              {editing ? (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picture">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Profile Picture URL
                      </div>
                    </Label>
                    <Input
                      id="picture"
                      value={editPictureUrl}
                      onChange={(e) => setEditPictureUrl(e.target.value)}
                      placeholder="https://example.com/your-photo.jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a URL to an image for your profile picture
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditing(false);
                      // Reset to current profile values
                      setEditName(profile.name);
                      setEditPictureUrl(profile.profile_picture || "");
                    }} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t">
                  <Button onClick={() => {
                    setEditName(profile.name);
                    setEditPictureUrl(profile.profile_picture || "");
                    setEditing(true);
                  }}>
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizations Card */}
          <Card>
            <CardHeader>
              <CardTitle>My Organizations</CardTitle>
              <CardDescription>Organizations you're a member of</CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>You haven't joined any organizations yet</p>
                  <Link to="/explore" className="mt-2 inline-block">
                    <Button variant="link" size="sm">
                      Explore organizations
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberships.map((membership) => (
                    <Link
                      key={membership.id}
                      to={`/org/${membership.organizations.id}`}
                      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/5"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={membership.organizations.profile_picture || undefined}
                          alt={membership.organizations.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-white">
                          {membership.organizations.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {membership.organizations.name}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {membership.role} • Joined {format(new Date(membership.joined_at), "MMM yyyy")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;