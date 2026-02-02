import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoleManagement } from "@/components/admin/UserRoleManagement";
import { OrganizationManagement } from "@/components/admin/OrganizationManagement";
import { EventManagement } from "@/components/admin/EventManagement";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export default function Admin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <SignOutButton variant="ghost" size="icon" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <UserRoleManagement />
          <OrganizationManagement />
          <EventManagement />
        </div>
      </main>
    </div>
  );
}
