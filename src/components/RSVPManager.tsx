import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface RSVPManagerProps {
  eventId: string;
  eventName: string;
}

interface RSVPMember {
  id: string;
  user_id: string;
  registered_at: string;
  profiles: {
    name: string;
    email: string;
    profile_picture: string | null;
  };
}

export function RSVPManager({ eventId, eventName }: RSVPManagerProps) {
  const [members, setMembers] = useState<RSVPMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<RSVPMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRSVPs();
  }, [eventId]);

  useEffect(() => {
    let filtered = [...members];
    
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.profiles.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const fetchRSVPs = async () => {
    try {
      const { data, error } = await supabase
        .from("rsvp")
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            profile_picture
          )
        `)
        .eq("event_id", eventId)
        .eq("status", "registered")
        .order("registered_at", { ascending: false });

      if (error) throw error;
      
      const transformedData: RSVPMember[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        registered_at: item.registered_at,
        profiles: {
          name: item.profiles.name,
          email: item.profiles.email,
          profile_picture: item.profiles.profile_picture
        }
      }));
      
      setMembers(transformedData);
      setFilteredMembers(transformedData);
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const exportRSVPs = () => {
    const data = filteredMembers.map(m => ({
      'Name': m.profiles.name,
      'Email': m.profiles.email,
      'Registered': format(new Date(m.registered_at), "MMM d, yyyy h:mm a")
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.replace(/[^a-z0-9]/gi, '_')}_registrations_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success("Export complete");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count and export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {filteredMembers.length} registered participant{filteredMembers.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={exportRSVPs} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {filteredMembers.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No registrations found</p>
          {searchQuery && (
            <p className="text-sm mt-2">Try a different search term</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registrant</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profiles.profile_picture || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.profiles.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.profiles.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.profiles.email}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(member.registered_at), "MMM d, yyyy 'at' h:mm a")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}