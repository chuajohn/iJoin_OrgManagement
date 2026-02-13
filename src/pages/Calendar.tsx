import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, School, GraduationCap, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";

type Event = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  organizations: {
    name: string;
    is_shs_org: boolean; // Add this field
  } | null;
};

type TabFilter = 'all' | 'shs' | 'college';

export default function Calendar() {
  const { user } = useAuth();
  const { isSHSStudent, isUGStudent, isAdmin, isSAO } = useUserRole();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

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
    // Filter events based on active tab
    let filtered = [...events];

    if (activeTab === 'shs') {
      filtered = filtered.filter(event => event.organizations?.is_shs_org === true);
    } else if (activeTab === 'college') {
      filtered = filtered.filter(event => event.organizations?.is_shs_org === false);
    }
    // 'all' shows everything

    setFilteredEvents(filtered);
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
          organizations (
            name,
            is_shs_org
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

  const getOrgTypeBadge = (is_shs_org: boolean) => {
    if (is_shs_org) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
          <School className="h-3 w-3" />
          SHS
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1">
          <GraduationCap className="h-3 w-3" />
          College
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Events Calendar</h1>
          </div>
          
          {/* User Role Badge */}
          {user && (
            <div className="flex items-center gap-2">
              {isSHSStudent && (
                <Badge variant="secondary" className="gap-1">
                  <School className="h-3 w-3" />
                  SHS Student
                </Badge>
              )}
              {isUGStudent && (
                <Badge variant="outline" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  Undergraduate
                </Badge>
              )}
              {(isAdmin || isSAO) && (
                <Badge variant={isAdmin ? "destructive" : "default"}>
                  {isAdmin ? "Admin" : "SAO"}
                </Badge>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filter Tabs - Everyone can use these */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabFilter)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="all" className="gap-2">
                <Users className="h-4 w-4" />
                All Events
              </TabsTrigger>
              <TabsTrigger value="shs" className="gap-2">
                <School className="h-4 w-4" />
                SHS Events
              </TabsTrigger>
              <TabsTrigger value="college" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                College Events
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Context hint */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            {activeTab === 'shs' && "Showing Senior High School events"}
            {activeTab === 'college' && "Showing College/Undergraduate events"}
            {activeTab === 'all' && "Showing all events from all organizations"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
                  {activeTab !== 'all' && (
                    <Badge variant="outline" className="ml-2">
                      {activeTab === 'shs' ? 'SHS' : 'College'} View
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <CardDescription>
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                {activeTab !== 'all' && ` in ${activeTab === 'shs' ? 'SHS' : 'College'} view`}
              </CardDescription>
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
                        aspect-square p-2 rounded-lg border text-sm relative
                        ${!isCurrentMonth ? "text-muted-foreground bg-muted/20" : ""}
                        ${isToday ? "border-primary" : ""}
                        ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"}
                        ${dayEvents.length > 0 ? "font-semibold" : ""}
                      `}
                    >
                      <div>{format(day, "d")}</div>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {Array.from({ length: Math.min(dayEvents.length, 3) }).map((_, i) => (
                            <div
                              key={i}
                              className={`
                                h-1.5 w-1.5 rounded-full
                                ${dayEvents[i]?.organizations?.is_shs_org 
                                  ? 'bg-blue-500' 
                                  : 'bg-green-500'
                                }
                              `}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] ml-0.5">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select a date"}
              </CardTitle>
              <CardDescription>
                {selectedDateEvents.length > 0
                  ? `${selectedDateEvents.length} event${selectedDateEvents.length > 1 ? "s" : ""}`
                  : "No events"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold">{event.name}</h4>
                        {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {event.organizations?.name}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm border-t pt-2 mt-1">{event.description}</p>
                      )}
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.event_date), "h:mm a")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-12">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
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

        {/* Upcoming Events List */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  {activeTab === 'all' && "All approved public events from organizations"}
                  {activeTab === 'shs' && "SHS organization events"}
                  {activeTab === 'college' && "College organization events"}
                </CardDescription>
              </div>
              {activeTab !== 'all' && (
                <Badge variant="outline" className="gap-1">
                  {activeTab === 'shs' ? <School className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                  {activeTab === 'shs' ? 'SHS' : 'College'} Events
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredEvents.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{event.name}</h4>
                          {getOrgTypeBadge(event.organizations?.is_shs_org || false)}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.organizations?.name}</p>
                        {event.description && (
                          <p className="text-sm mt-2">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {format(new Date(event.event_date), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(event.event_date), "h:mm a")}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
    </div>
  );
}