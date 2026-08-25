import { Suspense } from "react";
import { HomeBrowser } from "@/src/components/HomeBrowser";
import { ProductGridSkeleton } from "@/src/components/Skeletons";

export default function HomePage() {
  return (
    <Suspense fallback={<ProductGridSkeleton count={8} />}>
      <div className="page-content fade-up">
        <HomeBrowser />
      </div>
    </Suspense>
  );
}
