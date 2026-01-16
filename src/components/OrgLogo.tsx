import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgLogoProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

const iconSizes = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const OrgLogo = ({ src, alt, size = "md", className }: OrgLogoProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          sizeClasses[size],
          "rounded-xl object-cover",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light",
        className
      )}
    >
      <Users className={cn(iconSizes[size], "text-white")} />
    </div>
  );
};

export default OrgLogo;
