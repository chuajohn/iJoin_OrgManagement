import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Upload, X, GripVertical, MoveUp, MoveDown, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  uploaded_at: string;
  display_order: number;
}

interface OrganizationPhotoManagerProps {
  orgId: string;
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

export function OrganizationPhotoManager({ orgId }: OrganizationPhotoManagerProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [caption, setCaption] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPhotos();
  }, [orgId]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_photos")
        .select("*")
        .eq("org_id", orgId)
        .order("display_order", { ascending: true })
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

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
    setIsDialogOpen(true);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${orgId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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

    setUploading(true);
    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error("Failed to upload image");

      const nextOrder = photos.length > 0 ? Math.max(...photos.map(p => p.display_order)) + 1 : 0;

      const { error } = await supabase
        .from("organization_photos")
        .insert({
          org_id: orgId,
          image_url: imageUrl,
          caption: caption.trim() || null,
          uploaded_by: user?.id,
          display_order: nextOrder,
        });

      if (error) throw error;

      toast.success("Photo uploaded successfully");
      setIsDialogOpen(false);
      setCaption("");
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchPhotos();
    } catch (error) {
      console.error("Error saving photo:", error);
      toast.error("Failed to save photo");
    } finally {
      setUploading(false);
    }
  };

  const handleEditPhoto = async () => {
    if (!editingPhoto) return;

    try {
      const { error } = await supabase
        .from("organization_photos")
        .update({ caption: caption.trim() || null })
        .eq("id", editingPhoto.id);

      if (error) throw error;

      toast.success("Caption updated");
      setEditingPhoto(null);
      setCaption("");
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
        // Extract file path from URL
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
      
      // Update display_order in database
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
        fetchPhotos(); // Revert to original order
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Organization Photos</CardTitle>
            <CardDescription>
              Manage photos that represent your organization
            </CardDescription>
          </div>
          <div>
            <Label htmlFor="upload-photo" className="cursor-pointer">
              <Button variant="outline" disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Photo"}
                </span>
              </Button>
            </Label>
            <Input
              id="upload-photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : photos.length === 0 ? (
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
                      setCaption(photo.caption || "");
                    }}
                    onDelete={handleDeletePhoto}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's happening in this photo?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setSelectedFile(null);
              setPreviewUrl(null);
              setCaption("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleSavePhoto} disabled={uploading}>
              {uploading ? "Uploading..." : "Save Photo"}
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
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
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
    </Card>
  );
}