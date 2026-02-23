import { format } from "date-fns";
import { 
  Bell, 
  CheckCircle, 
  Megaphone, 
  Calendar, 
  Building2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: 'membership_accepted' | 'new_announcement' | 'new_event' | 'org_approved';
  title: string;
  message: string;
  data: {
    org_id?: string;
    announcement_id?: string;
    event_id?: string;
    membership_id?: string;
  };
  read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'membership_accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'new_announcement':
        return <Megaphone className="h-5 w-5 text-blue-500" />;
      case 'new_event':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'org_approved':
        return <Building2 className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleClick = () => {
    onMarkAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'membership_accepted':
      case 'new_announcement':
      case 'new_event':
        if (notification.data.org_id) {
          navigate(`/org/${notification.data.org_id}`);
        }
        break;
      case 'org_approved':
        if (notification.data.org_id) {
          navigate(`/org/${notification.data.org_id}`);
        }
        break;
    }
  };

  return (
    <div 
      className={cn(
        "relative p-4 border rounded-lg mb-2 cursor-pointer transition-colors",
        notification.read ? "bg-background hover:bg-muted/50" : "bg-muted/20 hover:bg-muted/30"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{notification.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(notification.created_at), "MMM d, h:mm a")}
          </p>
        </div>
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
}