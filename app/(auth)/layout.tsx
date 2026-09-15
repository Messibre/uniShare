import Link from "next/link";
import Image from "next/image";
import { Sparkles, ShieldCheck, Star, Quote } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-surface text-on-surface lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/hero-students.png"
          alt="Two university students exchanging camera gear on a sunlit campus courtyard"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#630900]/85 via-[#630900]/45 to-[#630900]/25" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
          <Link
            href={ROUTES.HOME}
            className="inline-flex w-fit items-center gap-2 no-underline hover:no-underline"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-body-lg font-semibold tracking-tight text-white">
              UniShare
            </span>
          </Link>

          <div className="max-w-md">
            <Quote
              className="h-8 w-8 text-white/70"
              aria-hidden="true"
            />
            <p className="mt-4 text-balance text-h3 font-semibold leading-snug text-white">
              UniShare turned the gear gathering dust in my dorm into real
              income &mdash; and got me a camera for finals week.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-body-md font-semibold text-white backdrop-blur-sm">
                LM
              </span>
              <div>
                <p className="text-body-sm font-semibold text-white">
                  Liya Mekonnen
                </p>
                <p className="text-label-sm text-white/70">
                  Addis Ababa University
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-label-sm font-medium text-white backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                ID verified
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-label-sm font-medium text-white backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                4.9 average rating
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-[26rem]">
          <Link
            href={ROUTES.HOME}
            className="mb-8 flex items-center justify-center gap-2 no-underline hover:no-underline lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-h3 font-semibold tracking-tight text-on-surface">
              UniShare
            </span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
