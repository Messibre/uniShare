import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

export function HeroPage() {
  return (
    <div className="min-h-screen bg-surface">
      <section className="container max-w-[50rem] mx-auto px-4 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <h1 className="text-h1 font-h1 text-on-surface">
              Campus gear rental.{" "}
              <span className="text-primary">Made simple.</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-[50rem] mx-auto lg:mx-0">
              Rent calculators, cameras, furniture, and more from your fellow
              students. List your own gear and earn money when you're not using
              it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href={ROUTES.LOGIN}
                className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white px-8 py-3 rounded-md text-body-md font-medium transition-colors text-center"
              >
                Get Started
              </Link>
              <Link
                href={ROUTES.ITEMS}
                className="border border-outline text-on-surface hover:bg-surface-container px-8 py-3 rounded-md text-body-md font-medium transition-colors text-center"
              >
                Browse Items
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-[28rem] aspect-square bg-primary-container/10 rounded-2xl flex items-center justify-center text-on-surface-variant border border-outline-variant">
              <span className="text-6xl">📚</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface-container-low py-16 lg:py-24 border-t border-outline-variant">
        <div className="container max-w-[28rem] mx-auto px-4">
          <h2 className="text-h2 font-h2 text-on-surface text-center mb-12">
            Why UniShare?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎓",
                title: "For Students",
                desc: "Access expensive gear without breaking the bank.",
              },
              {
                icon: "💰",
                title: "Earn Extra",
                desc: "List idle items and earn money when others need them.",
              },
              {
                icon: "🛡️",
                title: "Trust & Safety",
                desc: "Ethiopian ID verification and secure payments.",
              },
            ].map((f) => (
              <div key={f.title} className="text-center space-y-3">
                <div className="text-4xl">{f.icon}</div>
                <h3 className="text-h3 font-h3 text-on-surface">{f.title}</h3>
                <p className="text-body-md text-on-surface-variant">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container max-w-[40rem] mx-auto px-4 text-center">
          <h2 className="text-h2 font-h2 text-on-surface mb-4">
            Ready to start renting?
          </h2>
          <p className="text-body-lg text-on-surface-variant mb-8 max-w-[40rem] mx-auto">
            Join the campus community today.
          </p>
          <Link
            href={ROUTES.REGISTER}
            className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white px-8 py-3 rounded-md text-body-md font-medium transition-colors inline-block"
          >
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
}
