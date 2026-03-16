import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Users, Megaphone, Calendar, FileText, Upload, Pencil, Trash2, Settings, Save, Image as ImageIcon, X, GripVertical, Camera, Move, ZoomIn, RotateCcw, Instagram, Facebook } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { EventForm } from "@/components/EventForm";
import { MembershipManagement } from "@/components/MembershipManagement";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaInstagram, FaFacebookF } from "react-icons/fa";

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  uploaded_at: string;
  display_order: number;
}

// Sortable Photo Item Component
function SortablePhotoItem({ photo, onEdit, onDelete }: { 
  photo: Photo; 
  onEdit: (photo: Photo) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border rounded-lg overflow-hidden bg-background ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="aspect-video relative">
        <img
          src={photo.image_url}
          alt={photo.caption || 'Organization photo'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(photo)}
          >
            Edit Caption
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(photo.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-2 flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move hover:text-primary transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {photo.caption && (
          <p className="text-xs text-muted-foreground truncate flex-1">{photo.caption}</p>
        )}
      </div>
    </div>
  );
}

const OrganizationManage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isOfficer, isLeader, loading: roleLoading } = useUserRole(id);
  const { pendingCounts, refresh: refreshPendingCounts } = usePendingRequests();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Organization edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProfilePicture, setEditProfilePicture] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editFacebook, setEditFacebook] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  
  // Profile picture upload/crop state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Document management state
  const [uploading, setUploading] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Photo management state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const pendingCount = id ? pendingCounts[id] || 0 : 0;

  const fetchDocuments = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("organization_documents")
      .select("*")
      .eq("org_id", id)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
    } else {
      setDocuments(data || []);
    }
  };

  const fetchPhotos = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("organization_photos")
        .select("*")
        .eq("org_id", id)
        .order("display_order", { ascending: true })
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Failed to load photos");
    }
  };

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching organization:", error);
      } else {
        setOrganization(data);
        setEditName(data.name);
        setEditDescription(data.description || "");
        setEditProfilePicture(data.profile_picture || "");
        setEditInstagram(data.instagram_url || ""); 
        setEditFacebook(data.facebook_url || "");   
      }
      setLoading(false);
    };

    fetchOrganization();
    fetchDocuments();
    fetchPhotos();
    refreshPendingCounts(); // Refresh pending counts when component mounts
  }, [id]);

  // Logo upload handlers
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setSelectedLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreviewUrl(url);
    setIsCropDialogOpen(true);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropDialogOpen) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !isCropDialogOpen) return;

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

  const uploadLogo = async (): Promise<string | null> => {
    if (!selectedLogoFile || !user) return null;

    try {
      setUploadingLogo(true);

      // Create a canvas to crop/resize the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.src = logoPreviewUrl || '';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Set canvas size to 400x400 (square)
      canvas.width = 400;
      canvas.height = 400;

      // Calculate crop dimensions based on scale and position
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
      }

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
      });

      // Delete old logo if it exists and is stored in Supabase
      if (organization?.profile_picture) {
        try {
          const oldFilePath = extractStoragePath(organization.profile_picture);
          if (oldFilePath && oldFilePath.includes('org-logos/')) {
            await supabase.storage.from("organization-logos").remove([oldFilePath]);
          }
        } catch (deleteError) {
          console.error("Error deleting old logo:", deleteError);
        }
      }

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const filePath = `org-logos/${id}/${timestamp}-${randomString}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("organization-logos")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const extractStoragePath = (url: string): string | null => {
    try {
      if (url.includes("/storage/v1/object/public/")) {
        const match = url.match(/\/organization-logos\/(.+)$/);
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

  const handleSaveOrganization = async () => {
    if (!id || !user) return;
    
    if (!editName.trim()) {
      toast.error("Organization name cannot be empty");
      return;
    }

    setSavingOrg(true);
    try {
      let profilePictureUrl = editProfilePicture;

      if (selectedLogoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          profilePictureUrl = uploadedUrl;
        }
      }

      const updates = {
        name: editName.trim(),
        description: editDescription.trim() || null,
        profile_picture: profilePictureUrl.trim() || null,
        instagram_url: editInstagram?.trim() || null,
        facebook_url: editFacebook?.trim() || null,
      };

      const { error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Update error:", error);
        
        // User-friendly error messages
        if (error.message?.includes('permission denied')) {
          toast.error("You don't have permission to update this organization");
        } else if (error.message?.includes('violates row-level security')) {
          toast.error("You don't have permission to update this organization");
        } else {
          toast.error("Failed to update organization");
        }
        return;
      }

      // Update local state
      setOrganization((prev: any) => ({
        ...prev,
        ...updates,
      }));

      setIsEditing(false);
      setSelectedLogoFile(null);
      setLogoPreviewUrl(null);
      toast.success("Organization updated successfully");
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSavingOrg(false);
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("organization-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-documents")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("organization_documents")
        .insert({
          org_id: id,
          title: file.name.replace(".pdf", ""),
          document_url: publicUrl,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully");
      fetchDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc);
    setEditTitle(doc.title);
  };

  const handleSaveDocument = async () => {
    if (!editingDocument) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organization_documents")
        .update({ title: editTitle })
        .eq("id", editingDocument.id);

      if (error) throw error;

      toast.success("Document updated successfully");
      setEditingDocument(null);
      fetchDocuments();
    } catch (error: any) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const urlParts = doc.document_url.split("/organization-documents/");
      const filePath = urlParts[1];

      if (filePath) {
        await supabase.storage.from("organization-documents").remove([filePath]);
      }

      const { error } = await supabase
        .from("organization_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast.success("Document deleted successfully");
      fetchDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  // Photo handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsPhotoDialogOpen(true);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `org-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("organization-photos")
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-photos")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;

    setUploadingPhoto(true);
    try {
      const imageUrl = await uploadPhoto();
      if (!imageUrl) throw new Error("Failed to upload image");

      const nextOrder = photos.length > 0 ? Math.max(...photos.map(p => p.display_order)) + 1 : 0;

      const { error } = await supabase
        .from("organization_photos")
        .insert({
          org_id: id,
          image_url: imageUrl,
          caption: photoCaption.trim() || null,
          uploaded_by: user?.id,
          display_order: nextOrder,
        });

      if (error) throw error;

      toast.success("Photo uploaded successfully");
      setIsPhotoDialogOpen(false);
      setPhotoCaption("");
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchPhotos();
    } catch (error) {
      console.error("Error saving photo:", error);
      toast.error("Failed to save photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEditPhoto = async () => {
    if (!editingPhoto) return;

    try {
      const { error } = await supabase
        .from("organization_photos")
        .update({ caption: photoCaption.trim() || null })
        .eq("id", editingPhoto.id);

      if (error) throw error;

      toast.success("Caption updated");
      setEditingPhoto(null);
      setPhotoCaption("");
      fetchPhotos();
    } catch (error) {
      console.error("Error updating caption:", error);
      toast.error("Failed to update caption");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const photo = photos.find(p => p.id === photoId);
      if (photo) {
        const urlParts = photo.image_url.split("/organization-photos/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from("organization-photos").remove([filePath]);
        }
      }

      const { error } = await supabase
        .from("organization_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      toast.success("Photo deleted");
      fetchPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = photos.findIndex(p => p.id === active.id);
      const newIndex = photos.findIndex(p => p.id === over?.id);
      
      const newPhotos = arrayMove(photos, oldIndex, newIndex);
      
      try {
        const updates = newPhotos.map((photo, index) => ({
          id: photo.id,
          display_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from("organization_photos")
            .update({ display_order: update.display_order })
            .eq("id", update.id);
        }

        setPhotos(newPhotos);
        toast.success("Photo order updated");
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("Failed to update order");
        fetchPhotos();
      }
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

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isOfficer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be an officer or leader to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/explore">
              <Button>Back to Explore</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/explore">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Manage {organization?.name}</h1>
            <p className="text-sm text-muted-foreground">Organization Dashboard</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">
              <Settings className="mr-2 h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="mr-2 h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="events" disabled={!isLeader}>
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="members" className="relative">
              <Users className="mr-2 h-4 w-4" />
              Members
              {pendingCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-2 px-1.5 py-0.5 text-xs animate-pulse"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Organization Details Tab with Photos */}
          <TabsContent value="details" className="mt-6">
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>
                    View and edit your organization's information
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-6">
                    {/* Logo Section with both URL and Upload options */}
                    <div className="space-y-4">
                      <Label>Organization Logo</Label>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24 ring-4 ring-background">
                            <AvatarImage 
                              src={logoPreviewUrl || editProfilePicture || undefined} 
                              alt={editName}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-white text-2xl">
                              {getInitials(editName)}
                            </AvatarFallback>
                          </Avatar>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLogoFileSelect}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingLogo || savingOrg}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Upload a new logo from your computer, or provide a URL below:
                          </p>
                          <Input
                            placeholder="https://example.com/logo.png"
                            value={editProfilePicture}
                            onChange={(e) => {
                              setEditProfilePicture(e.target.value);
                              setSelectedLogoFile(null);
                              setLogoPreviewUrl(null);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter organization name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="org-description">Description</Label>
                      <Textarea
                        id="org-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Describe your organization"
                        rows={5}
                      />
                    </div>

                    {/* Social Media Links - With react-icons */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Social Media Links</h4>
                      
                      {/* Instagram */}
                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2">
                          <FaInstagram className="w-5 h-5 text-[#E4405F]" />
                          Instagram URL
                        </Label>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                            instagram.com/
                          </span>
                          <Input
                            id="instagram"
                            placeholder="your-organization"
                            value={(() => {
                              if (!editInstagram) return '';
                              const match = editInstagram.match(/(?:instagram\.com\/)([^/?]+)/);
                              return match ? match[1] : editInstagram;
                            })()}
                            onChange={(e) => {
                              const input = e.target.value;
                              
                              if (input.includes('instagram.com/')) {
                                const match = input.match(/(?:instagram\.com\/)([^/?]+)/);
                                if (match) {
                                  setEditInstagram(`https://instagram.com/${match[1]}`);
                                } else {
                                  setEditInstagram(input);
                                }
                              } else {
                                const username = input.replace(/[^a-zA-Z0-9._]/g, '');
                                if (username) {
                                  setEditInstagram(`https://instagram.com/${username}`);
                                } else {
                                  setEditInstagram('');
                                }
                              }
                            }}
                            className="flex-1 rounded-l-none"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter your Instagram username or paste the full URL
                        </p>
                      </div>

                      {/* Facebook */}
                      <div className="space-y-2">
                        <Label htmlFor="facebook" className="flex items-center gap-2">
                          <FaFacebookF className="w-5 h-5 text-[#1877F2]" />
                          Facebook URL
                        </Label>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                            facebook.com/
                          </span>
                          <Input
                            id="facebook"
                            placeholder="your-organization"
                            value={(() => {
                              if (!editFacebook) return '';
                              const match = editFacebook.match(/(?:facebook\.com\/)([^/?]+)/);
                              return match ? match[1] : editFacebook;
                            })()}
                            onChange={(e) => {
                              const input = e.target.value;
                              
                              if (input.includes('facebook.com/')) {
                                const match = input.match(/(?:facebook\.com\/)([^/?]+)/);
                                if (match) {
                                  setEditFacebook(`https://facebook.com/${match[1]}`);
                                } else {
                                  setEditFacebook(input);
                                }
                              } else {
                                const pageName = input.replace(/[^a-zA-Z0-9.]/g, '');
                                if (pageName) {
                                  setEditFacebook(`https://facebook.com/${pageName}`);
                                } else {
                                  setEditFacebook('');
                                }
                              }
                            }}
                            className="flex-1 rounded-l-none"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter your Facebook page name or paste the full URL
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Leave empty to hide social media links
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSaveOrganization} 
                        disabled={savingOrg || uploadingLogo}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {savingOrg || uploadingLogo ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(organization.name);
                          setEditDescription(organization.description || "");
                          setEditProfilePicture(organization.profile_picture || "");
                          setEditInstagram(organization.instagram_url || "");
                          setEditFacebook(organization.facebook_url || "");
                          setSelectedLogoFile(null);
                          setLogoPreviewUrl(null);
                        }}
                        disabled={savingOrg}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24 ring-4 ring-background">
                        <AvatarImage 
                          src={organization?.profile_picture || undefined} 
                          alt={organization?.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-white text-2xl">
                          {organization?.name ? getInitials(organization.name) : 'ORG'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{organization?.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {organization?.is_shs_org ? 'SHS Organization' : 'College Organization'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">About</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {organization?.description || "No description provided."}
                      </p>
                    </div>

                    {/* Social Media Links Display */}
                    {(organization?.instagram_url || organization?.facebook_url) && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Connect With Us</h4>
                        <div className="flex items-center gap-3">
                          {organization?.instagram_url && (
                            <a
                              href={organization.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-pink-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Instagram className="h-4 w-4" />
                              <span className="hover:underline">Instagram</span>
                            </a>
                          )}
                          {organization?.facebook_url && (
                            <a
                              href={organization.facebook_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Facebook className="h-4 w-4" />
                              <span className="hover:underline">Facebook</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm text-muted-foreground capitalize">{organization?.status}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {organization?.created_at ? format(new Date(organization.created_at), "MMMM d, yyyy") : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logo Crop Dialog */}
            <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ZoomIn className="h-5 w-5" />
                    Crop Organization Logo
                  </DialogTitle>
                  <DialogDescription>
                    Adjust the image to create a perfect square logo
                  </DialogDescription>
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
                        src={logoPreviewUrl!}
                        alt="Crop preview"
                        className="max-w-none"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    {/* Square Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-black/50" />
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]"
                        style={{
                          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                        }}
                      />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-2 border-white" />
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
                        setIsCropDialogOpen(false);
                      }}
                      className="flex-1"
                    >
                      Apply
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Drag to reposition • Use slider to zoom
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Photo Gallery Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Organization Photos
                    </CardTitle>
                    <CardDescription>
                      Manage photos that represent your organization
                    </CardDescription>
                  </div>
                  <div>
                    <Label htmlFor="upload-photo" className="cursor-pointer">
                      <Button variant="outline" disabled={uploadingPhoto} asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="upload-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploadingPhoto}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No photos uploaded yet</p>
                    <p className="text-sm">Upload photos to showcase your organization</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={photos.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo) => (
                          <SortablePhotoItem
                            key={photo.id}
                            photo={photo}
                            onEdit={(photo) => {
                              setEditingPhoto(photo);
                              setPhotoCaption(photo.caption || "");
                            }}
                            onDelete={handleDeletePhoto}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>

            {/* Upload Photo Dialog */}
            <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Photo</DialogTitle>
                  <DialogDescription>
                    Add a caption to describe this photo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {previewUrl && (
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="caption">Caption (optional)</Label>
                    <Input
                      id="caption"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="What's happening in this photo?"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsPhotoDialogOpen(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setPhotoCaption("");
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePhoto} disabled={uploadingPhoto}>
                    {uploadingPhoto ? "Uploading..." : "Save Photo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Caption Dialog */}
            <Dialog open={!!editingPhoto} onOpenChange={() => setEditingPhoto(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Caption</DialogTitle>
                  <DialogDescription>
                    Update the caption for this photo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {editingPhoto && (
                    <>
                      <div className="rounded-lg overflow-hidden border">
                        <img
                          src={editingPhoto.image_url}
                          alt={editingPhoto.caption || 'Organization photo'}
                          className="w-full h-auto max-h-[200px] object-contain"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-caption">Caption</Label>
                        <Input
                          id="edit-caption"
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                          placeholder="Enter caption"
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingPhoto(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditPhoto}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="announcements" className="mt-6">
            <AnnouncementForm orgId={id!} />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {isLeader && <EventForm orgId={id!} />}
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Organization Documents</CardTitle>
                  <CardDescription>
                    Documents and resources for this organization
                  </CardDescription>
                </div>
                <div>
                  <Label htmlFor="upload-doc" className="cursor-pointer">
                    <Button variant="outline" disabled={uploading} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload PDF"}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="upload-doc"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleUploadDocument}
                    disabled={uploading}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No documents uploaded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{doc.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(doc.uploaded_at), "PPP")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDocument(doc)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDocument(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Document Dialog */}
            <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Document</DialogTitle>
                  <DialogDescription>Update the document title</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="doc-title">Title</Label>
                    <Input
                      id="doc-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingDocument(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDocument} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <MembershipManagement orgId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationManage;