import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoleManagement } from "@/components/admin/UserRoleManagement";
import { OrganizationManagement } from "@/components/admin/OrganizationManagement";
import { EventManagement } from "@/components/admin/EventManagement";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Settings, Users, Calendar, Bookmark, ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Section {
  id: 'users' | 'organizations' | 'events';
  title: string;
  icon: React.ReactNode;
  count?: number;
  pendingCount?: number;
  color: string;
}

export default function Admin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    organizations: 0,
    events: 0,
    pendingOrgs: 0,
    pendingEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['users', 'organizations', 'events'])
  );
  const [activeBookmark, setActiveBookmark] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    fetchStats();
    loadBookmarks();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users (profiles count)
      const { count: usersCount, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Get total organizations (active only)
      const { count: orgsCount, error: orgsError } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (orgsError) throw orgsError;

      // Get pending organizations
      const { count: pendingOrgsCount, error: pendingOrgsError } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingOrgsError) throw pendingOrgsError;

      // Get total events (approved only)
      const { count: eventsCount, error: eventsError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      if (eventsError) throw eventsError;

      // Get pending events
      const { count: pendingEventsCount, error: pendingEventsError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingEventsError) throw pendingEventsError;

      setStats({
        users: usersCount || 0,
        organizations: orgsCount || 0,
        events: eventsCount || 0,
        pendingOrgs: pendingOrgsCount || 0,
        pendingEvents: pendingEventsCount || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = () => {
    const saved = localStorage.getItem('adminBookmarks');
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  };

  const saveBookmark = (sectionId: string) => {
    if (!bookmarks.includes(sectionId)) {
      const newBookmarks = [...bookmarks, sectionId];
      setBookmarks(newBookmarks);
      localStorage.setItem('adminBookmarks', JSON.stringify(newBookmarks));
    }
  };

  const removeBookmark = (sectionId: string) => {
    const newBookmarks = bookmarks.filter(b => b !== sectionId);
    setBookmarks(newBookmarks);
    localStorage.setItem('adminBookmarks', JSON.stringify(newBookmarks));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveBookmark(sectionId);
      setTimeout(() => setActiveBookmark(null), 2000);
    }
  };

  const sections: Section[] = [
    {
      id: 'users',
      title: 'User Management',
      icon: <Users className="h-4 w-4" />,
      count: stats.users,
      color: 'bg-[#00A3FF]'
    },
    {
      id: 'organizations',
      title: 'Organization Management',
      icon: <Settings className="h-4 w-4" />,
      count: stats.organizations,
      pendingCount: stats.pendingOrgs,
      color: 'bg-[#B43B3B]'
    },
    {
      id: 'events',
      title: 'Event Management',
      icon: <Calendar className="h-4 w-4" />,
      count: stats.events,
      pendingCount: stats.pendingEvents,
      color: 'bg-[#FFD966]'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#00A3FF]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#B43B3B]/5 rounded-full blur-3xl pointer-events-none"></div>

      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#00A3FF]/30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
              className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#B43B3B]/10 border border-[#B43B3B]/30 flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#B43B3B]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A2E]">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Menu - Fixed */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Quick Navigation</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        scrollToSection(section.id);
                        // Fix: Cast to HTMLElement to access click method
                        const closeButton = document.querySelector('[data-radix-collection-item]');
                        if (closeButton instanceof HTMLElement) {
                          closeButton.click();
                        }
                      }}
                    >
                      {section.icon}
                      {section.title}
                      {section.pendingCount && section.pendingCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {section.pendingCount} pending
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Bookmarks
                  </h4>
                  {bookmarks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Click the bookmark icon on any section to save it here
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => {
                        const section = sections.find(s => s.id === bookmark);
                        if (!section) return null;
                        return (
                          <Button
                            key={bookmark}
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => scrollToSection(bookmark)}
                          >
                            {section.icon}
                            {section.title}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <SignOutButton 
              variant="ghost" 
              size="icon" 
              className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5"
            />
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="border-t border-[#00A3FF]/10 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#4A5568]">Pending:</span>
                <Badge variant="destructive" className="gap-1">
                  {stats.pendingOrgs} orgs
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  {stats.pendingEvents} events
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <span className="text-[#4A5568]">Bookmarks:</span>
                <div className="flex items-center gap-1">
                  {bookmarks.map((bookmark) => {
                    const section = sections.find(s => s.id === bookmark);
                    if (!section) return null;
                    return (
                      <Button
                        key={bookmark}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => scrollToSection(bookmark)}
                        title={`Go to ${section.title}`}
                      >
                        {section.icon}
                      </Button>
                    );
                  })}
                  {bookmarks.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Click <Bookmark className="h-3 w-3 inline" /> to bookmark sections
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {sections.map((section) => (
            <div
              key={section.id}
              className={cn(
                "bg-white/50 backdrop-blur-sm border rounded-xl p-4 flex items-center gap-3 transition-all",
                "hover:shadow-md cursor-pointer",
                activeBookmark === section.id && "ring-2 ring-offset-2 ring-[#00A3FF]"
              )}
              onClick={() => scrollToSection(section.id)}
            >
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                section.id === 'users' && "bg-[#00A3FF]/5 border border-[#00A3FF]/20",
                section.id === 'organizations' && "bg-[#B43B3B]/5 border border-[#B43B3B]/20",
                section.id === 'events' && "bg-[#FFD966]/5 border border-[#FFD966]/20"
              )}>
                <div className={cn(
                  "h-5 w-5",
                  section.id === 'users' && "text-[#00A3FF]",
                  section.id === 'organizations' && "text-[#B43B3B]",
                  section.id === 'events' && "text-[#FFD966]"
                )}>
                  {section.icon}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#4A5568]">{section.title}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-[#1A1A2E]">
                    {loading ? "..." : section.count}
                  </p>
                  {section.pendingCount && section.pendingCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {section.pendingCount} pending
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  bookmarks.includes(section.id) && "text-[#00A3FF]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (bookmarks.includes(section.id)) {
                    removeBookmark(section.id);
                  } else {
                    saveBookmark(section.id);
                  }
                }}
              >
                <Bookmark className="h-4 w-4" fill={bookmarks.includes(section.id) ? "currentColor" : "none"} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-2 relative z-10">
        <div className="space-y-4 max-w-5xl mx-auto">
          {sections.map((section) => (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className="scroll-mt-24"
            >
              <div
                className={cn(
                  "border rounded-lg overflow-hidden transition-all",
                  expandedSections.has(section.id) ? "bg-white/80" : "bg-white/50"
                )}
              >
                {/* Section Header - Click to collapse/expand */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#00A3FF]/5 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      section.id === 'users' && "bg-[#00A3FF]/5 border border-[#00A3FF]/20",
                      section.id === 'organizations' && "bg-[#B43B3B]/5 border border-[#B43B3B]/20",
                      section.id === 'events' && "bg-[#FFD966]/5 border border-[#FFD966]/20"
                    )}>
                      <div className={cn(
                        "h-5 w-5",
                        section.id === 'users' && "text-[#00A3FF]",
                        section.id === 'organizations' && "text-[#B43B3B]",
                        section.id === 'events' && "text-[#FFD966]"
                      )}>
                        {section.icon}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#1A1A2E]">
                        {section.title}
                      </h2>
                      {section.pendingCount && section.pendingCount > 0 && (
                        <p className="text-xs text-[#B43B3B]">
                          {section.pendingCount} item{section.pendingCount !== 1 ? 's' : ''} pending approval
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (bookmarks.includes(section.id)) {
                          removeBookmark(section.id);
                        } else {
                          saveBookmark(section.id);
                        }
                      }}
                    >
                      <Bookmark 
                        className="h-4 w-4" 
                        fill={bookmarks.includes(section.id) ? "currentColor" : "none"} 
                      />
                    </Button>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-5 w-5 text-[#4A5568]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[#4A5568]" />
                    )}
                  </div>
                </div>

                {/* Section Content - Collapsible */}
                {expandedSections.has(section.id) && (
                  <div className="border-t border-[#00A3FF]/20">
                    {section.id === 'users' && <UserRoleManagement />}
                    {section.id === 'organizations' && <OrganizationManagement />}
                    {section.id === 'events' && <EventManagement />}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Quick Navigation Floating Button (Mobile) - Fixed */}
      <div className="fixed bottom-4 right-4 md:hidden z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="h-12 w-12 rounded-full bg-[#00A3FF] hover:bg-[#00A3FF]/90 shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Quick Navigation</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(60vh-80px)]">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    scrollToSection(section.id);
                    // Fix: Cast to HTMLElement to access click method
                    const closeButton = document.querySelector('[data-radix-collection-item]');
                    if (closeButton instanceof HTMLElement) {
                      closeButton.click();
                    }
                  }}
                >
                  {section.icon}
                  {section.title}
                  {section.pendingCount && section.pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {section.pendingCount}
                    </Badge>
                  )}
                </Button>
              ))}
              {/* ... rest of the content ... */}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Footer */}
      <footer className="mt-12 bg-[#1A1A2E] border-t border-[#00A3FF]/20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-[#FCF9F5]/40">
            <p>© 2026 iJoin - iACADEMY Student Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}