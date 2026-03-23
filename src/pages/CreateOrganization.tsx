import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, ArrowLeft, Loader2, GraduationCap, School, Info,
  Code, Palette, Trophy, Music, Camera, Gamepad2, Mic, Cpu, Dumbbell
} from "lucide-react";
import { toast } from "sonner";

const RequestOrganization = () => {
  const { user } = useAuth();
  const { isSHSStudent, isUGStudent, isAdmin, isSAO } = useUserRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    profilePicture: "",
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (isAdmin || isSAO) {
    navigate("/admin/create-organization");
    return null;
  }

  // Determine organization type based on user role
  const organizationType = isSHSStudent ? 'shs' : 'college';
  const isSHS = organizationType === 'shs';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("organizations").insert({
        name: formData.name,
        description: formData.description || null,
        profile_picture: formData.profilePicture || null,
        created_by: user.id,
        status: "pending",
        is_shs_org: isSHS,
      });

      if (error) throw error;

      toast.success("Organization request submitted for review!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to submit organization request");
    } finally {
      setLoading(false);
    }
  };

  // Floating icons for different org categories - with semantic colors
  const floatingIcons = [
    { Icon: Code, color: "hsl(var(--primary))", top: "15%", left: "5%", delay: "0s", size: 28 },
    { Icon: Palette, color: "hsl(var(--destructive))", top: "25%", right: "8%", delay: "2s", size: 32 },
    { Icon: Trophy, color: "hsl(var(--brand-yellow))", bottom: "30%", left: "7%", delay: "1s", size: 30 },
    { Icon: Music, color: "hsl(var(--primary))", top: "60%", right: "5%", delay: "3s", size: 26 },
    { Icon: Camera, color: "hsl(var(--destructive))", bottom: "15%", right: "12%", delay: "1.5s", size: 28 },
    { Icon: Gamepad2, color: "hsl(var(--brand-yellow))", top: "40%", left: "10%", delay: "2.5s", size: 32 },
    { Icon: Mic, color: "hsl(var(--primary))", bottom: "45%", left: "12%", delay: "0.5s", size: 26 },
    { Icon: Cpu, color: "hsl(var(--destructive))", top: "70%", right: "10%", delay: "3.5s", size: 30 },
    { Icon: Dumbbell, color: "hsl(var(--brand-yellow))", bottom: "60%", right: "15%", delay: "4s", size: 28 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Floating Icons */}
      {floatingIcons.map((item, index) => {
        const IconComponent = item.Icon;
        return (
          <div
            key={index}
            className="absolute pointer-events-none animate-float-subtle"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              animationDelay: item.delay,
              animationDuration: "8s",
              opacity: 0.25,
            }}
          >
            <IconComponent 
              size={item.size} 
              color={item.color}
              strokeWidth={1.5}
            />
          </div>
        );
      })}

      {/* Very subtle background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-destructive/5 rounded-full blur-3xl"></div>

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border flex-shrink-0">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="ml-4 flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/logo.svg" 
                  alt="logo" 
                  className="h-8 w-auto md:h-10"
                />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-yellow border border-background"></div>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline">iJoin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - flex-grow to push footer down */}
      <div className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 relative z-10">
          {/* Inspirational Quote */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground italic">
              "Every organization starts with a single idea and the courage to bring it to life."
            </p>
          </div>

          <Card className="border border-border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Request Organization</CardTitle>
              <CardDescription className="text-muted-foreground">
                Submit a request to create a new organization
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <Alert className={`
                  ${isSHS 
                    ? 'bg-primary/5 border-border' 
                    : 'bg-destructive/5 border-border'
                  }
                `}>
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg
                      ${isSHS ? 'bg-primary/10' : 'bg-destructive/10'}
                    `}>
                      {isSHS ? (
                        <School className="h-5 w-5 text-primary" />
                      ) : (
                        <GraduationCap className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        isSHS ? 'text-primary' : 'text-destructive'
                      }`}>
                        Requesting a {isSHS ? 'SHS' : 'College'} Organization
                      </h4>
                    </div>
                  </div>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Organization Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter organization name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                    className="border-border bg-card focus-visible:ring-brand-yellow/50 placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your organization's mission and activities"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    disabled={loading}
                    className="border-border bg-card focus-visible:ring-brand-yellow/50 placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePicture" className="text-foreground">
                    Profile Picture URL (Optional)
                  </Label>
                  <Input
                    id="profilePicture"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.profilePicture}
                    onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                    disabled={loading}
                    className="border-border bg-card focus-visible:ring-brand-yellow/50 placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Category icons row */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Code className="h-4 w-4 text-primary/40" />
                  <Palette className="h-4 w-4 text-destructive/40" />
                  <Trophy className="h-4 w-4 text-brand-yellow/40" />
                  <Music className="h-4 w-4 text-primary/40" />
                  <Camera className="h-4 w-4 text-destructive/40" />
                  <Gamepad2 className="h-4 w-4 text-brand-yellow/40" />
                  <Dumbbell className="h-4 w-4 text-primary/40" />
                  <Mic className="h-4 w-4 text-destructive/40" />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.name.trim()} 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                    size="lg"
                    className="border-border text-foreground hover:bg-primary/5"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Funny Witty Quote */}
          <p className="text-center text-xs text-muted-foreground/60 mt-4 italic">
            "An org that teaches household chores? Water music? If you can dream it, we'll make it happen. Maybe."
          </p>
        </div>
      </div>

      {/* Footer - Now properly positioned at bottom */}
      <footer className="flex-shrink-0 bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground/40">
            <p>© 2026 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Add subtle floating animation */}
      <style>{`
        @keyframes float-subtle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(2deg); }
          75% { transform: translateY(8px) rotate(-2deg); }
        }
        .animate-float-subtle {
          animation: float-subtle 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RequestOrganization;