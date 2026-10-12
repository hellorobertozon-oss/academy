import { StoreDirectory } from "@/app/(academy)/stores/store-directory";
import { readAcademyStoreDirectory } from "@/lib/academy/store-directory";

export default async function StoresPage() {
  const directory = await readAcademyStoreDirectory();

  return (
    <StoreDirectory
      stores={directory.status === "ok" ? directory.stores : []}
      viewerRole={directory.viewerRole}
      hasError={directory.status === "error"}
    />
  );
}
