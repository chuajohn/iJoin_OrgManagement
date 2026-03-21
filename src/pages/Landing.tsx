import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
      {/* Blue fire accent - subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0057A3]/5 via-transparent to-[#B43B3B]/5 pointer-events-none"></div>
      
      {/* Header - with deeper blue */}
      <header className="sticky top-0 z-30 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#0057A3]/30 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Logo Image */}
              <img 
                src="/logo.svg" 
                alt="iJoin" 
                className="h-8 w-auto md:h-10"
              />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#FFD966] border border-[#FCF9F5] shadow-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[#1A1A2E]">
                iJoin
              </span>
              <span className="text-xs text-[#B43B3B] -mt-1">iACADEMY</span>
            </div>
          </div>

          <Link to="/auth">
            <Button
              size="sm"
              className="bg-[#FFD966] text-[#1A1A2E] hover:bg-[#FFD966]/80 border border-[#0057A3]/30 shadow-sm hover:shadow transition-all duration-300 font-semibold"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24">
        {/* Background visual elements - with deeper blue */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-[#0057A3]/5 to-transparent"></div>
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-[#FFD966]/5 to-transparent"></div>
          
          {/* Lightning bolt pattern with deeper blue */}
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M25 15 L35 15 L30 30 L40 30 L20 45 L25 30 L15 30 L25 15' fill='%230057A3' opacity='0.25'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
          
          {/* Floating elements */}
          <div className="absolute top-1/4 left-10 opacity-10">
            <Cpu className="h-12 w-12 text-[#0057A3]" />
          </div>
          <div className="absolute bottom-1/4 right-10 opacity-10">
            <Code className="h-12 w-12 text-[#FFD966]" />
          </div>
          <div className="absolute top-1/3 right-1/4 opacity-5">
            <Zap className="h-16 w-16 text-[#0057A3]" />
          </div>
        </div>

        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 mb-6 border border-[#0057A3]/20 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-[#B43B3B]"></div>
                <span className="text-sm font-semibold text-[#1A1A2E]">
                  iACADEMY'S OFFICIAL STUDENT HUB
                </span>
                <div className="h-2 w-2 rounded-full bg-[#0057A3]"></div>
              </div>

              <h1 className="mb-6 text-5xl md:text-7xl font-black leading-tight">
                <span className="text-[#1A1A2E]">
                  Where Tech & Creativity
                </span>
                <br />
                <span className="text-[#B43B3B]">Meet Campus Life</span>
              </h1>

              <p className="mx-auto mb-10 max-w-2xl text-xl text-[#4A5568]">
                Connect with organizations, discover events, and stay ahead in one platform for iACADEMY's future game changers.
              </p>

              {/* Stats with deeper blue */}
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#0057A3]">500+</div>
                  <div className="text-[#4A5568] text-sm">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#B43B3B]">30+</div>
                  <div className="text-[#4A5568] text-sm">Organizations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FFD966]">70+</div>
                  <div className="text-[#4A5568] text-sm">Monthly Events</div>
                </div>
              </div>

              {/* Single CTA Button - removed Browse Organizations */}
              <div className="flex justify-center">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="group bg-[#FFD966] text-[#1A1A2E] hover:bg-[#FFD966]/80 border border-[#0057A3]/30 shadow-md hover:shadow-lg transition-all duration-300 px-8 py-6 text-lg font-bold rounded-xl"
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
          <div className="h-32 w-32 rounded-full border border-[#0057A3]/20"></div>
        </div>
        <div className="absolute right-0 bottom-1/4 w-32 opacity-10">
          <div className="h-40 w-40 rounded-full border border-[#FFD966]/20"></div>
        </div>

        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="text-[#1A1A2E]">
                Find Your Niche
              </span>
              <br />
              <span className="text-[#B43B3B]">Explore Student Organizations</span>
            </h2>
            <p className="text-[#4A5568] max-w-2xl mx-auto text-lg">
              From tech clubs to creative societies, find communities that match your passion
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Tech Clubs */}
            <div className="group p-6 rounded-2xl bg-white border border-[#0057A3]/20 hover:border-[#0057A3] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-[#0057A3]/5 border border-[#0057A3]/20 flex items-center justify-center mb-4 group-hover:border-[#0057A3] group-hover:bg-[#0057A3]/10">
                <Cpu className="h-7 w-7 text-[#0057A3]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">Tech Clubs</h3>
              <p className="text-[#4A5568] mb-4 text-sm">
                Code, build, and innovate with fellow tech enthusiasts.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <FaKeyboard className="h-4 w-4 text-[#0057A3]/60" />
                <FaRobot className="h-4 w-4 text-[#0057A3]/60" />
                <Cpu className="h-4 w-4 text-[#0057A3]/60" />
              </div>
            </div>

            {/* Creative Arts */}
            <div className="group p-6 rounded-2xl bg-white border border-[#C17B5C]/20 hover:border-[#C17B5C] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-[#C17B5C]/5 border border-[#C17B5C]/20 flex items-center justify-center mb-4 group-hover:border-[#C17B5C] group-hover:bg-[#C17B5C]/10">
                <Palette className="h-7 w-7 text-[#C17B5C]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">Creative Arts</h3>
              <p className="text-[#4A5568] mb-4 text-sm">
                Design, create, and express through art and media.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <FaPaintBrush className="h-4 w-4 text-[#C17B5C]/60" />
                <FaFilm className="h-4 w-4 text-[#C17B5C]/60" />
                <FaHeadphones className="h-4 w-4 text-[#C17B5C]/60" />
              </div>
            </div>

            {/* Athletics - with basketball, volleyball, table tennis */}
            <div className="group p-6 rounded-2xl bg-white border border-[#6B8E6D]/20 hover:border-[#6B8E6D] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-[#6B8E6D]/5 border border-[#6B8E6D]/20 flex items-center justify-center mb-4 group-hover:border-[#6B8E6D] group-hover:bg-[#6B8E6D]/10">
                <Trophy className="h-7 w-7 text-[#6B8E6D]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">Athletics</h3>
              <p className="text-[#4A5568] mb-4 text-sm">
                Play, compete, and stay active with sports teams.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <FaBasketballBall className="h-4 w-4 text-[#6B8E6D]/60" />
                <FaVolleyballBall className="h-4 w-4 text-[#6B8E6D]/60" />
                <FaTableTennis className="h-4 w-4 text-[#6B8E6D]/60" />
              </div>
            </div>

            {/* Esports & Gaming - removed Music icon */}
            <div className="group p-6 rounded-2xl bg-white border border-[#7A6A9F]/20 hover:border-[#7A6A9F] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-[#7A6A9F]/5 border border-[#7A6A9F]/20 flex items-center justify-center mb-4 group-hover:border-[#7A6A9F] group-hover:bg-[#7A6A9F]/10">
                <Gamepad2 className="h-7 w-7 text-[#7A6A9F]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">Esports & Gaming</h3>
              <p className="text-[#4A5568] mb-4 text-sm">
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
      <section className="py-20 bg-[#FCF9F5] relative overflow-hidden">
        {/* Lightning pattern with deeper blue */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full max-w-7xl mx-auto h-full">
            {/* Left side lightning bolts */}
            <div className="absolute left-0 top-0 bottom-0 w-32 flex flex-col justify-around opacity-10">
              <Zap className="h-8 w-8 text-[#0057A3] -translate-x-4" />
              <Zap className="h-10 w-10 text-[#0057A3] -translate-x-2 rotate-12" />
              <Zap className="h-12 w-12 text-[#0057A3] -translate-x-6 -rotate-12" />
              <Zap className="h-8 w-8 text-[#0057A3] -translate-x-3" />
              <Zap className="h-10 w-10 text-[#0057A3] -translate-x-5 rotate-6" />
            </div>
            
            {/* Right side lightning bolts */}
            <div className="absolute right-0 top-0 bottom-0 w-32 flex flex-col justify-around opacity-10">
              <Zap className="h-8 w-8 text-[#FFD966] translate-x-4 rotate-12" />
              <Zap className="h-10 w-10 text-[#FFD966] translate-x-2 -rotate-12" />
              <Zap className="h-12 w-12 text-[#FFD966] translate-x-6" />
              <Zap className="h-8 w-8 text-[#FFD966] translate-x-3 -rotate-6" />
              <Zap className="h-10 w-10 text-[#FFD966] translate-x-5 rotate-12" />
            </div>
            
            {/* Top center accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-15">
              <Zap className="h-16 w-16 text-[#0057A3] -rotate-12" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 relative">
              <span className="relative inline-block">
                <span className="text-[#1A1A2E]">Powerful Features</span>
                <Zap className="absolute -top-6 -right-8 h-5 w-5 text-[#0057A3]/30 rotate-12" />
              </span>
              <br />
              <span className="text-[#0057A3] relative">
                For Modern Students
                <Zap className="absolute -bottom-4 -left-8 h-4 w-4 text-[#FFD966]/30 -rotate-12" />
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            <div className="space-y-8">
              {/* Real-time Updates */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#0057A3]/20 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-[#0057A3]/10 border border-[#0057A3]/30 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-6 w-6 text-[#0057A3]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Real-time Updates</h3>
                  <p className="text-[#4A5568] text-sm">
                    Never miss what matters with instant notifications for events and announcements.
                  </p>
                </div>
              </div>

              {/* Smart Calendar */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#C17B5C]/20 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-[#C17B5C]/10 border border-[#C17B5C]/30 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-[#C17B5C]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Smart Calendar</h3>
                  <p className="text-[#4A5568] text-sm">
                    RSVP, set reminders, and never double-book with intelligent scheduling.
                  </p>
                </div>
              </div>

              {/* Organization Hub */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#6B8E6D]/20 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-[#6B8E6D]/10 border border-[#6B8E6D]/30 flex items-center justify-center flex-shrink-0">
                  <Users2 className="h-6 w-6 text-[#6B8E6D]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Organization Hub</h3>
                  <p className="text-[#4A5568] text-sm">
                    Browse, join, and manage all your memberships from one dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#0057A3]/5 to-[#FFD966]/10 rounded-2xl blur-xl"></div>
              <div className="relative p-8 rounded-2xl bg-white border border-[#0057A3]/20 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0057A3]/5 to-[#FFD966]/10 border border-[#0057A3]/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-[#0057A3]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#1A1A2E]">Your Dashboard</div>
                      <div className="text-sm text-[#4A5568]">Everything in one place</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-[#B43B3B] animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-[#0057A3] animate-pulse delay-75"></div>
                    <div className="h-2 w-2 rounded-full bg-[#FFD966] animate-pulse delay-150"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-[#FCF9F5] border border-[#0057A3]/10">
                      <div className="text-xl font-bold text-[#B43B3B]">12</div>
                      <div className="text-xs text-[#4A5568]">Upcoming Events</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[#FCF9F5] border border-[#0057A3]/10">
                      <div className="text-xl font-bold text-[#0057A3]">3</div>
                      <div className="text-xs text-[#4A5568]">Active Orgs</div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-[#FCF9F5] border border-[#0057A3]/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-[#1A1A2E]">Recent Activity</div>
                      <div className="text-[10px] text-[#0057A3]">Live</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#B43B3B]"></div>
                        <span className="text-xs text-[#4A5568]">Design Club posted an update</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#0057A3]"></div>
                        <span className="text-xs text-[#4A5568]">Basketball tryouts tomorrow</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#FFD966]"></div>
                        <span className="text-xs text-[#4A5568]">Game dev night this Friday</span>
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
      <section className="py-24 relative overflow-hidden bg-white">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 border-l border-t border-[#0057A3]/10"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 border-r border-b border-[#FFD966]/10"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A2E] mb-6">
              Ready to Connect?
            </h2>
            <p className="text-xl text-[#4A5568] mb-10">
              Join thousands of iACADEMY students who are shaping their campus experience
            </p>
            
            <div className="flex justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-[#FFD966] text-[#1A1A2E] hover:bg-[#FFD966]/80 border border-[#0057A3]/30 shadow-md hover:shadow-lg px-10 py-7 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105">
                  <span className="flex items-center gap-3">
                    <Star className="h-6 w-6" />
                    Start Your Journey
                    <Sparkles className="h-6 w-6" />
                  </span>
                </Button>
              </Link>
            </div>
            
            <p className="text-[#4A5568] mt-8 text-sm">
              Free for all iACADEMY students • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A2E] text-[#FCF9F5] py-12 border-t border-[#0057A3]/20">
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
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#FFD966] border border-[#1A1A2E] shadow-sm"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">iJoin</span>
                  <span className="text-sm text-[#FFD966]">iACADEMY Student Platform</span>
                </div>
              </div>
              <p className="text-[#FCF9F5]/60 text-center md:text-left max-w-xs text-sm">
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
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0057A3]/50"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFD966]/50"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B43B3B]/50"></span>
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