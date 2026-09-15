const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: "By using UniShare, you agree to these terms. If you do not agree, please do not use the platform.",
  },
  {
    title: "2. User accounts",
    body: "You must register an account and verify your identity to use rental features. You are responsible for maintaining the security of your account credentials.",
  },
  {
    title: "3. Rentals and payments",
    body: "All rentals are binding agreements between the renter and the owner. Payments are processed securely through Chapa. Deposits are refundable upon successful return of the item.",
  },
  {
    title: "4. Prohibited items",
    body: "Illegal items, weapons, hazardous materials, and any items that violate university policies are strictly prohibited. We reserve the right to remove any listing without notice.",
  },
  {
    title: "5. Liability",
    body: "UniShare is a platform that connects renters and owners. We are not responsible for the condition, safety, or legality of items listed. All disputes between users must be resolved directly.",
  },
  {
    title: "6. Termination",
    body: "We reserve the right to suspend or terminate accounts that violate these terms or behave fraudulently.",
  },
  {
    title: "7. Governing law",
    body: "These terms are governed by the laws of the Federal Democratic Republic of Ethiopia.",
  },
];

export default function TermsPage() {
  return (
    <div>
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-3xl px-4 py-14 lg:px-6 lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-1.5 text-label-md font-medium text-on-surface-variant">
            Legal
          </span>
          <h1 className="mt-6 text-h1 font-bold tracking-tight text-on-surface">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-body-sm text-on-surface-variant">
            Last updated: August 2026
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-14 lg:px-6">
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-h3 font-semibold text-on-surface">
                {section.title}
              </h2>
              <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
