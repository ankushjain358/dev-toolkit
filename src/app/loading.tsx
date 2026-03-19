import { ExternalLayout } from "@/components/layout/external-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <ExternalLayout>
      <div className="container max-w-7xl mx-auto py-16 px-4">
        <div className="lg:flex lg:gap-8">
          <article className="flex-1 lg:max-w-4xl">
            {/* Back Button */}
            <div className="mb-8">
              <Skeleton className="h-9 w-36" />
            </div>

            {/* Title */}
            <header className="mb-12">
              <Skeleton className="h-12 w-3/4 mb-3" />
              <Skeleton className="h-10 w-1/2 mb-6" />

              {/* Author */}
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 mb-8">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>

              {/* Cover Image */}
              <Skeleton className="w-full h-64 md:h-96 rounded-lg mb-8" />
            </header>

            {/* Content */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-4 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </article>

          {/* TOC Sidebar */}
          <aside className="w-72 shrink-0">
            <div className="sticky top-24 hidden lg:block">
              <div className="border rounded-lg p-5 bg-card w-72">
                <Skeleton className="h-4 w-24 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/5 ml-3" />
                  <Skeleton className="h-3 w-3/4 ml-3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6 ml-3" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ExternalLayout>
  );
}
