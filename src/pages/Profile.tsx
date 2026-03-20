import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, User, Camera, Save, Loader2, ZoomIn, RotateCcw, X } from "lucide-react";
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
  } | null; // Make nullable
}

const Profile = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  
  // Profile picture upload/crop state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Initialize edit fields when profile loads
  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setPreviewUrl(profile.profile_picture);
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
      
      // ✅ FILTER OUT NULL ORGANIZATIONS
      const validMemberships = (data || []).filter(m => m.organizations !== null);
      setMemberships(validMemberships);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      setFetchError("Failed to load memberships");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };

      setCropDialogOpen(true);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropDialogOpen) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !cropDialogOpen) return;

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    const maxPan = 100 * (zoom - 1);
    newX = Math.max(Math.min(newX, maxPan), -maxPan);
    newY = Math.max(Math.min(newY, maxPan), -maxPan);

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0];
    setZoom(newZoom);

    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const resetCrop = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    try {
      setUploading(true);

      // Delete old image if exists
      if (profile?.profile_picture) {
        try {
          const oldFilePath = extractStoragePath(profile.profile_picture);
          if (oldFilePath) {
            await supabase.storage.from("profiles").remove([oldFilePath]);
          }
        } catch (deleteError) {
          console.error("Error deleting old image:", deleteError);
        }
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.src = previewUrl || "";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      canvas.width = 400;
      canvas.height = 400;

      const size = Math.min(img.width, img.height);

      let sourceX = (img.width - size) / 2;
      let sourceY = (img.height - size) / 2;

      const sourceSize = size / zoom;

      sourceX += (size - sourceSize) / 2;
      sourceY += (size - sourceSize) / 2;

      const panScale = size / 400;

      sourceX -= (position.x / zoom) * panScale;
      sourceY -= (position.y / zoom) * panScale;

      const minX = (img.width - size) / 2;
      const maxX = (img.width + size) / 2 - sourceSize;
      const minY = (img.height - size) / 2;
      const maxY = (img.height + size) / 2 - sourceSize;

      sourceX = Math.max(minX, Math.min(sourceX, maxX));
      sourceY = Math.max(minY, Math.min(sourceY, maxY));

      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 400, 400);

        ctx.save();
        ctx.beginPath();
        ctx.arc(200, 200, 200, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          400,
          400
        );
        ctx.restore();
      }

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.95);
      });

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const filePath = `profile-pictures/${user.id}/${timestamp}-${randomString}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profiles").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const extractStoragePath = (url: string): string | null => {
    try {
      if (url.includes("/storage/v1/object/public/")) {
        const match = url.match(/\/profiles\/(.+)$/);
        if (match && match[1]) {
          return decodeURIComponent(match[1]);
        }
      }
      return null;
    } catch (e) {
      console.error("Error extracting storage path:", e);
      return null;
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      let profilePictureUrl = profile?.profile_picture;

      if (selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          profilePictureUrl = uploadedUrl;
        }
      }

      await updateProfile({
        name: editName.trim(),
        profile_picture: profilePictureUrl,
      });

      await refreshProfile();
      setEditing(false);
      setSelectedFile(null);
      setCropDialogOpen(false);
      setPreviewUrl(profilePictureUrl);
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditName(profile?.name || "");
    setPreviewUrl(profile?.profile_picture || null);
    setSelectedFile(null);
    setCropDialogOpen(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
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
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00A3FF] mx-auto mb-4" />
          <p className="text-[#4A5568]">Loading profile...</p>
        </div>
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
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-white border-2 border-[#00A3FF]/30">
                    <AvatarImage src={previewUrl || undefined} alt={profile.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[#00A3FF] to-[#00A3FF]/70 text-white text-2xl">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  {editing && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || saving}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex-1">
                  {editing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-2xl font-bold h-auto py-1 px-2"
                      placeholder="Your name"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-[#1A1A2E]">{profile.name}</h2>
                  )}
                  <p className="text-[#4A5568]">{profile.email}</p>
                  <p className="text-sm text-[#4A5568] mt-1">
                    Member since {format(new Date(profile.created_at), "MMMM yyyy")}
                  </p>
                </div>
              </div>

              {/* Image Crop Dialog */}
              <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ZoomIn className="h-5 w-5" />
                      Crop Profile Picture
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Crop Container */}
                    <div
                      className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden cursor-move"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-transform"
                        style={{
                          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                          transition: isDragging ? "none" : "transform 0.1s ease",
                        }}
                      >
                        <img
                          src={previewUrl!}
                          alt="Crop preview"
                          className="max-w-none"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>

                      {/* Circular Overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-black/50" />
                        <div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
                          style={{
                            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                          }}
                        />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border-2 border-white" />
                      </div>
                    </div>

                    {/* Zoom Control */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                          <ZoomIn className="h-4 w-4" />
                          Zoom
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(zoom * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[zoom]}
                        onValueChange={handleZoomChange}
                        min={1}
                        max={2.5}
                        step={0.01}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetCrop}
                        className="flex-1"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setCropDialogOpen(false);
                        }}
                        className="flex-1"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      Drag to reposition • Use slider to zoom
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              {editing ? (
                <div className="space-y-4 pt-4 border-t border-[#00A3FF]/20">
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving || uploading} className="bg-[#00A3FF] text-white hover:bg-[#00A3FF]/90 flex-1">
                      {saving || uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploading ? "Uploading..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={saving || uploading} className="border-[#00A3FF]/30 text-[#1A1A2E] hover:bg-[#00A3FF]/5">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-[#00A3FF]/20">
                  <Button onClick={() => {
                    setEditName(profile.name);
                    setPreviewUrl(profile.profile_picture);
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
                    // ✅ Add null check for safety
                    membership.organizations && (
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
                    )
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