export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-h2 font-h2 text-on-surface">About UniShare</h1>

      <div className="space-y-4 text-body-md text-on-surface-variant">
        <p>
          UniShare is a peer-to-peer rental platform built for university
          students. We connect students who need academic and everyday gear with
          students who have items sitting idle.
        </p>
        <p>
          Whether you need a graphing calculator for an exam, a camera for a
          project, or furniture for your dorm, UniShare makes it easy to rent
          what you need, when you need it — at a fraction of the cost of buying
          new.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant">
          <div className="text-3xl mb-3">🎓</div>
          <h3 className="text-h3 font-h3 text-on-surface">For Students</h3>
          <p className="text-body-sm text-on-surface-variant mt-2">
            Access expensive gear without breaking the bank. Rent by the day or
            week.
          </p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant">
          <div className="text-3xl mb-3">💰</div>
          <h3 className="text-h3 font-h3 text-on-surface">Earn Extra</h3>
          <p className="text-body-sm text-on-surface-variant mt-2">
            List your idle items and earn money when other students need them.
          </p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant">
          <div className="text-3xl mb-3">🛡️</div>
          <h3 className="text-h3 font-h3 text-on-surface">Trust & Safety</h3>
          <p className="text-body-sm text-on-surface-variant mt-2">
            Ethiopian ID verification and secure payments through Chapa.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-outline-variant">
        <p className="text-body-sm text-on-surface-variant">
          Questions or feedback? Contact us at{" "}
          <a
            href="mailto:support@unishare.com"
            className="text-primary hover:underline"
          >
            support@unishare.com
          </a>
        </p>
      </div>
    </div>
  );
}
