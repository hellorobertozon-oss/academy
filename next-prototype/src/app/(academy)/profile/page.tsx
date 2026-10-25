import { Suspense } from "react";
import { AcademyLoading } from "@/components/academy-loading";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";
import { ProfileSettings } from "@/app/(academy)/profile/profile-settings";

type StoreProfileDetails = {
  name: string;
  street_address: string;
  city: string;
  postal_code: string;
  country_code: string;
};

async function ProfileContent() {
  const profile = await requireAcademyProfile();
  const supabase = await createAcademyServerClient();
  const storeResult = profile.store_id
    ? await supabase
        .from("stores")
        .select("name, street_address, city, postal_code, country_code")
        .eq("id", profile.store_id)
        .maybeSingle()
    : { data: null, error: null };

  return (
    <ProfileSettings
      firstName={profile.first_name ?? ""}
      lastName={profile.last_name ?? ""}
      email={profile.email}
      role={profile.role}
      store={storeResult.data as StoreProfileDetails | null}
      hasStoreError={Boolean(storeResult.error)}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie profilu" withHeader />}>
      <ProfileContent />
    </Suspense>
  );
}
