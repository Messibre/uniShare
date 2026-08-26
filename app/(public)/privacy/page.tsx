export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
      <h1 className="text-h2 font-h2 text-on-surface">Privacy Policy</h1>
      <p className="text-body-sm text-on-surface-variant">
        Last updated: August 2026
      </p>

      <div className="space-y-4 text-body-md text-on-surface-variant">
        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly, such as your name,
            email address, phone number, and university affiliation. We also
            collect information about your rentals, items listed, and payment
            transactions.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            2. How We Use Your Information
          </h2>
          <p>
            We use your information to facilitate rentals, process payments,
            verify your identity, communicate with you, and improve our
            platform. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            3. Data Security
          </h2>
          <p>
            We use industry-standard encryption (TLS/SSL) and secure storage to
            protect your data. Your password is hashed using bcrypt and never
            stored in plain text.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">4. Cookies</h2>
          <p>
            We use essential cookies to keep you logged in and to secure your
            session. We do not use tracking cookies for advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            5. Your Rights
          </h2>
          <p>
            You may request access to, correction of, or deletion of your
            personal data at any time. Contact us at{" "}
            <a
              href="mailto:privacy@unishare.com"
              className="text-primary hover:underline"
            >
              privacy@unishare.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
