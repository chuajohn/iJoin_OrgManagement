import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, Bell, Shield } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">iJoin</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link to="/auth">
              <Button size="lg" className="group w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore Organizations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Discover Organizations"
            description="Browse and join student organizations that match your interests and goals."
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8" />}
            title="Stay Updated"
            description="Never miss important announcements and upcoming events from your organizations."
          />
          <FeatureCard
            icon={<Bell className="h-8 w-8" />}
            title="Get Notifications"
            description="Receive real-time updates about activities that matter to you."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light p-12 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">Ready to join your community?</h2>
          <p className="mb-8 text-lg opacity-90">
            Create your account and start connecting with student organizations today.
          </p>
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export default Landing;
