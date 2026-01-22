import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Lock, Search, UserPlus } from "lucide-react";

const steps = [
  {
    title: "Create your account",
    description: "Sign up in seconds and personalize your profile.",
    Icon: UserPlus,
  },
  {
    title: "Explore clubs",
    description: "Browse organizations and see what’s active this week.",
    Icon: Search,
  },
  {
    title: "Request to join",
    description: "Send a quick request and get updates in your feed.",
    Icon: CheckCircle2,
  },
];

export default function QuickSignupSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Lock className="h-4 w-4" />
              Quick start (visual)
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Join campus life in 3 easy steps
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              iJoin helps you discover organizations, follow updates, and manage membership—all in one place.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth">
                <Button className="group w-full transition-transform hover:-translate-y-0.5 sm:w-auto" size="lg">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  Explore Organizations
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground">
                Announcements
              </Badge>
              <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground">
                Events
              </Badge>
              <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground">
                Recruitment
              </Badge>
            </div>
          </div>

          {/* Decorative stepper panel */}
          <div className="lg:col-span-6">
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-2xl" />
              <div className="rounded-3xl border bg-card/70 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Quick sign-up flow</div>
                    <div className="text-xs text-muted-foreground">Decorative preview (no interactions)</div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Simple
                  </span>
                </div>

                <div className="mt-5 grid gap-4">
                  {steps.map(({ title, description, Icon }, idx) => (
                    <div
                      key={title}
                      className="group rounded-2xl border bg-background/50 p-4 transition-all hover:bg-background/60"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className="truncate text-sm font-semibold text-foreground">{title}</div>
                            <div className="text-xs text-muted-foreground">Step {idx + 1}</div>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                          <div className="mt-3 h-2 w-4/5 rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
