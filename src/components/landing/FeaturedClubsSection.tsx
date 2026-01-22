import { Badge } from "@/components/ui/badge";
import { Award, Rocket, Palette, Volleyball } from "lucide-react";

const featured = [
  {
    name: "Tech Society",
    blurb: "Build projects, prep for hackathons, meet mentors.",
    Icon: Rocket,
    tags: ["Workshops", "Projects"],
  },
  {
    name: "Arts & Design",
    blurb: "Create, collaborate, and showcase your work.",
    Icon: Palette,
    tags: ["Exhibits", "Portfolio"],
  },
  {
    name: "Campus Athletics",
    blurb: "Tryouts, intramurals, and weekend matches.",
    Icon: Volleyball,
    tags: ["Teams", "Fitness"],
  },
];

export default function FeaturedClubsSection() {
  return (
    <section className="relative overflow-hidden border-y bg-background/40">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-10 bottom-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Award className="h-4 w-4" />
              Featured clubs
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Find your people. Join what excites you.
            </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featured.map(({ name, blurb, Icon, tags }) => (
            <div
              key={name}
              className="group relative overflow-hidden rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />

              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex gap-2">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="bg-secondary/70 text-secondary-foreground"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-foreground">{name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{blurb}</p>

              <div className="mt-5 h-2 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-2 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
