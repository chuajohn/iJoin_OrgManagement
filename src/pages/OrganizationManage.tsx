import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Megaphone, Calendar } from "lucide-react";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { EventForm } from "@/components/EventForm";
import { MembershipManagement } from "@/components/MembershipManagement";

const OrganizationManage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isOfficer, isLeader, loading: roleLoading } = useUserRole(id);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  }, [id]);

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements">
              <Megaphone className="mr-2 h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="events" disabled={!isLeader}>
              <Calendar className="mr-2 h-4 w-4" />
              Events
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

          <TabsContent value="members" className="mt-6">
            <MembershipManagement orgId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationManage;
