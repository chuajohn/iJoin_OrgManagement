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
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Logo Image */}
              <img 
                src="/logo.svg" 
                alt="logo" 
                className="h-8 w-auto md:h-10"
              />
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 border-2 border-gray-900"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                iJoin
              </span>
              <span className="text-xs text-gray-400 -mt-1">iACADEMY</span>
            </div>
          </div>

          <Link to="/auth">
            <Button
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-700 hover:to-cyan-600 shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24">
        {/* Background visual elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-indigo-500/5 to-transparent"></div>
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-cyan-500/5 to-transparent"></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(to right, #4f46e5 1px, transparent 1px),
                             linear-gradient(to bottom, #4f46e5 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* Floating tech elements */}
          <div className="absolute top-1/4 left-10 opacity-20">
            <Cpu className="h-12 w-12 text-cyan-400" />
          </div>
          <div className="absolute bottom-1/4 right-10 opacity-20">
            <Code className="h-12 w-12 text-indigo-400" />
          </div>
          <div className="absolute top-1/3 right-1/4 opacity-15">
            <Gamepad2 className="h-16 w-16 text-cyan-300" />
          </div>
        </div>

        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 mb-6 shadow-sm border border-gray-700">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"></div>
                <span className="text-sm font-semibold bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  iACADEMY'S OFFICIAL STUDENT HUB
                </span>
              </div>

              <h1 className="mb-6 text-5xl md:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                  Where Tech & Creativity
                </span>
                <br />
                <span className="text-gray-100">Meet Campus Life</span>
              </h1>

              <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-300">
                Connect with student organizations, track events, and stay updated—all in one sleek platform designed for iACADEMY's digital natives.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">500+</div>
                  <div className="text-gray-400 text-sm">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">30+</div>
                  <div className="text-gray-400 text-sm">Organizations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">200+</div>
                  <div className="text-gray-400 text-sm">Monthly Events</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-700 hover:to-cyan-600 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg font-bold rounded-xl border border-cyan-500/30"
                  >
                    <span className="flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:border-cyan-400 hover:bg-gray-800/50 hover:text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
                  >
                    Explore Organizations
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organization Types - Side visual elements */}
      <section className="py-20 relative">
        {/* Side graphic elements */}
        <div className="absolute left-0 top-1/4 w-32 opacity-10">
          <div className="h-32 w-32 rounded-full border-2 border-cyan-500"></div>
        </div>
        <div className="absolute right-0 bottom-1/4 w-32 opacity-10">
          <div className="h-40 w-40 rounded-full border-2 border-indigo-500"></div>
        </div>

        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Find Your Niche
              </span>
              <br />
              <span className="text-gray-100">Explore Student Organizations</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              From tech clubs to creative societies, find communities that match your passion
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-cyan-500/50 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-900/30 to-cyan-500/10 flex items-center justify-center mb-4">
                <Cpu className="h-7 w-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-3">Tech Clubs</h3>
              <p className="text-gray-400 mb-4">
                Programming, cybersecurity, AI, and game development communities
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-900/30 to-indigo-500/10 flex items-center justify-center mb-4">
                <Palette className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-3">Creative Arts</h3>
              <p className="text-gray-400 mb-4">
                Design, photography, film, and digital arts communities
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-cyan-500/50 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-900/30 to-cyan-500/10 flex items-center justify-center mb-4">
                <Trophy className="h-7 w-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-3">Athletics</h3>
              <p className="text-gray-400 mb-4">
                Sports teams, fitness clubs, and competitive athletic organizations
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-900/30 to-indigo-500/10 flex items-center justify-center mb-4">
                <Gamepad2 className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-3">Esports & Gaming</h3>
              <p className="text-gray-400 mb-4">
                Competitive gaming, game development, and esports teams
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-950 relative">
        {/* Circuit board pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #4f46e5 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="text-gray-100">Powerful Features</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                For Modern Students
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            <div className="space-y-8">
              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-800/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-900/30 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">Real-time Updates</h3>
                  <p className="text-gray-400">
                    Instant notifications for events, announcements, and important deadlines. Never miss what matters.
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-800/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-900/30 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">Smart Calendar</h3>
                  <p className="text-gray-400">
                    Integrated calendar with RSVP, reminders, and conflict detection for all campus events.
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-800/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-900/30 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Users2 className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">Organization Hub</h3>
                  <p className="text-gray-400">
                    Browse, join, and manage memberships across all student organizations from one dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Replaced grey box with cleaner visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-100">Dashboard Preview</div>
                      <div className="text-sm text-gray-400">Everything in one place</div>
                    </div>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
                      <div className="text-2xl font-bold text-cyan-300">12</div>
                      <div className="text-sm text-gray-400">Upcoming Events</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
                      <div className="text-2xl font-bold text-indigo-300">3</div>
                      <div className="text-sm text-gray-400">Active Orgs</div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-medium text-gray-100">Live Updates</div>
                      <div className="text-xs text-cyan-400">Streaming</div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
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
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-gray-900 to-cyan-900/20"></div>
        
        {/* Geometric patterns */}
        <div className="absolute top-0 left-0 w-64 h-64 border-l-2 border-t-2 border-cyan-500/20"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 border-r-2 border-b-2 border-indigo-500/20"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-gray-100 mb-6">
              Ready to Connect?
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              Join thousands of iACADEMY students who are shaping their campus experience
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-700 hover:to-cyan-600 shadow-2xl px-10 py-7 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 border border-cyan-400/30">
                  <span className="flex items-center gap-3">
                    <Star className="h-6 w-6" />
                    Start Your Journey
                    <Sparkles className="h-6 w-6" />
                  </span>
                </Button>
              </Link>
              <Link to="/explore">
                <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:border-cyan-400 hover:bg-gray-800/50 hover:text-white px-8 py-7 text-lg font-semibold rounded-xl transition-all duration-300">
                  Browse Organizations
                </Button>
              </Link>
            </div>
            
            <p className="text-gray-400 mt-8 text-sm">
              Free for all iACADEMY students • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 py-12 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo and tagline */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">iJoin</span>
                  <span className="text-sm text-gray-400">iACADEMY Student Platform</span>
                </div>
              </div>
              <p className="text-gray-400 text-center md:text-left max-w-xs">
                The definitive platform for student organizations and campus engagement
              </p>
            </div>
            
            {/* Social Media Links */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-gray-100 font-semibold">Connect with iACADEMY</div>
              <div className="flex gap-3">
                <a 
                  href="https://www.facebook.com/iACADEMY" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.instagram.com/iacademy_edu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-gray-800 hover:bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://x.com/iACADEMY_EDU" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-gray-800 hover:bg-blue-400 flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.youtube.com/@iacademycollege" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-gray-800 hover:bg-red-600 flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.tiktok.com/@iacademyofficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-gray-800 hover:bg-gray-900 flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <Music className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">
              © 2024 iJoin - iACADEMY Student Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;