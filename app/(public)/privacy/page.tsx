const SECTIONS = [
  {
    title: "1. Information we collect",
    body: "We collect information you provide directly, such as your name, email address, phone number, and university affiliation. We also collect information about your rentals, items listed, and payment transactions.",
  },
  {
    title: "2. How we use your information",
    body: "We use your information to facilitate rentals, process payments, verify your identity, communicate with you, and improve our platform. We do not sell your personal data to third parties.",
  },
  {
    title: "3. Data security",
    body: "We use industry-standard encryption (TLS/SSL) and secure storage to protect your data. Your password is hashed using bcrypt and never stored in plain text.",
  },
  {
    title: "4. Cookies",
    body: "We use essential cookies to keep you logged in and to secure your session. We do not use tracking cookies for advertising purposes.",
  },
];

export default function PrivacyPage() {
  return (
    <div>
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-3xl px-4 py-14 lg:px-6 lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-1.5 text-label-md font-medium text-on-surface-variant">
            Legal
          </span>
          <h1 className="mt-6 text-h1 font-bold tracking-tight text-on-surface">
            Privacy Policy
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

          <section>
            <h2 className="text-h3 font-semibold text-on-surface">
              5. Your rights
            </h2>
            <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
              You may request access to, correction of, or deletion of your
              personal data at any time. Contact us at{" "}
              <a
                href="mailto:privacy@unishare.com"
                className="font-medium text-primary hover:underline"
              >
                privacy@unishare.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
