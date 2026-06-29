export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header skeleton */}
      <div className="page-header">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-7 w-48 rounded" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-28 rounded" />
          ))}
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="tab-bar mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-5 w-24 rounded mx-2" />
        ))}
      </div>

      <div className="page-content flex flex-col gap-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card gap-3">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton h-8 w-36 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))}
        </div>

        {/* Two col */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card p-5 flex flex-col gap-3">
            <div className="skeleton h-5 w-32 rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded" />
            ))}
          </div>
          <div className="card p-5 flex flex-col gap-3">
            <div className="skeleton h-5 w-28 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-10 rounded" />
            ))}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-32 rounded mb-4" />
              <div className="skeleton h-48 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
