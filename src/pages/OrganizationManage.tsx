import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Users, Megaphone, Calendar, FileText, Upload, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { EventForm } from "@/components/EventForm";
import { MembershipManagement } from "@/components/MembershipManagement";

const OrganizationManage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isOfficer, isLeader, loading: roleLoading } = useUserRole(id);
  const [organization, setOrganization] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Document management state
  const [uploading, setUploading] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

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
      }
      setLoading(false);
    };

    fetchOrganization();
    fetchDocuments();
  }, [id]);

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
      // Extract file path from URL
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
        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

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
