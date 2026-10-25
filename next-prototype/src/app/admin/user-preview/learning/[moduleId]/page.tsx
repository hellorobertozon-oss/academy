import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { RiArrowLeftLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { AcademyLoading } from "@/components/academy-loading";
import { Badge } from "@/components/base/badges/badge";
import { ButtonLink } from "@/components/base/buttons/button";
import { CourseModuleOutline } from "@/components/course-module-outline";
import { readAdminPreviewCourseOutline } from "@/lib/academy/learning";
import { getLearningCopy } from "@/lib/academy/learning-copy";

async function PreviewCourseContent({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId: courseSlug } = await params;
  const result = await readAdminPreviewCourseOutline(courseSlug);
  if (result.status === "not-found") notFound();
  if (result.status === "forbidden") redirect("/admin");
  const copy = getLearningCopy(result.status === "ok" ? result.languageCode : "pl");

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <ButtonLink href="/admin/user-preview/learning" size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className="self-start border-accent-400/50 text-accent-300 hover:border-accent-300 hover:bg-accent-950 active:bg-accent-900">
          {copy.backToCourses}
        </ButtonLink>

        {result.status === "error" ? (
          <div role="alert" className="rounded-3xl border border-border-error-default bg-background-primary-default p-6 text-body-regular text-text-error-primary">
            {copy.loadError}
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4">
              <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">Xzone Academy</p>
              <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{result.data.title}</h1>
              {result.data.description ? <p className="max-w-4xl text-headline-regular text-text-secondary">{result.data.description}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Badge color="neutral">{result.data.modules.length} {copy.modules}</Badge>
                <Badge color="neutral">
                  {result.data.modules.reduce((total, courseModule) => total + courseModule.lessons.length, 0)} {copy.lessons}
                </Badge>
              </div>
            </header>

            <CourseModuleOutline modules={result.data.modules} courseSlug={result.data.slug} preview copy={copy} />
          </>
        )}
      </main>
    </div>
  );
}

export default function UserPreviewCoursePage({ params }: { params: Promise<{ moduleId: string }> }) {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie szkolenia" withHeader />}>
      <PreviewCourseContent params={params} />
    </Suspense>
  );
}
