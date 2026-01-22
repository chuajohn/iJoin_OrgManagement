import { CalendarDays, Megaphone, ShieldCheck, Sparkles } from "lucide-react";

const benefits = [
  {
    title: "One place for campus updates",
    description: "Announcements, events, and recruitment—organized.",
    Icon: Megaphone,
  },
  {
    title: "Join with confidence",
    description: "Clear org pages and roles at a glance.",
    Icon: ShieldCheck,
  },
  {
    title: "Plan your week",
    description: "Know what’s happening, when, and where.",
    Icon: CalendarDays,
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
            Everything you need for org life.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Discover clubs, keep up with updates, and stay in the loop.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="grid gap-5 md:grid-cols-3">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
