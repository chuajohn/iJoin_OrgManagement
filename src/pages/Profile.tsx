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
import { ArrowLeft, User, Camera, Save, Loader2, ZoomIn, RotateCcw, Waves, Wind, Leaf, Fish, Gem, Cherry, Mountain, Cloud, Sun, Moon, Star, Sparkles, Droplets, Flower, Bird, Rabbit, Turtle, TreePine, Shell } from "lucide-react";
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
  } | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { isAdmin, isSAO, isSHSStudent, isUGStudent } = useUserRole();
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

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Floating Japanese elements - with semantic colors
  const floatingElements = [
    // Blue theme
    { Icon: Waves, color: "hsl(var(--primary))", top: "5%", left: "3%", delay: "0s", size: 28 },
    { Icon: Fish, color: "hsl(var(--primary))", top: "15%", right: "4%", delay: "0.8s", size: 26 },
    { Icon: Mountain, color: "hsl(var(--primary))", top: "25%", left: "6%", delay: "1.5s", size: 32 },
    { Icon: Droplets, color: "hsl(var(--primary))", top: "35%", right: "8%", delay: "2.2s", size: 24 },
    { Icon: Shell, color: "hsl(var(--primary))", top: "45%", left: "5%", delay: "2.9s", size: 26 },
    { Icon: Waves, color: "hsl(var(--primary))", top: "55%", right: "5%", delay: "3.5s", size: 30 },
    { Icon: Fish, color: "hsl(var(--primary))", top: "65%", left: "8%", delay: "4.2s", size: 25 },
    { Icon: Mountain, color: "hsl(var(--primary))", top: "75%", right: "6%", delay: "4.9s", size: 28 },
    { Icon: Droplets, color: "hsl(var(--primary))", top: "85%", left: "4%", delay: "5.5s", size: 22 },
    
    // Red theme
    { Icon: Wind, color: "hsl(var(--destructive))", top: "8%", right: "6%", delay: "0.3s", size: 30 },
    { Icon: Gem, color: "hsl(var(--destructive))", top: "18%", left: "7%", delay: "1.1s", size: 28 },
    { Icon: Cloud, color: "hsl(var(--destructive))", top: "28%", right: "3%", delay: "1.8s", size: 32 },
    { Icon: Flower, color: "hsl(var(--destructive))", top: "38%", left: "9%", delay: "2.5s", size: 26 },
    { Icon: Bird, color: "hsl(var(--destructive))", top: "48%", right: "7%", delay: "3.2s", size: 24 },
    { Icon: Wind, color: "hsl(var(--destructive))", top: "58%", left: "2%", delay: "3.9s", size: 29 },
    { Icon: Gem, color: "hsl(var(--destructive))", top: "68%", right: "9%", delay: "4.5s", size: 27 },
    { Icon: Cloud, color: "hsl(var(--destructive))", top: "78%", left: "5%", delay: "5.2s", size: 31 },
    { Icon: Flower, color: "hsl(var(--destructive))", top: "88%", right: "4%", delay: "5.9s", size: 25 },
    
    // Yellow theme
    { Icon: Leaf, color: "hsl(var(--brand-yellow))", top: "10%", left: "8%", delay: "0.5s", size: 27 },
    { Icon: Cherry, color: "hsl(var(--brand-yellow))", top: "20%", right: "5%", delay: "1.3s", size: 29 },
    { Icon: Sun, color: "hsl(var(--brand-yellow))", top: "30%", left: "4%", delay: "2.0s", size: 34 },
    { Icon: Star, color: "hsl(var(--brand-yellow))", top: "40%", right: "2%", delay: "2.7s", size: 26 },
    { Icon: Sparkles, color: "hsl(var(--brand-yellow))", top: "50%", left: "6%", delay: "3.4s", size: 28 },
    { Icon: Leaf, color: "hsl(var(--brand-yellow))", top: "60%", right: "8%", delay: "4.1s", size: 25 },
    { Icon: Cherry, color: "hsl(var(--brand-yellow))", top: "70%", left: "3%", delay: "4.8s", size: 27 },
    { Icon: Sun, color: "hsl(var(--brand-yellow))", top: "80%", right: "7%", delay: "5.4s", size: 32 },
    { Icon: Star, color: "hsl(var(--brand-yellow))", top: "90%", left: "7%", delay: "6.1s", size: 24 },
    
    // Extra scattered
    { Icon: Rabbit, color: "hsl(var(--primary))", top: "12%", left: "12%", delay: "1.7s", size: 22 },
    { Icon: Turtle, color: "hsl(var(--destructive))", top: "32%", right: "12%", delay: "2.8s", size: 24 },
    { Icon: TreePine, color: "hsl(var(--brand-yellow))", top: "52%", left: "12%", delay: "3.8s", size: 26 },
    { Icon: Moon, color: "hsl(var(--primary))", top: "72%", right: "11%", delay: "4.8s", size: 28 },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-96 border border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your profile</p>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
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

      {/* Subtle side decorations - with semantic colors */}
      <div className="fixed left-0 top-0 bottom-0 w-32 pointer-events-none opacity-30 z-0">
        <div className="absolute top-20 left-10 w-20 h-20 border border-border rounded-full"></div>
        <div className="absolute bottom-40 left-10 w-32 h-32 border border-destructive/20 rounded-full"></div>
        <div className="absolute top-1/3 left-0 w-px h-40 bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>
      </div>
      
      <div className="fixed right-0 top-0 bottom-0 w-32 pointer-events-none opacity-30 z-0">
        <div className="absolute top-40 right-10 w-24 h-24 border border-brand-yellow/20 rounded-full"></div>
        <div className="absolute bottom-60 right-10 w-40 h-40 border border-primary/20 rounded-full"></div>
        <div className="absolute top-2/3 right-0 w-px h-40 bg-gradient-to-b from-transparent via-destructive/20 to-transparent"></div>
      </div>

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm flex-shrink-0">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToDashboard}
            className="text-muted-foreground hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content - flex-grow to push footer down */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Profile Card */}
            <Card className="border border-border bg-card/80 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5 text-primary" />
                  My Profile
                </CardTitle>
                <CardDescription className="text-muted-foreground">Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section with Medals */}
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-background border-2 border-border flex-shrink-0">
                      <AvatarImage src={previewUrl || undefined} alt={profile.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl">
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
                  
                  {/* Name and medals container */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {editing ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-2xl font-bold h-auto py-1 px-2"
                          placeholder="Your name"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-foreground break-words">
                          {profile.name}
                        </h2>
                      )}
                      
                      {/* Medals Section - only show when not editing */}
                      {!editing && (
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
                      )}
                    </div>
                    
                    <p className="text-muted-foreground">{profile.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
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
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={saving || uploading} className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1">
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
                      <Button variant="outline" onClick={handleCancel} disabled={saving || uploading} className="border-border text-foreground hover:bg-primary/5">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-border">
                    <Button onClick={() => {
                      setEditName(profile.name);
                      setPreviewUrl(profile.profile_picture);
                      setEditing(true);
                    }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizations Card */}
            <Card className="border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-destructive/50 to-transparent"></div>
              
              <CardHeader>
                <CardTitle className="text-foreground">My Organizations</CardTitle>
                <CardDescription className="text-muted-foreground">Organizations you're a member of</CardDescription>
              </CardHeader>
              <CardContent>
                {memberships.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>You haven't joined any organizations yet</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-primary"
                      onClick={() => navigate("/explore")}
                    >
                      Explore organizations
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberships.map((membership) => (
                      membership.organizations && (
                        <div
                          key={membership.id}
                          onClick={() => navigate(`/org/${membership.organizations.id}`)}
                          className="flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:shadow-sm hover:border-primary/50 hover:bg-card cursor-pointer"
                        >
                          <Avatar className="h-12 w-12 border border-border flex-shrink-0">
                            <AvatarImage
                              src={membership.organizations.profile_picture || undefined}
                              alt={membership.organizations.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                              {membership.organizations.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {membership.organizations.name}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {membership.role} • Joined {format(new Date(membership.joined_at), "MMM yyyy")}
                            </p>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer - Now properly positioned at bottom */}
      <footer className="flex-shrink-0 bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground/60">
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