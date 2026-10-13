import { Suspense } from "react";
import { AcademyLoading } from "@/components/academy-loading";
import { StoreDirectory } from "@/app/(academy)/stores/store-directory";
import { readAcademyStoreDirectory } from "@/lib/academy/store-directory";

async function StoresContent() {
  const directory = await readAcademyStoreDirectory();

  return (
    <StoreDirectory
      stores={directory.status === "ok" ? directory.stores : []}
      viewerRole={directory.viewerRole}
      hasError={directory.status === "error"}
    />
  );
}

export default function StoresPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie sklepów" />}>
      <StoresContent />
    </Suspense>
  );
}
