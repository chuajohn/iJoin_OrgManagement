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

  const orgType = isSHSStudent ? 'shs' : 'college';

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
        is_shs_org: orgType === 'shs',
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

  // Floating icons for different org categories
  const floatingIcons = [
    { Icon: Code, color: "#00A3FF", top: "15%", left: "5%", delay: "0s", size: 24 },
    { Icon: Palette, color: "#B43B3B", top: "25%", right: "8%", delay: "2s", size: 28 },
    { Icon: Trophy, color: "#FFD966", bottom: "30%", left: "7%", delay: "1s", size: 26 },
    { Icon: Music, color: "#00A3FF", top: "60%", right: "5%", delay: "3s", size: 22 },
    { Icon: Camera, color: "#B43B3B", bottom: "15%", right: "12%", delay: "1.5s", size: 24 },
    { Icon: Gamepad2, color: "#FFD966", top: "40%", left: "10%", delay: "2.5s", size: 28 },
    { Icon: Mic, color: "#00A3FF", bottom: "45%", left: "12%", delay: "0.5s", size: 22 },
    { Icon: Cpu, color: "#B43B3B", top: "70%", right: "10%", delay: "3.5s", size: 26 },
    { Icon: Dumbbell, color: "#FFD966", bottom: "60%", right: "15%", delay: "4s", size: 24 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5 relative overflow-hidden">
      {/* Floating Icons - Very Subtle */}
      {floatingIcons.map((item, index) => {
        const IconComponent = item.Icon;
        return (
          <div
            key={index}
            className="absolute pointer-events-none animate-float-subtle opacity-10 hover:opacity-20 transition-opacity"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              animationDelay: item.delay,
              animationDuration: "8s",
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
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#00A3FF]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#B43B3B]/5 rounded-full blur-3xl"></div>

      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#00A3FF]/30">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5">
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
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#FFD966] border border-white"></div>
              </div>
              <span className="text-xl font-bold text-[#1A1A2E] hidden sm:inline">iJoin</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8 relative z-10">
        {/* Inspirational Quote */}
        <div className="text-center mb-6">
          <p className="text-sm text-[#4A5568] italic">
            "Every organization starts with a single idea and the courage to bring it to life."
          </p>
        </div>

        <Card className="border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1A1A2E]">Request Organization</CardTitle>
            <CardDescription className="text-[#4A5568]">
              Submit a request to create a new organization
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <Alert className={`
                ${orgType === 'shs' 
                  ? 'bg-[#00A3FF]/5 border-[#00A3FF]/30' 
                  : 'bg-[#B43B3B]/5 border-[#B43B3B]/30'
                }
              `}>
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${orgType === 'shs' ? 'bg-[#00A3FF]/10' : 'bg-[#B43B3B]/10'}
                  `}>
                    {orgType === 'shs' ? (
                      <School className={`h-5 w-5 ${orgType === 'shs' ? 'text-[#00A3FF]' : 'text-[#B43B3B]'}`} />
                    ) : (
                      <GraduationCap className={`h-5 w-5 ${orgType === 'shs' ? 'text-[#00A3FF]' : 'text-[#B43B3B]'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      orgType === 'shs' ? 'text-[#00A3FF]' : 'text-[#B43B3B]'
                    }`}>
                      Requesting a {orgType === 'shs' ? 'SHS' : 'College'} Organization
                    </h4>
                  </div>
                </div>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#1A1A2E]">
                  Organization Name <span className="text-[#B43B3B]">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter organization name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="border-[#00A3FF]/30 bg-white focus-visible:ring-[#FFD966]/50 placeholder:text-[#4A5568]/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[#1A1A2E]">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your organization's mission and activities"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  disabled={loading}
                  className="border-[#00A3FF]/30 bg-white focus-visible:ring-[#FFD966]/50 placeholder:text-[#4A5568]/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profilePicture" className="text-[#1A1A2E]">
                  Profile Picture URL (Optional)
                </Label>
                <Input
                  id="profilePicture"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.profilePicture}
                  onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                  disabled={loading}
                  className="border-[#00A3FF]/30 bg-white focus-visible:ring-[#FFD966]/50 placeholder:text-[#4A5568]/50"
                />
              </div>

              {/* Category icons row */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Code className="h-4 w-4 text-[#00A3FF]/40" />
                <Palette className="h-4 w-4 text-[#B43B3B]/40" />
                <Trophy className="h-4 w-4 text-[#FFD966]/40" />
                <Music className="h-4 w-4 text-[#00A3FF]/40" />
                <Camera className="h-4 w-4 text-[#B43B3B]/40" />
                <Gamepad2 className="h-4 w-4 text-[#FFD966]/40" />
                <Dumbbell className="h-4 w-4 text-[#00A3FF]/40" />
                <Mic className="h-4 w-4 text-[#B43B3B]/40" />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !formData.name.trim()} 
                  className="flex-1 bg-[#00A3FF] text-white hover:bg-[#00A3FF]/90"
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
                  className="border-[#00A3FF]/30 text-[#1A1A2E] hover:bg-[#00A3FF]/5"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Funny Witty Quote */}
        <p className="text-center text-xs text-[#4A5568]/60 mt-4 italic">
        "An org that teaches household chores? Water music? If you can dream it, we'll make it happen. Maybe."
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-12 bg-[#1A1A2E] border-t border-[#00A3FF]/20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-[#FCF9F5]/40">
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