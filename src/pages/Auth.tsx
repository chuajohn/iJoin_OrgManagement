import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client"; // ✅ ADD THIS
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link, Navigate } from "react-router-dom";
import { Users, GraduationCap, School, Loader2, MailCheck } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Verify Your Email</CardTitle>
            <CardDescription className="text-center text-base">
              We sent a verification link to:
              <br />
              <span className="font-medium text-primary mt-2 block break-all">
                {verifiedEmail}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">📧 Can't find the email?</p>
              <p>Check your spam folder or wait a few minutes.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowVerification(false)}
                className="w-full"
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
                className="w-full"
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">iJoin</span>
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to iJoin</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="student@iacademy.edu"
                      {...signInForm.register("email")}
                      disabled={isLoading}
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      {...signInForm.register("password")}
                      disabled={isLoading}
                    />
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
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
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Juan Dela Cruz"
                      {...signUpForm.register("name")}
                      disabled={isLoading}
                    />
                    {signUpForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="student@iacademy.edu"
                      {...signUpForm.register("email")}
                      disabled={isLoading}
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Student Type Selection */}
                  <div className="space-y-3">
                    <Label>I am a...</Label>
                    <RadioGroup
                      value={signUpForm.watch("userType")}
                      onValueChange={(value) => signUpForm.setValue("userType", value as any, { shouldValidate: true })}
                      className="grid grid-cols-1 gap-3"
                      disabled={isLoading}
                    >
                      {/* Undergraduate Option */}
                      <div className={`
                        relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer
                        ${signUpForm.watch("userType") === 'undergraduate_student' 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}>
                        <RadioGroupItem value="undergraduate_student" id="ug" />
                        <Label htmlFor="ug" className="flex-1 cursor-pointer font-normal">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              signUpForm.watch("userType") === 'undergraduate_student' 
                                ? 'bg-primary/10' 
                                : 'bg-gray-100'
                            }`}>
                              <GraduationCap className={`h-5 w-5 ${
                                signUpForm.watch("userType") === 'undergraduate_student' 
                                  ? 'text-primary' 
                                  : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Undergraduate Student</p>
                              <p className="text-xs text-gray-500">College • University</p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* SHS Option */}
                      <div className={`
                        relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer
                        ${signUpForm.watch("userType") === 'senior_highschool_student' 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}>
                        <RadioGroupItem value="senior_highschool_student" id="shs" />
                        <Label htmlFor="shs" className="flex-1 cursor-pointer font-normal">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              signUpForm.watch("userType") === 'senior_highschool_student' 
                                ? 'bg-primary/10' 
                                : 'bg-gray-100'
                            }`}>
                              <School className={`h-5 w-5 ${
                                signUpForm.watch("userType") === 'senior_highschool_student' 
                                  ? 'text-primary' 
                                  : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">SHS Student</p>
                              <p className="text-xs text-gray-500">Senior High School • Grades 11-12</p>
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
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signUpForm.register("password")}
                      disabled={isLoading}
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
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
    </div>
  );
};

export default Auth;