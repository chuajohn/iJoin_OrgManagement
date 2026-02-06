import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface SignOutButtonProps {
  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional CSS classes */
  className?: string;
  /** Show the logout icon */
  showIcon?: boolean;
  /** Show text label */
  showText?: boolean;
  /** Text to display (default: "Sign Out") */
  text?: string;
  /** Position of the icon relative to text */
  iconPosition?: "left" | "right";
  /** Custom dialog title */
  dialogTitle?: string;
  /** Custom dialog description */
  dialogDescription?: string;
}

export function SignOutButton({
  variant = "ghost",
  size = "icon",
  className = "",
  showIcon = true,
  showText = false,
  text = "Sign Out",
  iconPosition = "left",
  dialogTitle = "Sign Out",
  dialogDescription = "Are you sure you want to sign out?",
}: SignOutButtonProps) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      // Dialog will close automatically due to navigation
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isLoading}
        >
          {showIcon && iconPosition === "left" && (
            <LogOut className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
          )}
          {showText && text}
          {showIcon && iconPosition === "right" && (
            <LogOut className={`h-4 w-4 ${showText ? "ml-2" : ""}`} />
          )}
          {!showText && !showIcon && <LogOut className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignOut}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}