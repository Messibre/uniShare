export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
      <h1 className="text-h2 font-h2 text-on-surface">Terms and Conditions</h1>
      <p className="text-body-sm text-on-surface-variant">
        Last updated: August 2026
      </p>

      <div className="space-y-4 text-body-md text-on-surface-variant">
        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            1. Acceptance of Terms
          </h2>
          <p>
            By using UniShare, you agree to these terms. If you do not agree,
            please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            2. User Accounts
          </h2>
          <p>
            You must register an account and verify your identity to use rental
            features. You are responsible for maintaining the security of your
            account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            3. Rentals and Payments
          </h2>
          <p>
            All rentals are binding agreements between the renter and the owner.
            Payments are processed securely through Chapa. Deposits are
            refundable upon successful return of the item.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            4. Prohibited Items
          </h2>
          <p>
            Illegal items, weapons, hazardous materials, and any items that
            violate university policies are strictly prohibited. We reserve the
            right to remove any listing without notice.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">5. Liability</h2>
          <p>
            UniShare is a platform that connects renters and owners. We are not
            responsible for the condition, safety, or legality of items listed.
            All disputes between users must be resolved directly.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            6. Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms or behave fraudulently.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-h3 text-on-surface mb-2">
            7. Governing Law
          </h2>
          <p>
            These terms are governed by the laws of the Federal Democratic
            Republic of Ethiopia.
          </p>
        </section>
      </div>
    </div>
  );
}
