import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  MapPin,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { ROUTES, type ItemCategory } from "@/lib/utils/constants";

const YEAR = new Date().getFullYear();

const FEATURED_CATEGORIES = [
  "Electronics",
  "Academic",
  "Furniture",
  "Event Gear",
  "Sports",
] as const satisfies readonly ItemCategory[];

const TRUST = [
  {
    icon: ShieldCheck,
    title: "ID checked",
    detail: "Ethiopian ID verification before a rental starts.",
  },
  {
    icon: BadgeDollarSign,
    title: "Pay on UniShare",
    detail: "Protected payments, not a transfer in a side chat.",
  },
  {
    icon: Star,
    title: "Review the return",
    detail: "Both students can leave a review after hand-back.",
  },
];

const JOURNEY = [
  {
    icon: Search,
    title: "Find a listing",
    detail: "Filter by category and open a listing. No account needed.",
  },
  {
    icon: CalendarCheck,
    title: "Reserve the dates",
    detail: "Create an account, pick the days, and pay on UniShare.",
  },
  {
    icon: MapPin,
    title: "Meet on campus",
    detail: "Hand the item over with a student whose ID is checked.",
  },
  {
    icon: Repeat,
    title: "Return and review",
    detail: "Bring it back, leave a review, and the listing opens again.",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const motion =
  "transition-[color,background-color,border-color,box-shadow,transform] duration-200 motion-reduce:transition-none motion-safe:active:scale-[0.98]";

const primaryLink = `inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary-container px-5 text-body-md font-semibold text-on-primary-container no-underline shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] hover:brightness-[0.97] ${motion} ${focusRing}`;

const secondaryLink = `inline-flex min-h-11 items-center justify-center rounded-md border border-outline bg-surface px-5 text-body-md font-medium text-on-surface no-underline hover:border-primary hover:bg-surface-container ${motion} ${focusRing}`;

function categoryHref(category: ItemCategory) {
  return `${ROUTES.ITEMS}?category=${encodeURIComponent(category)}`;
}

export function HeroPage() {
  return (
    <div className="flex min-h-dvh touch-manipulation flex-col bg-surface text-on-surface">
      <a
        href="#main"
        className={`fixed left-4 top-0 z-[60] inline-flex min-h-11 -translate-y-full items-center rounded-md bg-primary-container px-4 text-body-sm font-semibold text-on-primary-container focus:top-4 focus:translate-y-0 focus-visible:top-4 focus-visible:translate-y-0 ${focusRing}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
          <Link
            href={ROUTES.HOME}
            aria-label="UniShare home"
            className={`inline-flex min-h-11 items-center gap-2 rounded-md no-underline ${focusRing}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span
              translate="no"
              className="text-body-lg font-semibold tracking-tight text-on-surface"
            >
              UniShare
            </span>
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
            <Link
              href={ROUTES.ITEMS}
              className={`inline-flex min-h-11 items-center rounded-md px-3 text-body-sm font-medium text-on-surface no-underline hover:bg-surface-container ${motion} ${focusRing}`}
            >
              Browse
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className={`inline-flex min-h-11 items-center rounded-md px-3 text-body-sm font-medium text-on-surface no-underline hover:bg-surface-container ${motion} ${focusRing}`}
            >
              Sign in
            </Link>
            <Link href={ROUTES.REGISTER} className={primaryLink}>
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 scroll-mt-24">
        <section aria-labelledby="hero-heading" className="scroll-mt-24">
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-6 lg:py-16">
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
              <p className="text-body-sm font-medium text-on-surface-variant">
                Campus rentals, student to student
              </p>
              <h1
                id="hero-heading"
                className="mt-4 max-w-xl text-balance text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-on-surface lg:text-6xl"
              >
                Rent the gear.{" "}
                <span className="text-primary">Skip the purchase.</span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-body-lg leading-relaxed text-on-surface-variant">
                Cameras, calculators, furniture, and event kit from students on
                your campus. Look around without an account. Create one when
                you reserve or list.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={ROUTES.ITEMS} className={`group ${primaryLink}`}>
                  Browse gear
                  <ArrowRight
                    className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
                <Link href={ROUTES.REGISTER} className={secondaryLink}>
                  List an item
                </Link>
              </div>
              <ul className="mt-10 grid gap-4 border-t border-outline-variant pt-8">
                {TRUST.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/15 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-on-surface">
                          {item.title}
                        </p>
                        <p className="mt-1 text-pretty text-body-sm leading-relaxed text-on-surface-variant">
                          {item.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <figure className="relative mx-auto w-full max-w-md pb-16 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 lg:mx-0 lg:max-w-none lg:justify-self-end">
              <div className="overflow-hidden rounded-3xl border border-outline-variant shadow-[var(--shadow-level-1)]">
                <Image
                  src="/hero-gear.png"
                  alt="A camera, calculator, notebook, headphones, desk lamp, and projector arranged on a desk"
                  width={720}
                  height={720}
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="aspect-[4/5] h-auto w-full object-cover sm:aspect-[5/4]"
                />
              </div>
              <Link
                href={categoryHref("Electronics")}
                className={`absolute inset-x-4 bottom-0 block rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 no-underline shadow-[var(--shadow-level-2)] hover:border-primary sm:inset-x-auto sm:left-6 sm:w-72 ${motion} ${focusRing}`}
              >
                <p className="text-label-sm text-on-surface-variant">
                  Example, not a live listing
                </p>
                <p className="mt-1 text-body-lg font-semibold text-on-surface">
                  Mirrorless camera
                </p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Electronics. Handoff on campus.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-body-sm font-semibold text-primary">
                  Browse electronics
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </figure>
          </div>

          <nav
            aria-label="Categories"
            className="mx-auto mt-4 max-w-6xl px-4 pb-14 lg:px-6"
          >
            <p id="category-label" className="text-body-sm text-on-surface-variant">
              Start with a category
            </p>
            <ul
              aria-labelledby="category-label"
              className="mt-3 flex flex-wrap gap-2"
            >
              {FEATURED_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    href={categoryHref(category)}
                    className={`inline-flex min-h-11 items-center rounded-full border border-outline-variant bg-surface-container-low px-4 text-body-sm font-medium text-on-surface no-underline hover:border-primary hover:text-primary ${motion} ${focusRing}`}
                  >
                    {category}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={ROUTES.ITEMS}
                  className={`inline-flex min-h-11 items-center rounded-full px-4 text-body-sm font-semibold text-primary no-underline hover:bg-surface-container ${motion} ${focusRing}`}
                >
                  All categories
                </Link>
              </li>
            </ul>
          </nav>
        </section>

        <section
          aria-labelledby="journey-heading"
          className="scroll-mt-24 border-t border-outline-variant bg-surface-container-low py-16 lg:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <div className="max-w-2xl">
              <h2
                id="journey-heading"
                className="text-balance text-h2 font-semibold text-on-surface"
              >
                How a rental actually goes
              </h2>
              <p className="mt-3 max-w-[65ch] text-pretty text-body-lg leading-relaxed text-on-surface-variant">
                Four steps, in order. You can stop after browsing. An account
                is only required when you reserve or publish.
              </p>
            </div>
            <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-outline-variant bg-outline-variant sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY.map((step) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="bg-surface-container-lowest p-6"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-body-lg font-semibold text-on-surface">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-pretty text-body-sm leading-relaxed text-on-surface-variant">
                      {step.detail}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="paths-heading"
          className="scroll-mt-24 py-16 lg:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <h2 id="paths-heading" className="sr-only">
              Choose how you want to use UniShare
            </h2>
            <div className="grid gap-6 lg:grid-cols-5">
              <article className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 lg:col-span-3 lg:p-10">
                <p className="text-body-sm font-medium text-primary">
                  Need it this week
                </p>
                <h3 className="mt-3 text-balance text-h2 font-semibold text-on-surface">
                  Borrow what is already on campus
                </h3>
                <p className="mt-4 max-w-[65ch] text-pretty text-body-lg leading-relaxed text-on-surface-variant">
                  Look through live listings before you create an account.
                  Reserve only when the dates and the price work.
                </p>
                <ul className="mt-6 grid gap-2 text-body-md text-on-surface sm:grid-cols-2">
                  <li>Cameras and other electronics</li>
                  <li>Calculators and academic kit</li>
                  <li>Furniture for a semester</li>
                  <li>Event gear for a weekend</li>
                </ul>
                <Link href={ROUTES.ITEMS} className={`group mt-8 ${primaryLink}`}>
                  Browse gear
                  <ArrowRight
                    className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              </article>

              <article className="flex flex-col rounded-3xl bg-surface-container p-8 lg:col-span-2 lg:p-10">
                <p className="text-body-sm font-medium text-on-surface-variant">
                  Have it sitting idle
                </p>
                <h3 className="mt-3 text-balance text-h3 font-semibold text-on-surface">
                  List what you are not using
                </h3>
                <p className="mt-4 text-pretty text-body-md leading-relaxed text-on-surface-variant">
                  A camera, a calculator, a chair. Publish it once. An account
                  is required before a listing goes live.
                </p>
                <div className="mt-8 flex flex-col items-start gap-3">
                  <Link href={ROUTES.REGISTER} className={primaryLink}>
                    Create an account
                  </Link>
                  <Link
                    href={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.CREATE_ITEM)}`}
                    className={`inline-flex min-h-11 items-center text-body-sm font-semibold text-primary no-underline hover:underline ${focusRing}`}
                  >
                    Already registered? Sign in to list
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="close-heading"
          className="scroll-mt-24 pb-16 lg:pb-24"
        >
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <div className="grid overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest md:grid-cols-2">
              <div className="p-8 lg:p-12">
                <h2
                  id="close-heading"
                  className="text-balance text-h2 font-semibold text-on-surface"
                >
                  See what is listed before you decide
                </h2>
                <p className="mt-4 max-w-[65ch] text-pretty text-body-lg leading-relaxed text-on-surface-variant">
                  Browse is open. An account is only required when you reserve
                  a listing or publish your own.
                </p>
                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Link href={ROUTES.ITEMS} className={`group ${primaryLink}`}>
                    Browse gear
                    <ArrowRight
                      className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    href={ROUTES.REGISTER}
                    className={`inline-flex min-h-11 items-center text-body-md font-semibold text-primary no-underline hover:underline ${focusRing}`}
                  >
                    Create an account
                  </Link>
                </div>
              </div>
              <div className="relative min-h-56 md:min-h-full">
                <Image
                  src="/hero-students.png"
                  alt="Two university students exchanging a camera bag on a sunlit campus courtyard"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-low">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-body-sm text-on-surface-variant sm:flex-row sm:items-center lg:px-6">
          <p>
            <span translate="no" className="font-medium text-on-surface">
              UniShare
            </span>
            {" · "}© {YEAR}. Campus gear, shared.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/about"
              className={`inline-flex min-h-11 items-center text-on-surface-variant no-underline hover:text-primary ${focusRing}`}
            >
              About
            </Link>
            <Link
              href="/privacy"
              className={`inline-flex min-h-11 items-center text-on-surface-variant no-underline hover:text-primary ${focusRing}`}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className={`inline-flex min-h-11 items-center text-on-surface-variant no-underline hover:text-primary ${focusRing}`}
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
