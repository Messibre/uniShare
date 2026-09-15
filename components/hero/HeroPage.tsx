import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  GraduationCap,
  BadgeDollarSign,
  ShieldCheck,
  Star,
  Camera,
  Calculator,
  Sofa,
  Sparkles,
  Search,
  CalendarCheck,
  Repeat,
  BadgeCheck,
} from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";

const STATS = [
  { value: "2,400+", label: "Items listed" },
  { value: "8,000+", label: "Students" },
  { value: "4.9", label: "Avg. rating" },
];

const CATEGORIES = [
  { icon: Camera, label: "Cameras" },
  { icon: Calculator, label: "Academic" },
  { icon: Sofa, label: "Furniture" },
  { icon: Sparkles, label: "Event gear" },
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Built for students",
    desc: "Access premium gear on demand without the premium price tag. Everything you need for one semester or one weekend.",
  },
  {
    icon: BadgeDollarSign,
    title: "Earn while idle",
    desc: "Turn the equipment gathering dust into steady income. List once and let your campus community do the rest.",
  },
  {
    icon: ShieldCheck,
    title: "Verified & secure",
    desc: "Ethiopian ID verification, protected payments, and transparent reviews keep every exchange trustworthy.",
  },
];

const STEPS = [
  {
    icon: Search,
    title: "Discover",
    desc: "Browse verified listings from students across your campus.",
  },
  {
    icon: CalendarCheck,
    title: "Reserve",
    desc: "Pick your dates and pay securely in a few taps.",
  },
  {
    icon: Repeat,
    title: "Return & repeat",
    desc: "Hand it back, leave a review, and rent again anytime.",
  },
];

export function HeroPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-2 no-underline"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-body-lg font-semibold tracking-tight text-on-surface">
              UniShare
            </span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-2">
            <Link
              href={ROUTES.LOGIN}
              className="whitespace-nowrap rounded-md px-2 py-2 text-body-sm font-medium text-on-surface no-underline transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:px-4"
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="whitespace-nowrap rounded-md bg-primary-container px-3 py-2 text-body-sm font-semibold text-on-primary-container no-underline transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:px-4"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-6 lg:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-1.5 text-label-md font-medium text-on-surface-variant">
              <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Trusted peer-to-peer campus rentals
            </span>

            <h1
              id="hero-heading"
              className="mt-6 text-balance text-[2.75rem] font-bold leading-[1.05] tracking-[-0.02em] text-on-surface sm:text-6xl"
            >
              Rent the gear you need.{" "}
              <span className="text-primary">Own less.</span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-body-lg text-on-surface-variant">
              Cameras, calculators, furniture, and event gear from students you
              trust. Borrow what you need, list what you don&apos;t, and let
              your campus community do the rest.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ROUTES.REGISTER}
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary-container px-7 py-3.5 text-body-md font-semibold text-on-primary-container no-underline shadow-[var(--shadow-level-1)] transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-level-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Get started free
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href={ROUTES.ITEMS}
                className="inline-flex items-center justify-center rounded-md border border-outline px-7 py-3.5 text-body-md font-medium text-on-surface no-underline transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Browse items
              </Link>
            </div>

            {/* Stats */}
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-outline-variant pt-8">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-h3 font-semibold text-on-surface">
                    {stat.value}
                  </dd>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero image */}
          <div className="relative animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="relative overflow-hidden rounded-3xl border border-outline-variant shadow-[var(--shadow-level-2)]">
              <Image
                src="/hero-gear.png"
                alt="Curated campus rental gear including a camera, calculator, headphones and desk lamp arranged on a warm surface"
                width={720}
                height={720}
                priority
                className="h-full w-full object-cover"
              />
            </div>

            {/* Floating verified card */}
            <div className="glass-panel absolute -left-3 top-8 hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-[var(--shadow-level-2)] sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-label-sm font-semibold text-on-surface">
                  ID verified
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  Every renter
                </p>
              </div>
            </div>

            {/* Floating rating card */}
            <div className="glass-panel absolute -right-3 bottom-8 hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-[var(--shadow-level-2)] sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
              <div>
                <p className="text-label-sm font-semibold text-on-surface">
                  4.9 / 5.0
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  1,200+ reviews
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category strip */}
        <div className="mx-auto max-w-6xl px-4 pb-16 lg:px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-body-sm text-on-surface-variant">
              Popular categories:
            </span>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  href={ROUTES.ITEMS}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-body-sm font-medium text-on-surface no-underline transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        aria-labelledby="features-heading"
        className="border-t border-outline-variant bg-surface-container-low py-16 lg:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="features-heading"
              className="text-balance text-h2 font-semibold text-on-surface"
            >
              A smarter way to share campus gear
            </h2>
            <p className="mt-4 text-body-lg text-on-surface-variant">
              Everything is designed around trust, convenience, and keeping
              money in the student community.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[var(--shadow-level-1)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-level-2)] lg:p-8"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/15 text-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-body-lg font-semibold text-on-surface">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-body-md text-on-surface-variant">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="how-heading"
        className="py-16 lg:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="how-heading"
              className="text-balance text-h2 font-semibold text-on-surface"
            >
              Renting made effortless
            </h2>
            <p className="mt-4 text-body-lg text-on-surface-variant">
              Three simple steps from browsing to your doorstep.
            </p>
          </div>

          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 lg:p-8"
                >
                  <span className="text-label-sm font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container text-on-surface">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-body-lg font-semibold text-on-surface">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-body-md text-on-surface-variant">
                    {step.desc}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-heading" className="pb-20 lg:pb-28">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div className="p-8 lg:p-12">
                <h2
                  id="cta-heading"
                  className="text-balance text-h2 font-semibold text-on-surface"
                >
                  Ready to start renting?
                </h2>
                <p className="mt-4 max-w-md text-body-lg text-on-surface-variant">
                  Join thousands of students already sharing gear and earning on
                  UniShare. It&apos;s free to get started.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={ROUTES.REGISTER}
                    className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary-container px-7 py-3.5 text-body-md font-semibold text-on-primary-container no-underline shadow-[var(--shadow-level-1)] transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-level-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    Create your account
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    href={ROUTES.ITEMS}
                    className="inline-flex items-center justify-center rounded-md border border-outline px-7 py-3.5 text-body-md font-medium text-on-surface no-underline transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    Explore listings
                  </Link>
                </div>
              </div>
              <div className="relative h-56 md:h-full md:min-h-[20rem]">
                <Image
                  src="/hero-students.png"
                  alt="Two university students exchanging a camera bag on a sunlit campus courtyard"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant bg-surface-container-low">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-body-sm text-on-surface-variant sm:flex-row lg:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-container text-on-primary-container">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="font-medium text-on-surface">UniShare</span>
          </div>
          <p>© {new Date().getFullYear()} UniShare. Campus gear, shared.</p>
        </div>
      </footer>
    </div>
  );
}
