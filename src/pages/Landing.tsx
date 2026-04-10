import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowRight,
  Users,
  Calendar,
  Bell,
  Shield,
  Sparkles,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music,
  Star,
  CheckCircle,
  Users2,
  Zap,
  Target,
  Cpu,
  Code,
  Palette,
  Gamepad2,
  Mic,
  Camera,
  Trophy,
  Dumbbell,
  X,
} from "lucide-react";
import { 
  FaBasketballBall, 
  FaVolleyballBall, 
  FaTableTennis,
  FaPaintBrush, 
  FaFilm, 
  FaHeadphones,
  FaKeyboard,
  FaRobot,
  FaGamepad
} from "react-icons/fa";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Blue fire accent - subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-destructive/5 pointer-events-none"></div>
      
      {/* Header - with deeper blue */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Logo Image */}
              <img 
                src="/logo.svg" 
                alt="iJoin" 
                className="h-8 w-auto md:h-10"
              />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-yellow border border-background shadow-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-foreground">
                iJoin
              </span>
              <span className="text-xs text-destructive -mt-1">iACADEMY</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button
                size="sm"
                className="bg-brand-yellow text-foreground hover:bg-brand-yellow/80 border border-border shadow-sm hover:shadow transition-all duration-300 font-semibold"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24">
        {/* Background visual elements - with deeper blue */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-primary/5 to-transparent"></div>
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-brand-yellow/5 to-transparent"></div>
          
          {/* Lightning bolt pattern with deeper blue */}
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M25 15 L35 15 L30 30 L40 30 L20 45 L25 30 L15 30 L25 15' fill='%230057A3' opacity='0.25'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
          
          {/* Floating elements */}
          <div className="absolute top-1/4 left-10 opacity-10">
            <Cpu className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute bottom-1/4 right-10 opacity-10">
            <Code className="h-12 w-12 text-brand-yellow" />
          </div>
          <div className="absolute top-1/3 right-1/4 opacity-5">
            <Zap className="h-16 w-16 text-primary" />
          </div>
        </div>

        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm px-4 py-2 mb-6 border border-border shadow-sm">
                <div className="h-2 w-2 rounded-full bg-destructive"></div>
                <span className="text-sm font-semibold text-foreground">
                  iACADEMY'S OFFICIAL STUDENT HUB
                </span>
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>

              <h1 className="mb-6 text-5xl md:text-7xl font-black leading-tight">
                <span className="text-foreground">
                  Where Tech & Creativity
                </span>
                <br />
                <span className="text-destructive">Meet Campus Life</span>
              </h1>

              <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
                Connect with organizations, discover events, and stay ahead in one platform for iACADEMY's future game changers.
              </p>

              {/* Stats with deeper blue */}
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-muted-foreground text-sm">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">30+</div>
                  <div className="text-muted-foreground text-sm">Organizations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-yellow">70+</div>
                  <div className="text-muted-foreground text-sm">Monthly Events</div>
                </div>
              </div>

              {/* Single CTA Button - removed Browse Organizations */}
              <div className="flex justify-center">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="group bg-brand-yellow text-foreground hover:bg-brand-yellow/80 border border-border shadow-md hover:shadow-lg transition-all duration-300 px-8 py-6 text-lg font-bold rounded-xl"
                  >
                    <span className="flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organization Types */}
      <section className="py-20 relative">
        {/* Decorative elements */}
        <div className="absolute left-0 top-1/4 w-32 opacity-10">
          <div className="h-32 w-32 rounded-full border border-primary/20"></div>
        </div>
        <div className="absolute right-0 bottom-1/4 w-32 opacity-10">
          <div className="h-40 w-40 rounded-full border border-brand-yellow/20"></div>
        </div>

        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="text-foreground">
                Find Your Niche
              </span>
              <br />
              <span className="text-destructive">Explore Student Organizations</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              From tech clubs to creative societies, find communities that match your passion
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Tech Clubs */}
            <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/5 border border-border flex items-center justify-center mb-4 group-hover:border-primary group-hover:bg-primary/10">
                <Cpu className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Tech Clubs</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Code, build, and innovate with fellow tech enthusiasts.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <FaKeyboard className="h-4 w-4 text-primary/60" />
                <FaRobot className="h-4 w-4 text-primary/60" />
                <Cpu className="h-4 w-4 text-primary/60" />
              </div>
            </div>

            {/* Creative Arts */}
            <div className="group p-6 rounded-2xl bg-card border border-border hover:border-[#C17B5C] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-[#C17B5C]/5 border border-border flex items-center justify-center mb-4 group-hover:border-[#C17B5C] group-hover:bg-[#C17B5C]/10">
                <Palette className="h-7 w-7 text-[#C17B5C]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Creative Arts</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Design, create, and express through art and media.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <FaPaintBrush className="h-4 w-4 text-[#C17B5C]/60" />
                <FaFilm className="h-4 w-4 text-[#C17B5C]/60" />
                <FaHeadphones className="h-4 w-4 text-[#C17B5C]/60" />
              </div>
            </div>

            {/* Athletics - with basketball, volleyball, table tennis */}
            <div className="group p-6 rounded-2xl bg-card border border-border hover:border-[#6B8E6D] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-[#6B8E6D]/5 border border-border flex items-center justify-center mb-4 group-hover:border-[#6B8E6D] group-hover:bg-[#6B8E6D]/10">
                <Trophy className="h-7 w-7 text-[#6B8E6D]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Athletics</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Play, compete, and stay active with sports teams.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <FaBasketballBall className="h-4 w-4 text-[#6B8E6D]/60" />
                <FaVolleyballBall className="h-4 w-4 text-[#6B8E6D]/60" />
                <FaTableTennis className="h-4 w-4 text-[#6B8E6D]/60" />
              </div>
            </div>

            {/* Esports & Gaming - removed Music icon */}
            <div className="group p-6 rounded-2xl bg-card border border-border hover:border-[#7A6A9F] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-[#7A6A9F]/5 border border-border flex items-center justify-center mb-4 group-hover:border-[#7A6A9F] group-hover:bg-[#7A6A9F]/10">
                <Gamepad2 className="h-7 w-7 text-[#7A6A9F]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Esports & Gaming</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Compete, stream, and level up with fellow gamers.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <FaGamepad className="h-4 w-4 text-[#7A6A9F]/60" />
                <Gamepad2 className="h-4 w-4 text-[#7A6A9F]/60" />
                <Zap className="h-4 w-4 text-[#7A6A9F]/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted relative overflow-hidden">
        {/* Lightning pattern with deeper blue */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full max-w-7xl mx-auto h-full">
            {/* Left side lightning bolts */}
            <div className="absolute left-0 top-0 bottom-0 w-32 flex flex-col justify-around opacity-10">
              <Zap className="h-8 w-8 text-primary -translate-x-4" />
              <Zap className="h-10 w-10 text-primary -translate-x-2 rotate-12" />
              <Zap className="h-12 w-12 text-primary -translate-x-6 -rotate-12" />
              <Zap className="h-8 w-8 text-primary -translate-x-3" />
              <Zap className="h-10 w-10 text-primary -translate-x-5 rotate-6" />
            </div>
            
            {/* Right side lightning bolts */}
            <div className="absolute right-0 top-0 bottom-0 w-32 flex flex-col justify-around opacity-10">
              <Zap className="h-8 w-8 text-brand-yellow translate-x-4 rotate-12" />
              <Zap className="h-10 w-10 text-brand-yellow translate-x-2 -rotate-12" />
              <Zap className="h-12 w-12 text-brand-yellow translate-x-6" />
              <Zap className="h-8 w-8 text-brand-yellow translate-x-3 -rotate-6" />
              <Zap className="h-10 w-10 text-brand-yellow translate-x-5 rotate-12" />
            </div>
            
            {/* Top center accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-15">
              <Zap className="h-16 w-16 text-primary -rotate-12" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 relative">
              <span className="relative inline-block">
                <span className="text-foreground">Powerful Features</span>
                <Zap className="absolute -top-6 -right-8 h-5 w-5 text-primary/30 rotate-12" />
              </span>
              <br />
              <span className="text-primary relative">
                For Modern Students
                <Zap className="absolute -bottom-4 -left-8 h-4 w-4 text-brand-yellow/30 -rotate-12" />
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            <div className="space-y-8">
              {/* Real-time Updates */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-border flex items-center justify-center flex-shrink-0">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Real-time Updates</h3>
                  <p className="text-muted-foreground text-sm">
                    Never miss what matters with instant notifications for events and announcements.
                  </p>
                </div>
              </div>

              {/* Smart Calendar */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-[#C17B5C]/10 border border-border flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-[#C17B5C]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Smart Calendar</h3>
                  <p className="text-muted-foreground text-sm">
                    RSVP, set reminders, and never double-book with intelligent scheduling.
                  </p>
                </div>
              </div>

              {/* Organization Hub */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-[#6B8E6D]/10 border border-border flex items-center justify-center flex-shrink-0">
                  <Users2 className="h-6 w-6 text-[#6B8E6D]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Organization Hub</h3>
                  <p className="text-muted-foreground text-sm">
                    Browse, join, and manage all your memberships from one dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 to-brand-yellow/10 rounded-2xl blur-xl"></div>
              <div className="relative p-8 rounded-2xl bg-card border border-border shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/5 to-brand-yellow/10 border border-border flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">Your Dashboard</div>
                      <div className="text-sm text-muted-foreground">Everything in one place</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75"></div>
                    <div className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse delay-150"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted border border-border">
                      <div className="text-xl font-bold text-destructive">12</div>
                      <div className="text-xs text-muted-foreground">Upcoming Events</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted border border-border">
                      <div className="text-xl font-bold text-primary">3</div>
                      <div className="text-xs text-muted-foreground">Active Orgs</div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-foreground">Recent Activity</div>
                      <div className="text-[10px] text-primary">Live</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive"></div>
                        <span className="text-xs text-muted-foreground">Design Club posted an update</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        <span className="text-xs text-muted-foreground">Basketball tryouts tomorrow</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow"></div>
                        <span className="text-xs text-muted-foreground">Game dev night this Friday</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-card">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 border-l border-t border-primary/10"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 border-r border-b border-brand-yellow/10"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
              Ready to Connect?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of iACADEMY students who are shaping their campus experience
            </p>
            
            <div className="flex justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-brand-yellow text-foreground hover:bg-brand-yellow/80 border border-border shadow-md hover:shadow-lg px-10 py-7 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105">
                  <span className="flex items-center gap-3">
                    <Star className="h-6 w-6" />
                    Start Your Journey
                    <Sparkles className="h-6 w-6" />
                  </span>
                </Button>
              </Link>
            </div>
            
            <p className="text-muted-foreground mt-8 text-sm">
              Free for all iACADEMY students • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] text-white py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo and tagline */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <img 
                    src="/logo.svg" 
                    alt="iJoin" 
                    className="h-8 w-auto md:h-10"
                  />
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-yellow border border-background shadow-sm"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">iJoin</span>
                  <span className="text-sm text-brand-yellow">iACADEMY Student Platform</span>
                </div>
              </div>
              <p className="text-white/60 text-center md:text-left max-w-xs text-sm">
                Connect, engage, and grow with student organizations at iACADEMY.
              </p>
            </div>
            
            {/* Social Media Links */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-white/80 font-semibold text-sm">Connect with iACADEMY</div>
              <div className="flex gap-3">
                <a 
                  href="https://www.facebook.com/iACADEMY" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-[#1877F2] hover:border-[#1877F2] flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-[#1877F2]/30"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a 
                  href="https://www.instagram.com/iacademy_edu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-gradient-to-r hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:border-[#F77737] flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-[#833AB4]/30"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a 
                  href="https://x.com/iACADEMY_EDU" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-black hover:border-black flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-black/30"
                >
                  <X className="h-4 w-4" />
                </a>
                <a 
                  href="https://www.youtube.com/@iacademycollege" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-[#FF0000] hover:border-[#FF0000] flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-[#FF0000]/30"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a 
                  href="https://www.tiktok.com/@iacademyofficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-black hover:border-[#25F4EE] flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-[#25F4EE]/30"
                >
                  <Music className="h-4 w-4" />
                </a>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-yellow/50"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive/50"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C17B5C]/50"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6B8E6D]/50"></span>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-12 pt-6 border-t border-white/10 text-center">
            <p className="text-white/40 text-xs">
              © 2026 iJoin - iACADEMY Student Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;