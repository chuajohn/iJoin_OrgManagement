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
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, School, GraduationCap, Users, ExternalLink, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isAfter, isBefore, addMonths, subMonths } from "date-fns";

type Event = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
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
    e.stopPropagation(); // Prevent event modal from opening
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
        <Badge variant="secondary" className="bg-[#00A3FF]/5 text-[#00A3FF] border-[#00A3FF]/30 gap-1">
          <School className="h-3 w-3" />
          SHS
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-[#B43B3B]/30 text-[#B43B3B] bg-white/80 gap-1">
          <GraduationCap className="h-3 w-3" />
          College
        </Badge>
      );
    }
  };

  const isPastEvent = (eventDate: string) => {
    return isBefore(new Date(eventDate), new Date());
  };

  // Navigation functions - now working properly
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
    <div className="min-h-screen bg-gradient-to-b from-[#FCF9F5] to-[#1A1A2E]/5">
      {/* Decorative background elements */}
      <div className="absolute top-40 left-0 w-72 h-72 bg-[#00A3FF]/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-40 right-0 w-96 h-96 bg-[#B43B3B]/5 rounded-full blur-3xl -z-10"></div>

      <header className="sticky top-0 z-50 bg-[#FCF9F5]/95 backdrop-blur-sm border-b border-[#00A3FF]/30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-[#4A5568] hover:text-[#00A3FF] hover:bg-[#00A3FF]/5">
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
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#FFD966] border border-[#1A1A2E]"></div>
              </div>
              <h1 className="text-xl font-bold text-[#1A1A2E]">Calendar</h1>
            </div>
          </div>
          
          {/* Time Legend */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#00A3FF]/20">
              <Sunrise className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-[#4A5568]">Morning</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#00A3FF]/20">
              <Sun className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-[#4A5568]">Afternoon</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#00A3FF]/20">
              <Sunset className="h-3 w-3 text-indigo-500" />
              <span className="text-xs text-[#4A5568]">Evening</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#00A3FF]/20">
              <Moon className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-[#4A5568]">Night</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filter Tabs with depth */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabFilter)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-[#E1E8F0]/80 backdrop-blur-sm border border-[#00A3FF]/30 p-1">
              <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-[#00A3FF] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                All Events
              </TabsTrigger>
              <TabsTrigger value="shs" className="gap-2 data-[state=active]:bg-[#00A3FF] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <School className="h-4 w-4" />
                SHS Events
              </TabsTrigger>
              <TabsTrigger value="college" className="gap-2 data-[state=active]:bg-[#00A3FF] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <GraduationCap className="h-4 w-4" />
                College Events
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <p className="text-center text-xs text-[#4A5568] mt-4">
            {activeTab === 'shs' && "Showing Senior High School events"}
            {activeTab === 'college' && "Showing College/Undergraduate events"}
            {activeTab === 'all' && "Showing all events from all organizations"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="md:col-span-2 border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00A3FF]/5 to-transparent rounded-bl-full"></div>
              <CardHeader>
                <div className="flex items-center justify-between relative z-20">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#00A3FF]/5 border border-[#00A3FF]/20">
                      <CalendarIcon className="h-5 w-5 text-[#00A3FF]" />
                    </div>
                    <div>
                      <CardTitle className="text-[#1A1A2E]">{format(currentDate, "MMMM yyyy")}</CardTitle>
                      <CardDescription className="text-[#4A5568] mt-2">
                        {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} scheduled
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousMonth}
                      className="border-[#00A3FF]/30 text-[#1A1A2E] hover:bg-[#00A3FF]/5 cursor-pointer"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToToday}
                      className="border-[#00A3FF]/30 text-[#1A1A2E] hover:bg-[#00A3FF]/5 cursor-pointer"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextMonth}
                      className="border-[#00A3FF]/30 text-[#1A1A2E] hover:bg-[#00A3FF]/5 cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-[#4A5568] py-2">
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
    ${!isCurrentMonth ? "text-[#4A5568] bg-[#FCF9F5] border-[#00A3FF]/10" : "bg-white border-[#00A3FF]/30"}
    ${isToday ? "border-[#FFD966] border-2" : ""}
    ${isSelected ? "ring-2 ring-[#00A3FF] ring-offset-2" : "hover:border-[#00A3FF] hover:shadow-sm"}
    ${dayEvents.length > 0 ? "font-semibold" : ""}
  `}
>
  <div className={isSelected ? "text-[#00A3FF] font-bold" : ""}>
    {format(day, "d")}
  </div>
  
  {/* Stamp effect for selected day */}
  {isSelected && (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-8 h-8 rotate-12 opacity-20 border-2 border-[#00A3FF] rounded-full"></div>
      <div className="absolute w-6 h-6 -rotate-6 opacity-20 border-2 border-[#FFD966] rounded-full"></div>
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
              ? 'bg-[#00A3FF]' 
              : 'bg-[#B43B3B]'
            }
            ${isSelected ? 'bg-[#00A3FF]' : ''}
          `}
        />
      ))}
      {dayEvents.length > 3 && (
        <span className={`text-[10px] ml-0.5 ${isSelected ? 'text-[#00A3FF]' : 'text-[#4A5568]'}`}>
          +{dayEvents.length - 3}
        </span>
      )}
    </div>
  )}
