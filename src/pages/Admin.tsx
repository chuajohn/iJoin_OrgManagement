import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoleManagement } from "@/components/admin/UserRoleManagement";
import { OrganizationManagement } from "@/components/admin/OrganizationManagement";
import { EventManagement } from "@/components/admin/EventManagement";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Menu,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Loader2
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { useEffect, useState, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Checkbox
} from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface Section {
  id: 'users' | 'organizations' | 'events';
  title: string;
  icon: React.ReactNode;
  count?: number;
  pendingCount?: number;
  description: string;
}

interface ExportOptions {
  users: boolean;
  organizations: boolean;
  memberships: boolean;
}

export default function Admin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'organizations');
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeBookmark, setActiveBookmark] = useState<string | null>(null);
  
  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    users: true,
    organizations: true,
    memberships: true
  });
  
  // Refs for section elements
  const sectionRefs = {
    users: useRef<HTMLDivElement>(null),
    organizations: useRef<HTMLDivElement>(null),
    events: useRef<HTMLDivElement>(null)
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle tab parameter from URL and scroll to section
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['users', 'organizations', 'events'].includes(tab)) {
      setActiveTab(tab);
      
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.add(tab);
        return newSet;
      });

      const attemptScroll = (attempts = 0) => {
        const element = sectionRefs[tab as keyof typeof sectionRefs]?.current;
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          setActiveBookmark(tab);
          setTimeout(() => setActiveBookmark(null), 2000);
        } else if (attempts < 10) {
          setTimeout(() => attemptScroll(attempts + 1), 100);
        }
      };

      setTimeout(() => attemptScroll(), 300);
    }
  }, [searchParams]);

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: orgsCount } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: pendingOrgsCount } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      const { count: pendingEventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/admin?tab=${tabId}`, { replace: true });
    
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(tabId);
      return newSet;
    });

    setTimeout(() => {
      const element = sectionRefs[tabId as keyof typeof sectionRefs]?.current;
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        setActiveBookmark(tabId);
        setTimeout(() => setActiveBookmark(null), 2000);
      }
    }, 200);
  };

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs[sectionId as keyof typeof sectionRefs]?.current;
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setActiveBookmark(sectionId);
      handleTabChange(sectionId);
      setTimeout(() => setActiveBookmark(null), 2000);
    }
  };

  const toggleExportOption = (key: keyof ExportOptions) => {
    setExportOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportData = async () => {
    setExporting(true);
    const workbook = XLSX.utils.book_new();
    
    try {
      // Export Users
      if (exportOptions.users) {
        const { data: users } = await supabase
          .from("profiles")
          .select("id, name, email, created_at, profile_picture")
          .order("created_at", { ascending: false });
        
        const usersData = users?.map(u => ({
          'User ID': u.id,
          'Name': u.name,
          'Email': u.email,
          'Joined': new Date(u.created_at).toLocaleDateString(),
          'Profile Picture': u.profile_picture || 'No image'
        })) || [];
        
        const ws = XLSX.utils.json_to_sheet(usersData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Users');
      }

      // Export Organizations
      if (exportOptions.organizations) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name, description, status, is_shs_org, created_at, profile_picture")
          .order("created_at", { ascending: false });
        
        const orgsData = orgs?.map(o => ({
          'Organization ID': o.id,
          'Name': o.name,
          'Description': o.description || 'No description',
          'Status': o.status,
          'Type': o.is_shs_org ? 'SHS' : 'College',
          'Created': new Date(o.created_at).toLocaleDateString(),
          'Logo': o.profile_picture || 'No image'
        })) || [];
        
        const ws = XLSX.utils.json_to_sheet(orgsData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Organizations');
      }

      // Export Memberships
      if (exportOptions.memberships) {
        const { data: memberships } = await supabase
          .from("memberships")
          .select(`
            id, role, status, joined_at,
            profiles (name, email),
            organizations (name)
          `)
          .order("joined_at", { ascending: false });
        
        const membershipsData = memberships?.map(m => ({
          'Membership ID': m.id,
          'Member Name': m.profiles?.name || 'Unknown',
          'Member Email': m.profiles?.email || 'Unknown',
          'Organization': m.organizations?.name || 'Unknown',
          'Role': m.role,
          'Status': m.status,
          'Joined': new Date(m.joined_at).toLocaleDateString()
        })) || [];
        
        const ws = XLSX.utils.json_to_sheet(membershipsData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Memberships');
      }

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `iJoin_Archive_${date}.xlsx`);
      
      toast.success(`Exported ${Object.values(exportOptions).filter(v => v).length} sections successfully!`);
      setExportDialogOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const sections: Section[] = [
    {
      id: 'users',
      title: 'User Management',
      icon: <Users className="h-4 w-4" />,
      count: stats.users,
      pendingCount: 0,
      description: 'Manage user roles and permissions'
    },
    {
      id: 'organizations',
      title: 'Organization Management',
      icon: <Building2 className="h-4 w-4" />,
      count: stats.organizations,
      pendingCount: stats.pendingOrgs,
      description: 'Approve and manage organizations'
    },
    {
      id: 'events',
      title: 'Event Management',
      icon: <Calendar className="h-4 w-4" />,
      count: stats.events,
      pendingCount: stats.pendingEvents,
      description: 'Review and approve events'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Admin Management Panel</h1>
          </div>
          <SignOutButton variant="ghost" size="sm" />
        </div>
      </header>

      {/* Main Layout with Sticky Sidebar */}
      <div className="flex">
        {/* Collapsible Sidebar */}
        <aside 
          className={cn(
            "bg-background border-r border-border transition-all duration-300 sticky top-[73px] h-[calc(100vh-73px)] overflow-hidden flex flex-col",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex-1 overflow-y-auto">
            {/* Sidebar Header with Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              {!sidebarCollapsed && (
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <ChevronsLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Scrollable Sidebar Content */}
            <div className="p-3 space-y-6">
              {/* Quick Stats */}
              {!sidebarCollapsed ? (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">Users</span>
                      </div>
                      <span className="text-sm font-semibold">{stats.users.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">Orgs</span>
                      </div>
                      <span className="text-sm font-semibold">{stats.organizations}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">Events</span>
                      </div>
                      <span className="text-sm font-semibold">{stats.events}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold">{stats.users}</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold">{stats.organizations}</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold">{stats.events}</span>
                  </div>
                </div>
              )}

              {/* Pending Items */}
              {(stats.pendingOrgs > 0 || stats.pendingEvents > 0) && (
                <>
                  <Separator />
                  {!sidebarCollapsed ? (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pending</h3>
                      <div className="space-y-2">
                        {stats.pendingOrgs > 0 && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-destructive" />
                              <span className="text-sm text-destructive">Orgs</span>
                            </div>
                            <Badge className="bg-destructive/20 text-destructive border-0">{stats.pendingOrgs}</Badge>
                          </div>
                        )}
                        {stats.pendingEvents > 0 && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-destructive" />
                              <span className="text-sm text-destructive">Events</span>
                            </div>
                            <Badge className="bg-destructive/20 text-destructive border-0">{stats.pendingEvents}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.pendingOrgs > 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-5 w-5 text-destructive" />
                          <Badge className="bg-destructive/20 text-destructive border-0">{stats.pendingOrgs}</Badge>
                        </div>
                      )}
                      {stats.pendingEvents > 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="h-5 w-5 text-destructive" />
                          <Badge className="bg-destructive/20 text-destructive border-0">{stats.pendingEvents}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <Separator />

              {/* Navigation */}
              {!sidebarCollapsed ? (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sections</h3>
                  <div className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-lg transition-colors",
                          activeTab === section.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted text-foreground",
                          activeBookmark === section.id && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-5 w-5 rounded flex items-center justify-center",
                            activeTab === section.id ? "text-primary" : "text-muted-foreground"
                          )}>
                            {section.icon}
                          </div>
                          <span className="text-sm font-medium">{section.title}</span>
                        </div>
                        {section.pendingCount ? (
                          <Badge className="bg-destructive/20 text-destructive border-0 text-xs px-1.5">
                            {section.pendingCount}
                          </Badge>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                        activeTab === section.id 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted text-foreground",
                        activeBookmark === section.id && "ring-2 ring-primary ring-offset-2"
                      )}
                      title={section.title}
                    >
                      <div className="h-5 w-5">{section.icon}</div>
                      {section.pendingCount ? (
                        <Badge className="bg-destructive/20 text-destructive border-0 text-[10px] px-1">
                          {section.pendingCount}
                        </Badge>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Button - Bottom Left */}
          <div className="border-t border-border p-3">
            {!sidebarCollapsed ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                onClick={() => setExportDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="w-full h-9"
                onClick={() => setExportDialogOpen(true)}
                title="Export"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section.id}
                id={`section-${section.id}`}
                ref={sectionRefs[section.id]}
                className="scroll-mt-20"
              >
                <div
                  className={cn(
                    "bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all",
                    activeBookmark === section.id && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {/* Section Header */}
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        section.id === 'users' && "bg-primary/10 text-primary",
                        section.id === 'organizations' && "bg-primary/10 text-primary",
                        section.id === 'events' && "bg-primary/10 text-primary"
                      )}>
                        {section.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-foreground">
                            {section.title}
                          </h2>
                          {section.pendingCount ? (
                            <Badge className="bg-destructive/20 text-destructive border-0">
                              {section.pendingCount} pending
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Section Content */}
                  {expandedSections.has(section.id) && (
                    <div className="border-t border-border p-5">
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
      </div>

      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="default" 
            size="icon" 
            className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg md:hidden"
          >
            <Menu className="h-5 w-5 text-primary-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(70vh-80px)]">
            {/* Export Button in Mobile */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                setExportDialogOpen(true);
                const closeButton = document.querySelector('[data-radix-collection-item]');
                if (closeButton instanceof HTMLElement) {
                  closeButton.click();
                }
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 p-2">
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Users</p>
                <p className="text-lg font-bold text-foreground">{stats.users}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Orgs</p>
                <p className="text-lg font-bold text-foreground">{stats.organizations}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Events</p>
                <p className="text-lg font-bold text-foreground">{stats.events}</p>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => {
                    handleTabChange(section.id);
                    const closeButton = document.querySelector('[data-radix-collection-item]');
                    if (closeButton instanceof HTMLElement) {
                      closeButton.click();
                    }
                  }}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    section.id === 'users' && "bg-primary/10 text-primary",
                    section.id === 'organizations' && "bg-primary/10 text-primary",
                    section.id === 'events' && "bg-primary/10 text-primary"
                  )}>
                    {section.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                  {section.pendingCount ? (
                    <Badge className="bg-destructive/20 text-destructive border-0">
                      {section.pendingCount}
                    </Badge>
                  ) : null}
                </Button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </DialogTitle>
            <DialogDescription>
              Select the data you want to export to Excel format. All data will be exported as separate sheets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Select data to export:</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allSelected = Object.values(exportOptions).every(v => v);
                    setExportOptions({
                      users: !allSelected,
                      organizations: !allSelected,
                      memberships: !allSelected
                    });
                  }}
                  className="text-xs"
                >
                  {Object.values(exportOptions).every(v => v) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <Checkbox
                    id="export-users"
                    checked={exportOptions.users}
                    onCheckedChange={() => toggleExportOption('users')}
                  />
                  <Label htmlFor="export-users" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Users</span>
                    </div>
                    <p className="text-xs text-muted-foreground">User profiles, names, emails, join dates</p>
                  </Label>
                  <Badge variant="outline">{stats.users} records</Badge>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <Checkbox
                    id="export-organizations"
                    checked={exportOptions.organizations}
                    onCheckedChange={() => toggleExportOption('organizations')}
                  />
                  <Label htmlFor="export-organizations" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>Organizations</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Org details, status, type, creation date</p>
                  </Label>
                  <Badge variant="outline">{stats.organizations} records</Badge>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <Checkbox
                    id="export-memberships"
                    checked={exportOptions.memberships}
                    onCheckedChange={() => toggleExportOption('memberships')}
                  />
                  <Label htmlFor="export-memberships" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Memberships</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Member-organization relationships, roles, join dates</p>
                  </Label>
                  <Badge variant="outline">All memberships</Badge>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={exportData} 
              disabled={exporting || !Object.values(exportOptions).some(v => v)}
              className="gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export to Excel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}