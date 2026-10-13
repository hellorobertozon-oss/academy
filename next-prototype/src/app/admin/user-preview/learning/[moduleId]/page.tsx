import { ModulePage } from "@/components/pages/module-page";
import { learningModules } from "@/components/pages/learning-data";
import { notFound } from "next/navigation";

export default async function UserPreviewModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  if (!learningModules.some((module) => module.id === moduleId)) notFound();
  return <ModulePage moduleId={moduleId} previewMode />;
}
