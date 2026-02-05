export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-9 w-56 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-80 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Endpoint Cards Skeleton */}
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border p-6 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-6 w-40 bg-gray-200 rounded mb-3" />
                  <div className="h-4 w-72 bg-gray-200 rounded mb-3" />
                  <div className="flex gap-4">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="h-9 w-28 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
