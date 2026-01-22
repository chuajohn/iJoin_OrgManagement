import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  Calendar,
  Bell,
  Shield,
  Megaphone,
  Sparkles,
  MapPin,
} from "lucide-react";

import FeaturedClubsSection from "@/components/landing/FeaturedClubsSection";
import BenefitsSection from "@/components/landing/BenefitsSection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">iJoin</span>
          </div>
          <Link to="/auth">
            <Button
              variant="outline"
              size="sm"
              className="transition-transform hover:-translate-y-0.5"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* background accents (decorative only) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute -right-24 top-56 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-12">
            {/* Left: existing hero content (same text/routes) */}
            <div className="text-center md:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" />
                iAcademy Student Platform
              </div>

              <h1 className="mb-6 text-5xl font-bold leading-tight text-foreground md:text-6xl">
                Connect with Every
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}
                  Student Organization
                </span>
              </h1>

              <p className="mb-8 text-xl text-muted-foreground">
                One platform for all announcements, events, and recruitment. Stay connected with your campus community.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row md:justify-start">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="group w-full transition-transform hover:-translate-y-0.5 sm:w-auto"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full transition-transform hover:-translate-y-0.5 sm:w-auto"
                  >
                    Explore Organizations
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: decorative preview panel (no logic/interactions) */}
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-2xl" />

              <div className="group rounded-3xl border bg-card/70 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-lg">
                {/* faux app header */}
                <div className="flex items-center justify-between rounded-2xl border bg-background/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm font-semibold text-foreground">Campus Feed</div>
                      <div className="text-xs text-muted-foreground">What’s happening today</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Live
                    </span>
                  </div>
                </div>

                {/* faux feed cards */}
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border bg-background/50 p-4 transition-all group-hover:bg-background/60">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-foreground">
                            Student Council Announcement
                          </div>
                          <div className="text-xs text-muted-foreground">Just now</div>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="h-2 w-11/12 rounded bg-muted" />
                          <div className="h-2 w-4/5 rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background/50 p-4 transition-all group-hover:bg-background/60">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-foreground">
                            Tech Club Workshop
                          </div>
                          <div className="text-xs text-muted-foreground">Tonight</div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            <MapPin className="h-3.5 w-3.5" />
                            Room 204
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-medium text-foreground">
                            Hands-on
                          </span>
                        </div>
                        <div className="mt-3 h-2 w-3/4 rounded bg-muted" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background/50 p-4 transition-all group-hover:bg-background/60">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-foreground">
                            Recruitment Week
                          </div>
                          <div className="text-xs text-muted-foreground">This week</div>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="h-2 w-10/12 rounded bg-muted" />
                          <div className="h-2 w-2/3 rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground md:justify-start">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                Decorative preview (no interactions)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New: Storytelling Sections (visual only) */}
      <FeaturedClubsSection />
      <BenefitsSection />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-12 text-center text-primary-foreground shadow-sm">
          <h2 className="mb-4 text-3xl font-bold">Ready to join your community?</h2>
          <p className="mb-8 text-lg opacity-90">Create your account and get started.</p>
          <Link to="/auth">
            <Button size="lg" variant="secondary">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
