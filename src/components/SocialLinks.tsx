import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialLinksProps {
  instagram?: string | null;
  facebook?: string | null;
}

export function SocialLinks({ instagram, facebook }: SocialLinksProps) {
  const hasLinks = instagram || facebook;
  
  if (!hasLinks) return null;

  const openLink = (url: string, platform: string) => {
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      window.open(`https://${url}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {instagram && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-all"
                onClick={() => openLink(instagram, 'Instagram')}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Follow on Instagram</p>
            </TooltipContent>
          </Tooltip>
        )}

        {facebook && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                onClick={() => openLink(facebook, 'Facebook')}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Follow on Facebook</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}