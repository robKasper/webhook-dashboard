export default function EndpointDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-4 py-8">
        {/* Webhook URL Card Skeleton */}
        <div className="bg-white rounded-lg border p-6 mb-8 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
          <div className="flex items-center gap-2">
            <div className="flex-1 h-12 bg-gray-200 rounded" />
            <div className="h-10 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-80 bg-gray-200 rounded mt-3" />
        </div>

        {/* Events Table Skeleton */}
        <div className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-40 bg-gray-200 rounded" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
          </div>

          {/* Table Header */}
          <div className="border-b pb-3 mb-3">
            <div className="grid grid-cols-5 gap-4">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-6 w-14 bg-gray-200 rounded" />
              <div className="h-6 w-12 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
