import { Card, Skeleton } from "@acme/ui-solid";
import { Row } from "./shared.tsx";

export function SkeletonSection() {
  return (
    <>
      <Row label="shape">
        <div class="flex w-48 flex-col gap-2">
          <Skeleton />
          <Skeleton width="60%" />
        </div>
        <Skeleton shape="rect" width={96} height={64} />
        <Skeleton shape="circle" width={40} />
      </Row>
      {/* The screen says that it is loading, once, since the placeholders say nothing. */}
      <Card class="max-w-sm" flush>
        <div role="status" aria-label="Loading the report" class="flex flex-col">
          <Skeleton shape="rect" height={128} />
          <div class="flex items-center gap-3 p-4">
            <Skeleton shape="circle" width={40} />
            <div class="flex flex-1 flex-col gap-2">
              <Skeleton width="70%" />
              <Skeleton width="40%" />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
