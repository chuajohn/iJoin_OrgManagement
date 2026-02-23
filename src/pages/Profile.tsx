import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, User, Camera, Save, Loader2, School, GraduationCap, RotateCcw, ZoomIn } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import AvatarEditor from 'react-avatar-editor';

interface Membership {
  id: string;
  role: string;
  joined_at: string;
  organizations: {
    id: string;
    name: string;
    profile_picture: string | null;
    is_shs_org: boolean;
  };
}

const Profile = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { isSHSStudent, isUGStudent, isAdmin, isSAO } = useUserRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditor>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  
  // Image handling states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  
  // Avatar editor states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setPreviewUrl(profile.profile_picture);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchMemberships();
    }
  }, [user]);

  const fetchMemberships = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("memberships")
        .select(`
          id,
          role,
          joined_at,
          organizations (
            id,
            name,
            profile_picture,
            is_shs_org
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (error) throw error;
      
      const validMemberships = data?.filter(m => m.organizations !== null) || [];
      setMemberships(validMemberships as Membership[]);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      toast.error("Failed to load memberships");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
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
      setCropDialogOpen(true);
      setZoom(1);
      setRotation(0);
    }
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  const handleRotationChange = (value: number[]) => {
    setRotation(value[0]);
  };

  const resetEditor = () => {
    setZoom(1);
    setRotation(0);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile || !user || !editorRef.current) return null;

    try {
      setUploading(true);

      // Get the cropped canvas from the editor
      const canvas = editorRef.current.getImageScaledToCanvas();
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
      });

      // Delete old image if it exists in storage
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

      // Upload new image
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

      const { data: { publicUrl } } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

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
      const match = url.match(/\/profiles\/(.+)$/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
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
    if (isAdmin) return <Badge variant="destructive">Admin</Badge>;
    if (isSAO) return <Badge variant="default">SAO</Badge>;
    if (isSHSStudent) return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
        <School className="h-3 w-3" />
        SHS Student
      </Badge>
    );
    if (isUGStudent) return (
      <Badge variant="outline" className="gap-1">
        <GraduationCap className="h-3 w-3" />
        Undergraduate
      </Badge>
    );
    return null;
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
            <Link to="/auth">
              <Button>Go to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {getRoleBadge()}
          </div>
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
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-background">
                    <AvatarImage 
                      src={previewUrl || undefined} 
                      alt={profile.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-white text-2xl">
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-foreground">
                          {profile.name}
                        </h2>
                        {getRoleBadge()}
                      </div>
                    </div>
                  )}
                  <p className="text-muted-foreground">{profile.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since{" "}
                    {format(new Date(profile.created_at), "MMMM yyyy")}
                  </p>
                </div>
              </div>

              {/* Image Crop Dialog with Avatar Editor */}
              <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ZoomIn className="h-5 w-5" />
                      Edit Profile Picture
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Avatar Editor */}
                    <div className="flex justify-center bg-muted rounded-lg p-4">
                      <AvatarEditor
                        ref={editorRef}
                        image={previewUrl || ''}
                        width={250}
                        height={250}
                        border={50}
                        borderRadius={125}
                        color={[0, 0, 0, 0.6]}
                        scale={zoom}
                        rotate={rotation}
                        className="rounded-lg"
                      />
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

                    {/* Rotation Control */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                          <RotateCcw className="h-4 w-4" />
                          Rotation
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {rotation}°
                        </span>
                      </div>
                      <Slider
                        value={[rotation]}
                        onValueChange={handleRotationChange}
                        min={0}
                        max={360}
                        step={1}
                      />
                    </div>

                    {/* Reset Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetEditor}
                      className="w-full"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCropDialogOpen(false);
                        setSelectedFile(null);
                        setPreviewUrl(profile?.profile_picture || null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        setCropDialogOpen(false);
                        await handleSaveProfile();
                      }}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Apply & Save"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Actions */}
              {editing ? (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving || uploading}
                      className="flex-1"
                    >
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
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving || uploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t">
                  <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizations Card */}
          <Card>
            <CardHeader>
              <CardTitle>My Organizations</CardTitle>
              <CardDescription>
                Organizations you're a member of
              </CardDescription>
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
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-white">
                          {membership.organizations.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {membership.organizations.name}
                          </p>
                          {getOrgTypeBadge(membership.organizations.is_shs_org)}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {membership.role} • Joined{" "}
                          {format(new Date(membership.joined_at), "MMM yyyy")}
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