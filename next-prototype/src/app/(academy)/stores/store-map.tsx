"use client";

import dynamic from "next/dynamic";
import { useAcademy } from "@/components/academy-provider";
import type { StoreDirectoryEntry } from "@/lib/academy/store-directory";

function MapLoading() {
  const { t } = useAcademy();
  return (
    <div role="status" className="flex h-[420px] items-center justify-center rounded-2xl bg-background-secondary-default text-body-regular text-text-secondary sm:h-[520px]">
      {t("mapLoading")}
    </div>
  );
}

const StoreMapCanvas = dynamic(() => import("@/app/(academy)/stores/store-map-canvas"), {
  ssr: false,
  loading: () => <MapLoading />,
});

export function StoreMap({ stores }: { stores: StoreDirectoryEntry[] }) {
  const mappableStores = stores.filter((store) => store.latitude !== null && store.longitude !== null);

  return (
    <div className="overflow-hidden rounded-2xl border border-border-button-default">
      <StoreMapCanvas stores={mappableStores} />
    </div>
  );
}
