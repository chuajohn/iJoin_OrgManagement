import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Camera, Save, Waves, Wind, Leaf, Fish, Gem, Cherry, Mountain, Cloud, Sun, Moon, Star, Sparkles, Droplets, Flower, Bird, Rabbit, Turtle, TreePine, Shell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";

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
  const navigate = useNavigate();
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { isAdmin, isSAO, isSHSStudent, isUGStudent } = useUserRole();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPictureUrl, setEditPictureUrl] = useState("");

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
        .select(`
          id,
          role,
          joined_at,
          organizations!inner (
            id,
            name,
            profile_picture
          )
        `)
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

  useEffect(() => {
    if (user) {
      fetchMemberships();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        profile_picture: editPictureUrl.trim() || null,
      });

      await refreshProfile();
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Floating Japanese elements - same as dashboard
  const floatingElements = [
    // Blue theme
    { Icon: Waves, color: "#0057A3", top: "5%", left: "3%", delay: "0s", size: 28 },
    { Icon: Fish, color: "#0057A3", top: "15%", right: "4%", delay: "0.8s", size: 26 },
    { Icon: Mountain, color: "#0057A3", top: "25%", left: "6%", delay: "1.5s", size: 32 },
    { Icon: Droplets, color: "#0057A3", top: "35%", right: "8%", delay: "2.2s", size: 24 },
    { Icon: Shell, color: "#0057A3", top: "45%", left: "5%", delay: "2.9s", size: 26 },
    { Icon: Waves, color: "#0057A3", top: "55%", right: "5%", delay: "3.5s", size: 30 },
    { Icon: Fish, color: "#0057A3", top: "65%", left: "8%", delay: "4.2s", size: 25 },
    { Icon: Mountain, color: "#0057A3", top: "75%", right: "6%", delay: "4.9s", size: 28 },
    { Icon: Droplets, color: "#0057A3", top: "85%", left: "4%", delay: "5.5s", size: 22 },
    
    // Red theme
    { Icon: Wind, color: "#B43B3B", top: "8%", right: "6%", delay: "0.3s", size: 30 },
    { Icon: Gem, color: "#B43B3B", top: "18%", left: "7%", delay: "1.1s", size: 28 },
    { Icon: Cloud, color: "#B43B3B", top: "28%", right: "3%", delay: "1.8s", size: 32 },
    { Icon: Flower, color: "#B43B3B", top: "38%", left: "9%", delay: "2.5s", size: 26 },
    { Icon: Bird, color: "#B43B3B", top: "48%", right: "7%", delay: "3.2s", size: 24 },
    { Icon: Wind, color: "#B43B3B", top: "58%", left: "2%", delay: "3.9s", size: 29 },
    { Icon: Gem, color: "#B43B3B", top: "68%", right: "9%", delay: "4.5s", size: 27 },
    { Icon: Cloud, color: "#B43B3B", top: "78%", left: "5%", delay: "5.2s", size: 31 },
    { Icon: Flower, color: "#B43B3B", top: "88%", right: "4%", delay: "5.9s", size: 25 },
    
    // Yellow theme
    { Icon: Leaf, color: "#FFD966", top: "10%", left: "8%", delay: "0.5s", size: 27 },
    { Icon: Cherry, color: "#FFD966", top: "20%", right: "5%", delay: "1.3s", size: 29 },
    { Icon: Sun, color: "#FFD966", top: "30%", left: "4%", delay: "2.0s", size: 34 },
    { Icon: Star, color: "#FFD966", top: "40%", right: "2%", delay: "2.7s", size: 26 },
    { Icon: Sparkles, color: "#FFD966", top: "50%", left: "6%", delay: "3.4s", size: 28 },
    { Icon: Leaf, color: "#FFD966", top: "60%", right: "8%", delay: "4.1s", size: 25 },
    { Icon: Cherry, color: "#FFD966", top: "70%", left: "3%", delay: "4.8s", size: 27 },
    { Icon: Sun, color: "#FFD966", top: "80%", right: "7%", delay: "5.4s", size: 32 },
    { Icon: Star, color: "#FFD966", top: "90%", left: "7%", delay: "6.1s", size: 24 },
    
    // Extra scattered
    { Icon: Rabbit, color: "#0057A3", top: "12%", left: "12%", delay: "1.7s", size: 22 },
    { Icon: Turtle, color: "#B43B3B", top: "32%", right: "12%", delay: "2.8s", size: 24 },
    { Icon: TreePine, color: "#FFD966", top: "52%", left: "12%", delay: "3.8s", size: 26 },
    { Icon: Moon, color: "#0057A3", top: "72%", right: "11%", delay: "4.8s", size: 28 },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0057A3] border-t-transparent" />
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
        <Card className="w-96 border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-[#4A5568] mb-4">Please sign in to view your profile</p>
            <Button 
              className="bg-[#0057A3] text-white hover:bg-[#0057A3]/90"
              onClick={() => navigate("/auth")}
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5 relative overflow-hidden">
      {/* Floating Japanese Elements */}
      {floatingElements.map((item, index) => {
        const IconComponent = item.Icon;
        return (
          <div
            key={index}
            className="absolute pointer-events-none animate-float-playful"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              animationDelay: item.delay,
              animationDuration: "10s",
              opacity: 0.25,
              zIndex: 0,
            }}
          >
            <IconComponent 
              size={item.size} 
              color={item.color}
              strokeWidth={1.2}
            />
          </div>
        );
      })}

      {/* Subtle side decorations */}
      <div className="fixed left-0 top-0 bottom-0 w-32 pointer-events-none opacity-30 z-0">
        <div className="absolute top-20 left-10 w-20 h-20 border border-[#0057A3]/20 rounded-full"></div>
        <div className="absolute bottom-40 left-10 w-32 h-32 border border-[#B43B3B]/20 rounded-full"></div>
        <div className="absolute top-1/3 left-0 w-px h-40 bg-gradient-to-b from-transparent via-[#0057A3]/20 to-transparent"></div>
      </div>
      
      <div className="fixed right-0 top-0 bottom-0 w-32 pointer-events-none opacity-30 z-0">
        <div className="absolute top-40 right-10 w-24 h-24 border border-[#FFD966]/20 rounded-full"></div>
        <div className="absolute bottom-60 right-10 w-40 h-40 border border-[#0057A3]/20 rounded-full"></div>
        <div className="absolute top-2/3 right-0 w-px h-40 bg-gradient-to-b from-transparent via-[#B43B3B]/20 to-transparent"></div>
      </div>

      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#0057A3]/30 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToDashboard}
            className="text-[#4A5568] hover:text-[#0057A3] hover:bg-[#0057A3]/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Profile Card */}
          <Card className="border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0057A3]/50 to-transparent"></div>
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A1A2E]">
                <User className="h-5 w-5 text-[#0057A3]" />
                My Profile
              </CardTitle>
              <CardDescription className="text-[#4A5568]">Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-white border-2 border-[#0057A3]/30 flex-shrink-0">
                  <AvatarImage src={profile.profile_picture || undefined} alt={profile.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#0057A3] to-[#0057A3]/70 text-white text-2xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Name and medals container */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-[#1A1A2E] break-words">
                      {profile.name}
                    </h2>
                    
                    {/* Medals Section - now inline with name */}
                    <div className="flex items-center gap-1.5">
                      {/* Game Changer Medal - for all users */}
                      <img 
                        src="/medals/game_medal.png" 
                        alt="Game Changer Medal" 
                        className="w-8 h-8 object-contain hover:scale-110 transition-transform cursor-default"
                        title="iACADEMY Game Changer"
                      />
                      
                      {/* Admin Medal - only for admins/SAO */}
                      {(isAdmin || isSAO) && (
                        <img 
                          src="/medals/admin_medal.png" 
                          alt="Admin Medal" 
                          className="w-8 h-8 object-contain hover:scale-110 transition-transform cursor-default"
                          title={isAdmin ? "System Administrator" : "Student Affairs Office"}
                        />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-[#4A5568]">{profile.email}</p>
                  <p className="text-sm text-[#4A5568] mt-1">
                    Member since {format(new Date(profile.created_at), "MMMM yyyy")}
                  </p>
                </div>
              </div>

              {editing ? (
                <div className="space-y-4 pt-4 border-t border-[#0057A3]/20">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#1A1A2E]">Display Name</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                      className="border-[#0057A3]/30 focus-visible:ring-[#FFD966]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picture" className="text-[#1A1A2E]">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-[#0057A3]" />
                        Profile Picture URL
                      </div>
                    </Label>
                    <Input
                      id="picture"
                      value={editPictureUrl}
                      onChange={(e) => setEditPictureUrl(e.target.value)}
                      placeholder="https://example.com/your-photo.jpg"
                      className="border-[#0057A3]/30 focus-visible:ring-[#FFD966]"
                    />
                    <p className="text-xs text-[#4A5568]">
                      Enter a URL to an image for your profile picture
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#0057A3] text-white hover:bg-[#0057A3]/90">
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditing(false);
                      setEditName(profile.name);
                      setEditPictureUrl(profile.profile_picture || "");
                    }} disabled={saving} className="border-[#0057A3]/30 text-[#1A1A2E] hover:bg-[#0057A3]/5">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-[#0057A3]/20">
                  <Button onClick={() => {
                    setEditName(profile.name);
                    setEditPictureUrl(profile.profile_picture || "");
                    setEditing(true);
                  }} className="bg-[#0057A3] text-white hover:bg-[#0057A3]/90">
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizations Card */}
          <Card className="border border-[#0057A3]/30 bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#B43B3B]/50 to-transparent"></div>
            
            <CardHeader>
              <CardTitle className="text-[#1A1A2E]">My Organizations</CardTitle>
              <CardDescription className="text-[#4A5568]">Organizations you're a member of</CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="py-8 text-center text-[#4A5568]">
                  <p>You haven't joined any organizations yet</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#0057A3]"
                    onClick={() => navigate("/explore")}
                  >
                    Explore organizations
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberships.map((membership) => (
                    <div
                      key={membership.id}
                      onClick={() => navigate(`/org/${membership.organizations.id}`)}
                      className="flex items-center gap-4 rounded-lg border border-[#0057A3]/30 p-4 transition-all hover:shadow-sm hover:border-[#0057A3]/50 hover:bg-white cursor-pointer"
                    >
                      <Avatar className="h-12 w-12 border border-[#0057A3]/30 flex-shrink-0">
                        <AvatarImage
                          src={membership.organizations.profile_picture || undefined}
                          alt={membership.organizations.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-[#0057A3] to-[#0057A3]/70 text-white">
                          {membership.organizations.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1A1A2E] truncate">
                          {membership.organizations.name}
                        </p>
                        <p className="text-sm text-[#4A5568] capitalize">
                          {membership.role} • Joined {format(new Date(membership.joined_at), "MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-[#0057A3]/20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-[#FCF9F5]/60">
            <p>© 2026 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Add subtle floating animation */}
      <style>{`
        @keyframes float-playful {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-8px); }
          50% { transform: translateY(4px); }
          75% { transform: translateY(6px); }
        }
        .animate-float-playful {
          animation: float-playful 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Profile;