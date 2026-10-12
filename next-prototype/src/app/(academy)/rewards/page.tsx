import { redirect } from "next/navigation";
import { RewardsPage } from "@/components/pages/rewards-page";
import { readEmployeePoints } from "@/lib/academy/learning";

export default async function Page() {
  const result = await readEmployeePoints();
  if (result.status === "forbidden") redirect("/admin/courses");

  return <RewardsPage currentPoints={result.status === "ok" ? result.data : null} />;
}
