import Link from "next/link";
import {
  GraduationCap,
  BadgeDollarSign,
  ShieldCheck,
  ArrowRight,
  Mail,
} from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";

const VALUES = [
  {
    icon: GraduationCap,
    title: "For students",
    desc: "Access expensive gear without breaking the bank. Rent by the day or the week, exactly when you need it.",
  },
  {
    icon: BadgeDollarSign,
    title: "Earn extra",
    desc: "List the items sitting idle in your dorm and earn money whenever another student needs them.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & safety",
    desc: "Ethiopian ID verification and secure payments through Chapa keep every exchange protected.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Header band */}
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-4xl px-4 py-16 lg:px-6 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-1.5 text-label-md font-medium text-on-surface-variant">
            Our story
          </span>
          <h1 className="mt-6 text-balance text-h1 font-bold tracking-tight text-on-surface">
            Campus gear, shared the smart way
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-body-lg text-on-surface-variant">
            UniShare is a peer-to-peer rental platform built for university
            students. We connect students who need academic and everyday gear
            with students who have items sitting idle.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-16 px-4 py-16 lg:px-6">
        <p className="max-w-2xl text-pretty text-body-lg text-on-surface-variant">
          Whether you need a graphing calculator for an exam, a camera for a
          project, or furniture for your dorm, UniShare makes it easy to rent
          what you need, when you need it &mdash; at a fraction of the cost of
          buying new.
        </p>

        {/* Values */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="group rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[var(--shadow-level-1)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-level-2)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/15 text-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-body-lg font-semibold text-on-surface">
                  {value.title}
                </h3>
                <p className="mt-2 text-body-md text-on-surface-variant">
                  {value.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 lg:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-h3 font-semibold text-on-surface">
                Ready to join your campus community?
              </h2>
              <p className="mt-2 text-body-md text-on-surface-variant">
                Questions or feedback? Reach us at{" "}
                <a
                  href="mailto:support@unishare.com"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  support@unishare.com
                </a>
              </p>
            </div>
            <Link
              href={ROUTES.REGISTER}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary-container px-7 py-3.5 text-body-md font-semibold text-on-primary-container no-underline shadow-[var(--shadow-level-1)] transition-all hover:scale-[1.02] hover:no-underline hover:shadow-[var(--shadow-level-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Get started free
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
