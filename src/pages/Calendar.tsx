import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, School, GraduationCap, Users, ExternalLink, Sunrise, Sun, Sunset, Moon, Waves, Wind, Leaf, Fish, Gem, Cherry, Mountain, Cloud, Star, Sparkles, Droplets, Flower, Bird, TreePine, Shell } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isAfter, isBefore, addMonths, subMonths } from "date-fns";
import { RSVPButton } from "@/components/RSVPButton";

type Event = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  visibility?: string;
  org_id: string;
  organizations: {
    name: string;
    is_shs_org: boolean;
    profile_picture: string | null;
  } | null;
};

type TabFilter = 'all' | 'shs' | 'college';

export default function Calendar() {
  const { user } = useAuth();
  const { isSHSStudent, isUGStudent, isAdmin, isSAO } = useUserRole();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  
  // Event modal state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

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

  // Get time of day for legend
  const getTimeOfDay = (hour: number) => {
    if (hour < 12) return { label: "Morning", color: "text-amber-500", icon: Sunrise };
    if (hour < 17) return { label: "Afternoon", color: "text-orange-500", icon: Sun };
    if (hour < 20) return { label: "Evening", color: "text-indigo-500", icon: Sunset };
    return { label: "Night", color: "text-blue-500", icon: Moon };
  };

  // Set default tab based on user role
  useEffect(() => {
    if (isSHSStudent) {
      setActiveTab('shs');
    } else if (isUGStudent) {
      setActiveTab('college');
    } else {
      setActiveTab('all');
    }
  }, [isSHSStudent, isUGStudent]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Filter events based on active tab for calendar display
    let filtered = [...events];

    if (activeTab === 'shs') {
      filtered = filtered.filter(event => event.organizations?.is_shs_org === true);
    } else if (activeTab === 'college') {
      filtered = filtered.filter(event => event.organizations?.is_shs_org === false);
    }
    // 'all' shows everything

    setFilteredEvents(filtered);

    // Separate upcoming events (future dates) for the list
    const now = new Date();
    const upcoming = filtered.filter(event => isAfter(new Date(event.event_date), now));
    setUpcomingEvents(upcoming);
    
  }, [events, activeTab]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          name,
          description,
          event_date,
          location,
          visibility,
          org_id,
          organizations (
            name,
            is_shs_org,
            profile_picture
          )
        `)
        .eq("status", "approved")
        .eq("visibility", "public")
        .order("event_date", { ascending: true });

      if (error) throw error;
      
      // Filter out events with null organizations
      const validEvents = data?.filter(event => event.organizations !== null) || [];
      setEvents(validEvents as Event[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event) => isSameDay(new Date(event.event_date), date));
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleOrgClick = (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/org/${orgId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getOrgTypeBadge = (is_shs_org: boolean) => {
    if (is_shs_org) {
      return (
        <Badge variant="secondary" className="bg-primary/5 text-primary border-border gap-1">
          <School className="h-3 w-3" />
          SHS
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-destructive/30 text-destructive bg-card/80 gap-1">
          <GraduationCap className="h-3 w-3" />
          College
        </Badge>
      );
    }
  };

  const isPastEvent = (eventDate: string) => {
    return isBefore(new Date(eventDate), new Date());
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(startOfMonth(prevDate), 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(startOfMonth(prevDate), 1));
  };

  const goToToday = () => {
    setCurrentDate(startOfMonth(new Date()));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating Japanese Elements - with semantic colors */}
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

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-primary hover:bg-primary/5">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <img 
                  src="/logo.svg" 
                  alt="logo" 
                  className="h-7 w-auto md:h-8"
                />
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-brand-yellow border border-background"></div>
              </div>
              <h1 className="text-xl font-bold text-foreground">Calendar</h1>
            </div>
          </div>
          
          {/* Time Legend - with semantic colors */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border">
              <Sunrise className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-muted-foreground">Morning</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border">
              <Sun className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-muted-foreground">Afternoon</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border">
              <Sunset className="h-3 w-3 text-indigo-500" />
              <span className="text-xs text-muted-foreground">Evening</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border">
              <Moon className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-muted-foreground">Night</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Filter Tabs with depth */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabFilter)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-muted/80 backdrop-blur-sm border border-border p-1">
              <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                All Events
              </TabsTrigger>
              <TabsTrigger value="shs" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                <School className="h-4 w-4" />
                SHS Events
              </TabsTrigger>
              <TabsTrigger value="college" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                <GraduationCap className="h-4 w-4" />
                College Events
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            {activeTab === 'shs' && "Showing Senior High School events"}
            {activeTab === 'college' && "Showing College/Undergraduate events"}
            {activeTab === 'all' && "Showing all events from all organizations"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Calendar - with enhanced styling */}
          <Card className="md:col-span-2 border border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full"></div>
            <CardHeader>
              <div className="flex items-center justify-between relative z-20">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/5 border border-border">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">{format(currentDate, "MMMM yyyy")}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">
                      {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} scheduled
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="border-border text-foreground hover:bg-primary/5 cursor-pointer"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="border-border text-foreground hover:bg-primary/5 cursor-pointer"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="border-border text-foreground hover:bg-primary/5 cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square p-2 rounded-lg border text-sm relative transition-all duration-200
                        ${!isCurrentMonth ? "text-muted-foreground bg-muted border-border/50" : "bg-card border-border"}
                        ${isToday ? "border-brand-yellow border-2" : ""}
                        ${isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:border-primary hover:shadow-sm"}
                        ${dayEvents.length > 0 ? "font-semibold" : ""}
                      `}
                    >
                      <div className={isSelected ? "text-primary font-bold" : ""}>
                        {format(day, "d")}
                      </div>
                      
                      {/* Stamp effect for selected day */}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rotate-12 opacity-20 border-2 border-primary rounded-full"></div>
                          <div className="absolute w-6 h-6 -rotate-6 opacity-20 border-2 border-brand-yellow rounded-full"></div>
                        </div>
                      )}
                      
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {Array.from({ length: Math.min(dayEvents.length, 3) }).map((_, i) => (
                            <div
                              key={i}
                              className={`
                                h-1.5 w-1.5 rounded-full
                                ${dayEvents[i]?.organizations?.is_shs_org 
                                  ? 'bg-primary' 
                                  : 'bg-destructive'
                                }
                                ${isSelected ? 'bg-primary' : ''}
                              `}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className={`text-[10px] ml-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend - with semantic colors */}
              <div className="mt-8 pt-5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span>SHS Events</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive"></span>
                    <span>College Events</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Click a date to view events</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details - with enhanced styling */}
          <Card className="border border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-destructive/5 to-transparent rounded-bl-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <div className="p-1.5 rounded-lg bg-destructive/5 border border-destructive/20">
                  <CalendarIcon className="h-4 w-4 text-destructive" />
                </div>
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                {selectedDateEvents.length > 0
                  ? `${selectedDateEvents.length} event${selectedDateEvents.length > 1 ? "s" : ""}`
                  : "No events scheduled"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/20">
                  {selectedDateEvents.map((event) => {
                    const isPast = isPastEvent(event.event_date);
                    const eventHour = new Date(event.event_date).getHours();
                    const timeOfDay = getTimeOfDay(eventHour);
                    const TimeIcon = timeOfDay.icon;
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`
                          w-full text-left border rounded-lg p-4 space-y-3 
                          hover:shadow-md hover:border-primary transition-all bg-card/50 hover:bg-card
                          ${isPast ? 'opacity-75' : ''}
                          relative overflow-hidden group
                        `}
                      >
                        {/* Time indicator line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-destructive opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-foreground">{event.name}</h4>
                          {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                        </div>
                        {isPast && (
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Past Event</Badge>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-primary">
                            {event.organizations?.name}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.event_date), "h:mm a")}
                            <span className={`text-[10px] px-1 py-0.5 rounded flex items-center gap-0.5 ${timeOfDay.color} bg-card border border-border`}>
                              <TimeIcon className="h-3 w-3" />
                              {timeOfDay.label}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 border-t border-border pt-2">
                            {event.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted border border-border flex items-center justify-center">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <p>{selectedDate ? "No events scheduled for this day" : "Click a date to view events"}</p>
                  {selectedDate && activeTab !== 'all' && (
                    <p className="text-xs mt-2">
                      Try switching to{' '}
                      <button 
                        onClick={() => setActiveTab('all')}
                        className="text-primary hover:underline"
                      >
                        All Events
                      </button>{' '}
                      view
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events List - with enhanced styling */}
        <Card className="mt-8 border border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-brand-yellow/10 to-transparent rounded-bl-full"></div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-brand-yellow/10 border border-brand-yellow/30">
                  <CalendarIcon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Upcoming Events</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    {activeTab === 'all' && "Future events from organizations"}
                    {activeTab === 'shs' && "Future SHS organization events"}
                    {activeTab === 'college' && "Future College organization events"}
                  </CardDescription>
                </div>
              </div>
              {activeTab !== 'all' && (
                <Badge variant="outline" className="gap-1 border-border text-foreground">
                  {activeTab === 'shs' ? <School className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                  {activeTab === 'shs' ? 'SHS' : 'College'} Events
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/20">
                {upcomingEvents.map((event) => {
                  const eventHour = new Date(event.event_date).getHours();
                  const timeOfDay = getTimeOfDay(eventHour);
                  const TimeIcon = timeOfDay.icon;
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="w-full text-left border border-border rounded-lg p-4 hover:shadow-md hover:border-primary transition-all bg-card/50 hover:bg-card relative overflow-hidden group"
                    >
                      {/* Time gradient line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-destructive opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{event.name}</h4>
                            {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                          </div>
                          <p className="text-sm text-primary">{event.organizations?.name}</p>
                        </div>
                        <Badge variant="outline" className={`flex items-center gap-1 ${timeOfDay.color} border-border bg-card`}>
                          <TimeIcon className="h-3 w-3" />
                          {timeOfDay.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          {format(new Date(event.event_date), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-destructive" />
                          {format(new Date(event.event_date), "h:mm a")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-brand-yellow" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 border-t border-border pt-2 mt-2">
                          {event.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted border border-border flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
                <p>No upcoming events</p>
                {activeTab !== 'all' && (
                  <p className="text-sm mt-2">
                    Try checking{' '}
                    <button 
                      onClick={() => setActiveTab('all')}
                      className="text-primary hover:underline"
                    >
                      All Events
                    </button>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Event Details Modal with RSVP Button - updated styling */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden bg-background border border-border shadow-xl">
          {/* Header with proper spacing */}
          <div className="flex items-center justify-between p-6 pr-12 relative">
            <DialogTitle className="text-xl font-bold text-foreground">
              Event Details
            </DialogTitle>
            {selectedEvent && (
              <Badge variant="outline" className="absolute right-12 border-border text-muted-foreground">
                {format(new Date(selectedEvent.event_date), "MMM d, yyyy")}
              </Badge>
            )}
          </div>

          {selectedEvent && selectedEvent.organizations && (
            <>
              {/* Organization Header */}
              <div 
                onClick={(e) => handleOrgClick(selectedEvent.org_id, e)}
                className="px-6 py-3 bg-primary/5 border-y border-border hover:bg-primary/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={selectedEvent.organizations.profile_picture || undefined} />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      {getInitials(selectedEvent.organizations.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{selectedEvent.organizations.name}</p>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Click to view organization</p>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6 space-y-6">
                {/* Event Name with Time Label */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-foreground">{selectedEvent.name}</h3>
                    {(() => {
                      const hour = new Date(selectedEvent.event_date).getHours();
                      const timeOfDay = getTimeOfDay(hour);
                      const TimeIcon = timeOfDay.icon;
                      return (
                        <Badge className={`flex items-center gap-1 ${timeOfDay.color} bg-card border border-border`}>
                          <TimeIcon className="h-3 w-3" />
                          {timeOfDay.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  {isPastEvent(selectedEvent.event_date) && (
                    <Badge variant="outline" className="border-destructive/30 text-destructive">Past Event</Badge>
                  )}
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedEvent.visibility === 'public' ? 'Public Event' : 'Private Event'}
                    </Badge>
                  </div>
                </div>

                {/* Date, Time, Location Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</p>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span>{format(new Date(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</p>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-4 w-4 text-destructive" />
                      <span>{format(new Date(selectedEvent.event_date), "h:mm a")}</span>
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</p>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <MapPin className="h-4 w-4 text-brand-yellow" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</p>
                    <div className="bg-primary/5 rounded-lg p-4 border border-border">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* RSVP Button */}
                <div className="pt-4 border-t">
                  <RSVPButton 
                    eventId={selectedEvent.id}
                    eventName={selectedEvent.name}
                    visibility={selectedEvent.visibility}
                    size="lg"
                    className="w-full"
                  />
                </div>

                {/* Type Badge */}
                <div className="pt-2 flex justify-center">
                  {getOrgTypeBadge(selectedEvent.organizations.is_shs_org)}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
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
}