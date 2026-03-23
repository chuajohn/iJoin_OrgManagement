import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link, Navigate } from "react-router-dom";
import { Users, GraduationCap, School, Loader2, MailCheck, ArrowLeft, Waves, Wind, Leaf, Fish, Gem, Cherry, Mountain, Cloud, Sun, Moon, Star, Sparkles, Droplets, Flower, Bird, TreePine, Shell } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  userType: z.enum(['senior_highschool_student', 'undergraduate_student'], {
    required_error: "Please select your student type",
  }),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
      email: "", 
      password: "", 
      name: "",
      userType: "undergraduate_student" 
    },
  });

  // Floating Japanese elements - with semantic colors
  const floatingElements = [
    // Blue theme
    { Icon: Waves, color: "hsl(var(--primary))", top: "5%", left: "3%", delay: "0s", size: 28, opacity: 0.2 },
    { Icon: Fish, color: "hsl(var(--primary))", top: "15%", right: "4%", delay: "0.8s", size: 26, opacity: 0.2 },
    { Icon: Mountain, color: "hsl(var(--primary))", top: "25%", left: "6%", delay: "1.5s", size: 32, opacity: 0.2 },
    { Icon: Droplets, color: "hsl(var(--primary))", top: "35%", right: "8%", delay: "2.2s", size: 24, opacity: 0.2 },
    { Icon: Shell, color: "hsl(var(--primary))", top: "45%", left: "5%", delay: "2.9s", size: 26, opacity: 0.2 },
    { Icon: Waves, color: "hsl(var(--primary))", top: "55%", right: "5%", delay: "3.5s", size: 30, opacity: 0.2 },
    { Icon: Fish, color: "hsl(var(--primary))", top: "65%", left: "8%", delay: "4.2s", size: 25, opacity: 0.2 },
    { Icon: Mountain, color: "hsl(var(--primary))", top: "75%", right: "6%", delay: "4.9s", size: 28, opacity: 0.2 },
    { Icon: Droplets, color: "hsl(var(--primary))", top: "85%", left: "4%", delay: "5.5s", size: 22, opacity: 0.2 },
    
    // Red theme
    { Icon: Wind, color: "hsl(var(--destructive))", top: "8%", right: "6%", delay: "0.3s", size: 30, opacity: 0.2 },
    { Icon: Gem, color: "hsl(var(--destructive))", top: "18%", left: "7%", delay: "1.1s", size: 28, opacity: 0.2 },
    { Icon: Cloud, color: "hsl(var(--destructive))", top: "28%", right: "3%", delay: "1.8s", size: 32, opacity: 0.2 },
    { Icon: Flower, color: "hsl(var(--destructive))", top: "38%", left: "9%", delay: "2.5s", size: 26, opacity: 0.2 },
    { Icon: Bird, color: "hsl(var(--destructive))", top: "48%", right: "7%", delay: "3.2s", size: 24, opacity: 0.2 },
    { Icon: Wind, color: "hsl(var(--destructive))", top: "58%", left: "2%", delay: "3.9s", size: 29, opacity: 0.2 },
    { Icon: Gem, color: "hsl(var(--destructive))", top: "68%", right: "9%", delay: "4.5s", size: 27, opacity: 0.2 },
    { Icon: Cloud, color: "hsl(var(--destructive))", top: "78%", left: "5%", delay: "5.2s", size: 31, opacity: 0.2 },
    { Icon: Flower, color: "hsl(var(--destructive))", top: "88%", right: "4%", delay: "5.9s", size: 25, opacity: 0.2 },
    
    // Yellow theme
    { Icon: Leaf, color: "hsl(var(--brand-yellow))", top: "10%", left: "8%", delay: "0.5s", size: 27, opacity: 0.2 },
    { Icon: Cherry, color: "hsl(var(--brand-yellow))", top: "20%", right: "5%", delay: "1.3s", size: 29, opacity: 0.2 },
    { Icon: Sun, color: "hsl(var(--brand-yellow))", top: "30%", left: "4%", delay: "2.0s", size: 34, opacity: 0.2 },
    { Icon: Star, color: "hsl(var(--brand-yellow))", top: "40%", right: "2%", delay: "2.7s", size: 26, opacity: 0.2 },
    { Icon: Sparkles, color: "hsl(var(--brand-yellow))", top: "50%", left: "6%", delay: "3.4s", size: 28, opacity: 0.2 },
    { Icon: Leaf, color: "hsl(var(--brand-yellow))", top: "60%", right: "8%", delay: "4.1s", size: 25, opacity: 0.2 },
    { Icon: Cherry, color: "hsl(var(--brand-yellow))", top: "70%", left: "3%", delay: "4.8s", size: 27, opacity: 0.2 },
    { Icon: Sun, color: "hsl(var(--brand-yellow))", top: "80%", right: "7%", delay: "5.4s", size: 32, opacity: 0.2 },
    { Icon: Star, color: "hsl(var(--brand-yellow))", top: "90%", left: "7%", delay: "6.1s", size: 24, opacity: 0.2 },
    
    // Extra scattered
    { Icon: TreePine, color: "hsl(var(--primary))", top: "12%", left: "12%", delay: "1.7s", size: 22, opacity: 0.2 },
    { Icon: Moon, color: "hsl(var(--destructive))", top: "32%", right: "12%", delay: "2.8s", size: 24, opacity: 0.2 },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
        {/* Floating elements during loading */}
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
                opacity: item.opacity,
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent relative z-10" />
      </div>
    );
  }

  // ✅ Only redirect to dashboard if user is signed in AND email is confirmed
  if (user?.email_confirmed_at) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (data: SignInForm) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpForm) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.name, data.userType);
      setVerifiedEmail(data.email);
      setShowVerification(true);
      toast.success("Account created! Please check your email to verify.");
      
      // Clear the form
      signUpForm.reset();
      
      // No redirect! Stay on auth page.
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Email verification screen - NO REDIRECT, just info
  if (showVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Floating Japanese elements */}
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
                opacity: item.opacity,
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
        
        <Card className="w-full max-w-md border border-border bg-card/80 backdrop-blur-sm shadow-xl relative z-10">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-foreground">Verify Your Email</CardTitle>
            <CardDescription className="text-center text-base text-muted-foreground">
              We sent a verification link to:
              <br />
              <span className="font-medium text-primary mt-2 block break-all">
                {verifiedEmail}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-border rounded-lg p-4 text-sm text-foreground">
              <p className="font-medium mb-1">📧 Can't find the email?</p>
              <p className="text-muted-foreground">Check your spam folder or wait a few minutes.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowVerification(false)}
                className="w-full border border-border text-foreground hover:bg-primary/5"
              >
                Back to Sign In
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={async () => {
                  // Resend verification email
                  try {
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: verifiedEmail,
                    });
                    if (error) throw error;
                    toast.success("Verification email resent!");
                  } catch (error: any) {
                    toast.error(error.message);
                  }
                }}
                className="w-full text-primary hover:text-primary hover:bg-primary/5"
              >
                Resend Verification Email
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Once verified, you can sign in with your email and password.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
              opacity: item.opacity,
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
      
      {/* Lightning pattern overlay - with semantic colors */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M25 15 L35 15 L30 30 L40 30 L20 45 L25 30 L15 30 L25 15' fill='%230057A3' opacity='0.2'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }}></div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/logo.svg" 
                alt="iJoin" 
                className="h-8 w-auto md:h-10"
              />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-yellow border border-background"></div>
            </div>
            <span className="text-xl font-bold text-foreground">iJoin</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/5">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 relative z-10">
        <Card className="w-full max-w-md border border-border bg-card/80 backdrop-blur-sm shadow-xl relative overflow-hidden">
          {/* Corner decorations - with semantic colors */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l border-t border-border"></div>
          <div className="absolute top-0 right-0 w-16 h-16 border-r border-t border-destructive/30"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-l border-b border-brand-yellow/30"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-r border-b border-border"></div>
          
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Welcome to iJoin</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/80 border border-border p-1">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-foreground">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="student@iacademy.edu"
                      {...signInForm.register("email")}
                      disabled={isLoading}
                      className="border-border focus-visible:ring-brand-yellow/50"
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-foreground">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      {...signInForm.register("password")}
                      disabled={isLoading}
                      className="border-border focus-visible:ring-brand-yellow/50"
                    />
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-5 mt-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-foreground">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Juan Dela Cruz"
                      {...signUpForm.register("name")}
                      disabled={isLoading}
                      className="border-border focus-visible:ring-brand-yellow/50"
                    />
                    {signUpForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="student@iacademy.edu"
                      {...signUpForm.register("email")}
                      disabled={isLoading}
                      className="border-border focus-visible:ring-brand-yellow/50"
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Student Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-foreground">I am a...</Label>
                    <RadioGroup
                      value={signUpForm.watch("userType")}
                      onValueChange={(value) => signUpForm.setValue("userType", value as any, { shouldValidate: true })}
                      className="grid grid-cols-1 gap-3"
                      disabled={isLoading}
                    >
                      {/* Undergraduate Option */}
                      <div className={`
                        relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all
                        ${signUpForm.watch("userType") === 'undergraduate_student' 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50 hover:bg-card'
                        }
                      `}>
                        <RadioGroupItem value="undergraduate_student" id="ug" className="text-primary" />
                        <Label htmlFor="ug" className="flex-1 cursor-pointer font-normal">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              signUpForm.watch("userType") === 'undergraduate_student' 
                                ? 'bg-primary/10' 
                                : 'bg-muted'
                            }`}>
                              <GraduationCap className={`h-5 w-5 ${
                                signUpForm.watch("userType") === 'undergraduate_student' 
                                  ? 'text-primary' 
                                  : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Undergraduate Student</p>
                              <p className="text-xs text-muted-foreground">College • University</p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* SHS Option */}
                      <div className={`
                        relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all
                        ${signUpForm.watch("userType") === 'senior_highschool_student' 
                          ? 'border-destructive bg-destructive/5 ring-2 ring-destructive/20' 
                          : 'border-border hover:border-destructive/50 hover:bg-card'
                        }
                      `}>
                        <RadioGroupItem value="senior_highschool_student" id="shs" className="text-destructive" />
                        <Label htmlFor="shs" className="flex-1 cursor-pointer font-normal">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              signUpForm.watch("userType") === 'senior_highschool_student' 
                                ? 'bg-destructive/10' 
                                : 'bg-muted'
                            }`}>
                              <School className={`h-5 w-5 ${
                                signUpForm.watch("userType") === 'senior_highschool_student' 
                                  ? 'text-destructive' 
                                  : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">SHS Student</p>
                              <p className="text-xs text-muted-foreground">Senior High School • Grades 11-12</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                    {signUpForm.formState.errors.userType && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.userType.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signUpForm.register("password")}
                      disabled={isLoading}
                      className="border-border focus-visible:ring-brand-yellow/50"
                    />
                    {signUpForm.formState.errors.password ? (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.password.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Must be at least 6 characters long
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Footer - updated with gradient */}
      <footer className="mt-12 bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-border">
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

export default Auth;