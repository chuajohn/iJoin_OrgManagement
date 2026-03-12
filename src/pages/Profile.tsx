import { useState, useEffect } from "react";
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
  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditPictureUrl(profile.profile_picture || "");
    }
  }, [profile]);

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
  useEffect(() => {
    if (user) {
      fetchMemberships();
    }
  }, [user]);

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00A3FF] border-t-transparent" />
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
        <Card className="w-96 border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-[#4A5568] mb-4">Please sign in to view your profile</p>
            <Link to="/auth" className="mt-4 inline-block">
              <Button className="bg-[#00A3FF] text-white hover:bg-[#00A3FF]/90">Go to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
      {/* Subtle side decorations */}
      <div className="fixed left-0 top-0 bottom-0 w-32 pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-20 h-20 border border-[#00A3FF]/20 rounded-full"></div>
        <div className="absolute bottom-40 left-10 w-32 h-32 border border-[#B43B3B]/20 rounded-full"></div>
        <div className="absolute top-1/3 left-0 w-px h-40 bg-gradient-to-b from-transparent via-[#00A3FF]/20 to-transparent"></div>
      </div>
      
      <div className="fixed right-0 top-0 bottom-0 w-32 pointer-events-none opacity-30">
        <div className="absolute top-40 right-10 w-24 h-24 border border-[#FFD966]/20 rounded-full"></div>
        <div className="absolute bottom-60 right-10 w-40 h-40 border border-[#00A3FF]/20 rounded-full"></div>
        <div className="absolute top-2/3 right-0 w-px h-40 bg-gradient-to-b from-transparent via-[#B43B3B]/20 to-transparent"></div>
      </div>

      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#00A3FF]/30 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Profile Card */}
          <Card className="border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm overflow-hidden">
            {/* Subtle top accent */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00A3FF]/50 to-transparent"></div>
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A1A2E]">
                <User className="h-5 w-5 text-[#00A3FF]" />
                My Profile
              </CardTitle>
              <CardDescription className="text-[#4A5568]">Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-white border-2 border-[#00A3FF]/30">
                  <AvatarImage src={profile.profile_picture || undefined} alt={profile.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#00A3FF] to-[#00A3FF]/70 text-white text-2xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#1A1A2E]">{profile.name}</h2>
                  <p className="text-[#4A5568]">{profile.email}</p>
                  <p className="text-sm text-[#4A5568] mt-1">
                    Member since {format(new Date(profile.created_at), "MMMM yyyy")}
                  </p>
                </div>
              </div>

              {editing ? (
                <div className="space-y-4 pt-4 border-t border-[#00A3FF]/20">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#1A1A2E]">Display Name</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                      className="border-[#00A3FF]/30 focus-visible:ring-[#FFD966]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picture" className="text-[#1A1A2E]">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-[#00A3FF]" />
                        Profile Picture URL
                      </div>
                    </Label>
                    <Input
                      id="picture"
                      value={editPictureUrl}
                      onChange={(e) => setEditPictureUrl(e.target.value)}
                      placeholder="https://example.com/your-photo.jpg"
                      className="border-[#00A3FF]/30 focus-visible:ring-[#FFD966]"
                    />
                    <p className="text-xs text-[#4A5568]">
                      Enter a URL to an image for your profile picture
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#00A3FF] text-white hover:bg-[#00A3FF]/90">
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditing(false);
                      // Reset to current profile values
                      setEditName(profile.name);
                      setEditPictureUrl(profile.profile_picture || "");
                    }} disabled={saving} className="border-[#00A3FF]/30 text-[#1A1A2E] hover:bg-[#00A3FF]/5">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-[#00A3FF]/20">
                  <Button onClick={() => {
                    setEditName(profile.name);
                    setEditPictureUrl(profile.profile_picture || "");
                    setEditing(true);
                  }} className="bg-[#00A3FF] text-white hover:bg-[#00A3FF]/90">
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizations Card */}
          <Card className="border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm overflow-hidden">
            {/* Subtle top accent */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#B43B3B]/50 to-transparent"></div>
            
            <CardHeader>
              <CardTitle className="text-[#1A1A2E]">My Organizations</CardTitle>
              <CardDescription className="text-[#4A5568]">Organizations you're a member of</CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="py-8 text-center text-[#4A5568]">
                  <p>You haven't joined any organizations yet</p>
                  <Link to="/explore" className="mt-2 inline-block">
                    <Button variant="link" size="sm" className="text-[#00A3FF]">
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
                      className="flex items-center gap-4 rounded-lg border border-[#00A3FF]/30 p-4 transition-all hover:shadow-sm hover:border-[#00A3FF]/50 hover:bg-white"
                    >
                      <Avatar className="h-12 w-12 border border-[#00A3FF]/30">
                        <AvatarImage
                          src={membership.organizations.profile_picture || undefined}
                          alt={membership.organizations.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-[#00A3FF] to-[#00A3FF]/70 text-white">
                          {membership.organizations.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-[#1A1A2E]">
                          {membership.organizations.name}
                        </p>
                        <p className="text-sm text-[#4A5568] capitalize">
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