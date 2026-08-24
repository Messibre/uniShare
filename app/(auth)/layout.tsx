export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-md py-xl">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-h1 text-primary font-bold">UniShare</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Campus gear rental made simple.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
