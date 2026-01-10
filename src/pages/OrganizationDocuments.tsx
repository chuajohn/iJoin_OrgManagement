import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  document_url: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface Organization {
  id: string;
  name: string;
}

const OrganizationDocuments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", id)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      // Fetch documents
      const { data: docsData, error: docsError } = await supabase
        .from("organization_documents")
        .select("*")
        .eq("org_id", id)
        .order("uploaded_at", { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Organization not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/explore")}>Back to Explore</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/org/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {organization.name}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {organization.name} Documents
            </CardTitle>
            <CardDescription>
              PDFs and documents shared by the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No documents have been uploaded yet
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationDocuments;