</button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-5 border-t border-[#00A3FF]/20 flex items-center justify-between text-xs text-[#4A5568]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#00A3FF]"></span>
                    <span>SHS Events</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#B43B3B]"></span>
                    <span>College Events</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#4A5568]">Click a date to view events</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details - Clickable cards that open modal */}
          <Card className="border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#B43B3B]/5 to-transparent rounded-bl-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1A1A2E]">
                <div className="p-1.5 rounded-lg bg-[#B43B3B]/5 border border-[#B43B3B]/20">
                  <CalendarIcon className="h-4 w-4 text-[#B43B3B]" />
                </div>
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
              </CardTitle>
              <CardDescription className="text-[#4A5568] mt-1">
                {selectedDateEvents.length > 0
                  ? `${selectedDateEvents.length} event${selectedDateEvents.length > 1 ? "s" : ""}`
                  : "No events scheduled"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#00A3FF]/20">
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
                          hover:shadow-md hover:border-[#00A3FF] transition-all bg-white/50 hover:bg-white
                          ${isPast ? 'opacity-75' : ''}
                          relative overflow-hidden group
                        `}
                      >
                        {/* Time indicator line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00A3FF] to-[#B43B3B] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-[#1A1A2E]">{event.name}</h4>
                          {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                        </div>
                        {isPast && (
                          <Badge variant="outline" className="text-[10px] border-[#B43B3B]/30 text-[#B43B3B]">Past Event</Badge>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-[#00A3FF]">
                            {event.organizations?.name}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-[#4A5568]">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.event_date), "h:mm a")}
                            <span className={`text-[10px] px-1 py-0.5 rounded flex items-center gap-0.5 ${timeOfDay.color} bg-white border border-[#00A3FF]/10`}>
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
                          <p className="text-sm text-[#4A5568] line-clamp-2 border-t border-[#00A3FF]/10 pt-2">
                            {event.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-[#4A5568] text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#E1E8F0] border border-[#00A3FF]/30 flex items-center justify-center">
                    <CalendarIcon className="h-8 w-8 text-[#4A5568] opacity-50" />
                  </div>
                  <p>{selectedDate ? "No events scheduled for this day" : "Click a date to view events"}</p>
                  {selectedDate && activeTab !== 'all' && (
                    <p className="text-xs mt-2">
                      Try switching to{' '}
                      <button 
                        onClick={() => setActiveTab('all')}
                        className="text-[#00A3FF] hover:underline"
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

        {/* Upcoming Events List - Only shows future events */}
        <Card className="mt-8 border border-[#00A3FF]/30 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#FFD966]/10 to-transparent rounded-bl-full"></div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#FFD966]/10 border border-[#FFD966]/30">
                  <CalendarIcon className="h-5 w-5 text-[#1A1A2E]" />
                </div>
                <div>
                  <CardTitle className="text-[#1A1A2E]">Upcoming Events</CardTitle>
                  <CardDescription className="text-[#4A5568] mt-1">
                    {activeTab === 'all' && "Future events from organizations"}
                    {activeTab === 'shs' && "Future SHS organization events"}
                    {activeTab === 'college' && "Future College organization events"}
                  </CardDescription>
                </div>
              </div>
              {activeTab !== 'all' && (
                <Badge variant="outline" className="gap-1 border-[#00A3FF]/30 text-[#1A1A2E]">
                  {activeTab === 'shs' ? <School className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                  {activeTab === 'shs' ? 'SHS' : 'College'} Events
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#00A3FF]/20">
                {upcomingEvents.map((event) => {
                  const eventHour = new Date(event.event_date).getHours();
                  const timeOfDay = getTimeOfDay(eventHour);
                  const TimeIcon = timeOfDay.icon;
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="w-full text-left border border-[#00A3FF]/30 rounded-lg p-4 hover:shadow-md hover:border-[#00A3FF] transition-all bg-white/50 hover:bg-white relative overflow-hidden group"
                    >
                      {/* Time gradient line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00A3FF] to-[#B43B3B] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#1A1A2E]">{event.name}</h4>
                            {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                          </div>
                          <p className="text-sm text-[#00A3FF]">{event.organizations?.name}</p>
                        </div>
                        <Badge variant="outline" className={`flex items-center gap-1 ${timeOfDay.color} border-[#00A3FF]/20 bg-white`}>
                          <TimeIcon className="h-3 w-3" />
                          {timeOfDay.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#4A5568] mt-3">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-[#00A3FF]" />
                          {format(new Date(event.event_date), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-[#B43B3B]" />
                          {format(new Date(event.event_date), "h:mm a")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-[#FFD966]" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-[#4A5568] line-clamp-2 border-t border-[#00A3FF]/10 pt-2 mt-2">
                          {event.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-[#4A5568] py-12">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#E1E8F0] border border-[#00A3FF]/30 flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-[#4A5568] opacity-50" />
                </div>
                <p>No upcoming events</p>
                {activeTab !== 'all' && (
                  <p className="text-sm mt-2">
                    Try checking{' '}
                    <button 
                      onClick={() => setActiveTab('all')}
                      className="text-[#00A3FF] hover:underline"
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

      {/* Event Details Modal - FIXED: X button no longer overlaps with date */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-[#FCF9F5] border border-[#00A3FF]/30 shadow-xl">
          {/* Header with proper spacing */}
          <div className="flex items-center justify-between p-6 pr-12 relative">
            <DialogTitle className="text-xl font-bold text-[#1A1A2E]">
              Event Details
            </DialogTitle>
            {selectedEvent && (
              <Badge variant="outline" className="absolute right-12 border-[#00A3FF]/30 text-[#4A5568]">
                {format(new Date(selectedEvent.event_date), "MMM d, yyyy")}
              </Badge>
            )}
            {/* The X button is built into DialogContent and now has space due to pr-12 */}
          </div>

          {selectedEvent && selectedEvent.organizations && (
            <>
              {/* Organization Header - Clickable */}
              <div 
                onClick={(e) => handleOrgClick(selectedEvent.org_id, e)}
                className="px-6 py-3 bg-[#00A3FF]/5 border-y border-[#00A3FF]/20 hover:bg-[#00A3FF]/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-[#00A3FF]/30">
                    <AvatarImage src={selectedEvent.organizations.profile_picture || undefined} />
                    <AvatarFallback className="bg-[#00A3FF]/5 text-[#00A3FF]">
                      {getInitials(selectedEvent.organizations.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1A1A2E]">{selectedEvent.organizations.name}</p>
                      <ExternalLink className="h-3 w-3 text-[#4A5568]" />
                    </div>
                    <p className="text-xs text-[#4A5568]">Click to view organization</p>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6 space-y-6">
                {/* Event Name with Time Label */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-[#1A1A2E]">{selectedEvent.name}</h3>
                    {(() => {
                      const hour = new Date(selectedEvent.event_date).getHours();
                      const timeOfDay = getTimeOfDay(hour);
                      const TimeIcon = timeOfDay.icon;
                      return (
                        <Badge className={`flex items-center gap-1 ${timeOfDay.color} bg-white border border-[#00A3FF]/20`}>
                          <TimeIcon className="h-3 w-3" />
                          {timeOfDay.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  {isPastEvent(selectedEvent.event_date) && (
                    <Badge variant="outline" className="border-[#B43B3B]/30 text-[#B43B3B]">Past Event</Badge>
                  )}
                </div>

                {/* Date, Time, Location Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Date</p>
                    <div className="flex items-center gap-2 text-sm text-[#1A1A2E]">
                      <CalendarIcon className="h-4 w-4 text-[#00A3FF]" />
                      <span>{format(new Date(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Time</p>
                    <div className="flex items-center gap-2 text-sm text-[#1A1A2E]">
                      <Clock className="h-4 w-4 text-[#B43B3B]" />
                      <span>{format(new Date(selectedEvent.event_date), "h:mm a")}</span>
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Location</p>
                      <div className="flex items-center gap-2 text-sm text-[#1A1A2E]">
                        <MapPin className="h-4 w-4 text-[#FFD966]" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#4A5568] uppercase tracking-wider">Description</p>
                    <div className="bg-[#00A3FF]/5 rounded-lg p-4 border border-[#00A3FF]/20">
                      <p className="text-sm text-[#1A1A2E] whitespace-pre-wrap leading-relaxed">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Type Badge */}
                <div className="pt-4 border-t border-[#00A3FF]/20 flex justify-center">
                  {getOrgTypeBadge(selectedEvent.organizations.is_shs_org)}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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