export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome to your UniShare dashboard!</p>
      <p className="mt-2 text-sm text-muted-foreground">
        (This page is protected – if you see this, your authentication works.)
      </p>
    </div>
  );
}
