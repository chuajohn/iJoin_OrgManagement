// components/HelpModal.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  HelpCircle, 
  Users, 
  Shield, 
  Crown, 
  GraduationCap, 
  School, 
  Calendar, 
  MessageCircle, 
  Heart, 
  Settings, 
  User,
  BookOpen,
  Award,
  Bell,
  LogOut,
  Plus,
  Search,
  Home
} from "lucide-react";

interface HelpSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function HelpModal() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections: HelpSection[] = [
    {
      id: "getting-started",
      label: "Getting Started",
      icon: <Home className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A2E]">Getting Started with iJoin</h3>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Creating an Account</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Click Sign Up on the homepage</li>
              <li>Enter your full name, school email, and password</li>
              <li>Select your student type: SHS Student or Undergraduate Student</li>
              <li>Click Create Account</li>
              <li>Check your email for a verification link</li>
              <li>Click the link to verify your account</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Signing In</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Click Sign In on the homepage</li>
              <li>Enter your email and password</li>
              <li>Click Sign In</li>
            </ol>
          </div>

          <div className="bg-[#FFD966]/10 p-4 rounded-lg">
            <p className="text-sm">
              <strong className="text-[#FFD966]">Note:</strong> SHS students can only view and join SHS organizations. 
              Undergraduate students can only view and join College organizations.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "students",
      label: "For Students",
      icon: <GraduationCap className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A2E]">Student Guide</h3>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Dashboard Overview</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Feed:</strong> Announcements from your organizations</li>
              <li><strong>Upcoming Events:</strong> Events from your organizations</li>
              <li><strong>Quick Links:</strong> Explore, Calendar, Profile</li>
              <li><strong>Notifications:</strong> Bell icon shows updates</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Browsing Organizations</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Click Explore in the top navigation</li>
              <li>Filter by All, SHS, or College</li>
              <li>Search by organization name</li>
              <li>Click View Organization to learn more</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Joining an Organization</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Find an organization you're interested in</li>
              <li>Click Join Organization</li>
              <li>Wait for approval from the leader or officer</li>
              <li>You will receive a notification when accepted</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Interacting with Posts</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Heart button to like announcements</li>
              <li>Message button to comment on posts (press Enter to post)</li>
              <li>Click Read more for longer posts</li>
              <li>Click images to view full size</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Events</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>View upcoming events in your dashboard</li>
              <li>Click Calendar to see all events by date</li>
              <li>Click an event to see details and RSVP</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "leaders",
      label: "For Leaders & Officers",
      icon: <Crown className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A2E]">Leader & Officer Guide</h3>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm">
              <strong className="text-yellow-700">Leaders:</strong> Full management control • Can remove members • Can promote to officers • Can delete comments
            </p>
            <p className="text-sm mt-2">
              <strong className="text-blue-700">Officers:</strong> Can approve members • Can create announcements • Cannot remove members
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Managing Your Organization</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Click Manage on your organization card</li>
              <li>Use the tabs to navigate different sections</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Members Tab</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Accept/Reject:</strong> Review pending membership requests</li>
              <li><strong>Promote:</strong> Promote members to officers (leaders only)</li>
              <li><strong>Remove:</strong> Remove members from organization (leaders only)</li>
              <li><strong>Bulk Actions:</strong> Use checkboxes to approve or reject multiple requests</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Announcements Tab</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Create announcements with images</li>
              <li>Edit or delete your announcements</li>
              <li>View comments and engagement</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Events Tab</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Create events with date, time, and location</li>
              <li>Events go to SAO for approval</li>
              <li>Track RSVPs once approved</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Photos & Documents</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Upload photos to showcase your organization</li>
              <li>Drag to reorder photos</li>
              <li>Upload PDF documents for members</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Details Tab</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Edit organization name and description</li>
              <li>Update logo (upload image or URL)</li>
              <li>Add social media links (Instagram, Facebook)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "sao-admin",
      label: "SAO & Admin",
      icon: <Shield className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A2E]">SAO & Admin Guide</h3>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm">
              <strong className="text-blue-700">SAO Dashboard:</strong> Monitor all activities • Approve events • View all organizations
            </p>
            <p className="text-sm mt-2">
              <strong className="text-red-700">Admin Panel:</strong> Full system control • Manage user roles • Approve organizations
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">SAO Responsibilities</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Event Approval:</strong> Review and approve or reject event requests</li>
              <li><strong>Monitoring:</strong> View all organizations, announcements, and events</li>
              <li><strong>Oversight:</strong> Ensure activities follow school policies</li>
              <li>Cannot modify organization details or user roles</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">Admin Capabilities</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>User Management:</strong> Assign or change user roles (SHS, UG, SAO, Admin)</li>
              <li><strong>Organization Management:</strong> Approve or reject organization requests</li>
              <li><strong>Event Management:</strong> Approve or reject any event</li>
              <li><strong>Full Access:</strong> View and manage everything on the platform</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">How to Approve Requests</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Go to Admin Panel or SAO Dashboard</li>
              <li>Check the Pending section</li>
              <li>Review the request details</li>
              <li>Click Approve or Reject</li>
              <li>The requester will receive a notification</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#0057A3]">User Role Management</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Admins can assign any role to any user</li>
              <li>Roles: SHS Student, Undergraduate, SAO, Admin</li>
              <li>Students can only join organizations matching their role</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      icon: <HelpCircle className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A2E]">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-[#0057A3]">Why can't I join an organization?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                SHS students can only join SHS organizations. Undergraduate students can only join College organizations. 
                This ensures proper grouping of students.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0057A3]">How do I become a leader?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                When your organization request is approved by SAO or Admin, you automatically become the leader. 
                Admins can also assign leader roles in the User Management panel.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0057A3]">Can I edit my comment?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Yes. Click the three dots on your comment and select Edit. You can edit your own comments anytime.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0057A3]">Can I delete someone else's comment?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Only Leaders can delete comments in their organization. Regular members can only delete their own comments.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0057A3]">My event isn't showing up</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Events must be approved by SAO before they appear publicly. Check your notifications for approval status.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0057A3]">How do I leave an organization?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Go to the organization page and click Leave Organization. Type DELETE to confirm.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0057A3]">I'm not getting notifications</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Check your browser permissions. Notifications appear in the bell icon and as popups when you are active on the site.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0057A3]">Can I upload photos for my organization?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Yes. Leaders and officers can upload photos in the organization management page under the Photos section.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#0057A3]">What are the badges on my profile?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Game Changer: iACADEMY student. Crown: Organization Leader. Shield: Organization Officer.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5"
      >
        <HelpCircle className="h-4 w-4 mr-1" />
        Help
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden bg-[#FCF9F5] border border-[#00A3FF]/30">
          <div className="flex h-[70vh]">
            {/* Sidebar */}
            <div className="w-64 border-r border-[#00A3FF]/20 bg-white/50 backdrop-blur-sm overflow-y-auto">
              <div className="p-4 border-b border-[#00A3FF]/20">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#00A3FF]" />
                    User Guide
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#4A5568]">
                    Quick help for using iJoin
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <nav className="p-2 space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                      activeSection === section.id
                        ? "bg-[#00A3FF]/10 text-[#00A3FF] border-l-2 border-[#00A3FF]"
                        : "text-[#4A5568] hover:bg-[#00A3FF]/5 hover:text-[#1A1A2E]"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 flex items-center justify-center",
                      activeSection === section.id ? "text-[#00A3FF]" : "text-[#4A5568]"
                    )}>
                      {section.icon}
                    </span>
                    <span className="flex-1">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white/30">
              {sections.find(s => s.id === activeSection)?.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}