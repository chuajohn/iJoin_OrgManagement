import { Badge } from "@/components/ui/badge";
import { CalendarDays, ClipboardCheck, Megaphone, ShieldCheck, Sparkles, Users } from "lucide-react";

const benefits = [
  {
    title: "One place for campus updates",
    description: "Announcements, events, and recruitment—organized and easy to follow.",
    Icon: Megaphone,
  },
  {
    title: "Join with confidence",
    description: "Clear org profiles and roles help you know what you’re signing up for.",
    Icon: ShieldCheck,
  },
  {
    title: "Plan your week",
    description: "See what’s next and keep your org commitments in sync.",
    Icon: CalendarDays,
  },
  {
    title: "From curious to member",
    description: "A simple flow makes it easy to request membership and get approved.",
    Icon: ClipboardCheck,
  },
];

export default function BenefitsSection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Why students use iJoin
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Built for busy students.
            <span className="text-primary"> Designed for campus life.</span>
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Discover organizations, stay informed, and manage membership—without juggling multiple group chats.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground">
              Students first
            </Badge>
            <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground">
              Clear updates
            </Badge>
            <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground">
              Better organization
            </Badge>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="grid gap-5 md:grid-cols-2">
            {benefits.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="group rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Student-friendly workflow</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
