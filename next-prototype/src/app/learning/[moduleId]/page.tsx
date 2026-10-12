import { notFound } from "next/navigation";
import { ModulePage } from "@/components/pages/module-page";
import { learningModules } from "@/components/pages/learning-data";

export function generateStaticParams() {
  return learningModules.map(({ id }) => ({ moduleId: id }));
}

export default async function Page({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;

  if (!learningModules.some((module) => module.id === moduleId)) notFound();

  return <ModulePage moduleId={moduleId} />;
}
