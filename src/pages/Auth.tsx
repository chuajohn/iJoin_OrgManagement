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
import { Users, GraduationCap, School, Loader2, MailCheck, ArrowLeft } from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00A3FF] border-t-transparent" />
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
      <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5 flex items-center justify-center p-4">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#00A3FF]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#B43B3B]/5 rounded-full blur-3xl"></div>
        
        <Card className="w-full max-w-md border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-[#00A3FF]/10 border-2 border-[#00A3FF]/30 flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-[#00A3FF]" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-[#1A1A2E]">Verify Your Email</CardTitle>
            <CardDescription className="text-center text-base text-[#4A5568]">
              We sent a verification link to:
              <br />
              <span className="font-medium text-[#00A3FF] mt-2 block break-all">
                {verifiedEmail}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-[#00A3FF]/5 border border-[#00A3FF]/20 rounded-lg p-4 text-sm text-[#1A1A2E]">
              <p className="font-medium mb-1">📧 Can't find the email?</p>
              <p className="text-[#4A5568]">Check your spam folder or wait a few minutes.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowVerification(false)}
                className="w-full border border-[#00A3FF]/30 text-[#1A1A2E] hover:bg-[#00A3FF]/5"
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
                className="w-full text-[#00A3FF] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5"
              >
                Resend Verification Email
              </Button>
            </div>
            
            <p className="text-xs text-center text-[#4A5568]">
              Once verified, you can sign in with your email and password.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#00A3FF]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#B43B3B]/5 rounded-full blur-3xl"></div>
      
      {/* Lightning pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M25 15 L35 15 L30 30 L40 30 L20 45 L25 30 L15 30 L25 15' fill='%2300A3FF' opacity='0.2'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }}></div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#00A3FF]/30 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/logo.svg" 
                alt="iJoin" 
                className="h-8 w-auto md:h-10"
              />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#FFD966] border border-[#FCF9F5]"></div>
            </div>
            <span className="text-xl font-bold text-[#1A1A2E]">iJoin</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm shadow-xl">
          <div className="absolute top-0 left-0 w-16 h-16 border-l border-t border-[#00A3FF]/30"></div>
          <div className="absolute top-0 right-0 w-16 h-16 border-r border-t border-[#B43B3B]/30"></div>
          
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1A1A2E]">Welcome to iJoin</CardTitle>
            <CardDescription className="text-[#4A5568]">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#E1E8F0]/80 border border-[#00A3FF]/30 p-1">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-[#00A3FF] data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-[#00A3FF] data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-[#1A1A2E]">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="student@iacademy.edu"
                      {...signInForm.register("email")}
                      disabled={isLoading}
                      className="border-[#00A3FF]/30 focus-visible:ring-[#FFD966]/50"
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-[#B43B3B]">
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-[#1A1A2E]">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      {...signInForm.register("password")}
                      disabled={isLoading}
                      className="border-[#00A3FF]/30 focus-visible:ring-[#FFD966]/50"
                    />
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-[#B43B3B]">
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#00A3FF] text-white hover:bg-[#00A3FF]/90" 
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
                    <Label htmlFor="signup-name" className="text-[#1A1A2E]">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Juan Dela Cruz"
                      {...signUpForm.register("name")}
                      disabled={isLoading}
                      className="border-[#00A3FF]/30 focus-visible:ring-[#FFD966]/50"
                    />
                    {signUpForm.formState.errors.name && (
                      <p className="text-sm text-[#B43B3B]">
                        {signUpForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[#1A1A2E]">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="student@iacademy.edu"
                      {...signUpForm.register("email")}
                      disabled={isLoading}
                      className="border-[#00A3FF]/30 focus-visible:ring-[#FFD966]/50"
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-[#B43B3B]">
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Student Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-[#1A1A2E]">I am a...</Label>
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
                          ? 'border-[#00A3FF] bg-[#00A3FF]/5 ring-2 ring-[#00A3FF]/20' 
                          : 'border-[#00A3FF]/20 hover:border-[#00A3FF]/50 hover:bg-white'
                        }
                      `}>
                        <RadioGroupItem value="undergraduate_student" id="ug" className="text-[#00A3FF]" />
                        <Label htmlFor="ug" className="flex-1 cursor-pointer font-normal">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              signUpForm.watch("userType") === 'undergraduate_student' 
                                ? 'bg-[#00A3FF]/10' 
                                : 'bg-[#E1E8F0]'
                            }`}>
                              <GraduationCap className={`h-5 w-5 ${
                                signUpForm.watch("userType") === 'undergraduate_student' 
                                  ? 'text-[#00A3FF]' 
                                  : 'text-[#4A5568]'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A2E]">Undergraduate Student</p>
                              <p className="text-xs text-[#4A5568]">College • University</p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* SHS Option */}
                      <div className={`
                        relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all
                        ${signUpForm.watch("userType") === 'senior_highschool_student' 
                          ? 'border-[#B43B3B] bg-[#B43B3B]/5 ring-2 ring-[#B43B3B]/20' 
                          : 'border-[#00A3FF]/20 hover:border-[#B43B3B]/50 hover:bg-white'
                        }
                      `}>
                        <RadioGroupItem value="senior_highschool_student" id="shs" className="text-[#B43B3B]" />
                        <Label htmlFor="shs" className="flex-1 cursor-pointer font-normal">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              signUpForm.watch("userType") === 'senior_highschool_student' 
                                ? 'bg-[#B43B3B]/10' 
                                : 'bg-[#E1E8F0]'
                            }`}>
                              <School className={`h-5 w-5 ${
                                signUpForm.watch("userType") === 'senior_highschool_student' 
                                  ? 'text-[#B43B3B]' 
                                  : 'text-[#4A5568]'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A2E]">SHS Student</p>
                              <p className="text-xs text-[#4A5568]">Senior High School • Grades 11-12</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                    {signUpForm.formState.errors.userType && (
                      <p className="text-sm text-[#B43B3B]">
                        {signUpForm.formState.errors.userType.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-[#1A1A2E]">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signUpForm.register("password")}
                      disabled={isLoading}
                      className="border-[#00A3FF]/30 focus-visible:ring-[#FFD966]/50"
                    />
                    {signUpForm.formState.errors.password ? (
                      <p className="text-sm text-[#B43B3B]">
                        {signUpForm.formState.errors.password.message}
                      </p>
                    ) : (
                      <p className="text-xs text-[#4A5568]">
                        Must be at least 6 characters long
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#00A3FF] text-white hover:bg-[#00A3FF]/90" 
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

      {/* Footer */}
      <footer className="bg-[#1A1A2E] border-t border-[#00A3FF]/20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-[#FCF9F5]/40">
            <p>© 2024 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;