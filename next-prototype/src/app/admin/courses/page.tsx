import { Suspense } from "react";
import { AcademyLoading } from "@/components/academy-loading";
import { RiBookOpenLine } from "@remixicon/react";
import { CourseForm, LanguageSettingsModal, type LanguageOption } from "@/app/admin/courses/course-forms";
import { CourseTable, type AdminCourseListRow } from "@/app/admin/courses/course-table";
import { AdminCard, AdminPageHeading } from "@/app/admin/admin-ui";
import { AdminStats } from "@/app/admin/admin-stats";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";
import { formatPolishCount } from "@/lib/admin/polish-count";

type CourseRow = {
  id: number;
  slug: string;
  default_language_code: string;
  published_version_id: number | null;
  is_active: boolean;
  updated_at: string;
};

type VersionRow = {
  id: number;
  course_id: number;
  version_number: number;
  status: "draft" | "published" | "archived";
};

type CourseTranslationRow = {
  course_version_id: number;
  language_code: string;
  title: string;
};

async function CourseManagement() {
  await requireAcademyProfile();
  const supabase = await createAcademyServerClient();
  const [languagesResult, coursesResult] = await Promise.all([
    supabase
      .from("academy_languages")
      .select("code, name, native_name, is_active, sort_order")
      .order("sort_order"),
    supabase
      .from("courses")
      .select("id, slug, default_language_code, published_version_id, is_active, updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  const loadError = Boolean(languagesResult.error || coursesResult.error);
  const languages = (languagesResult.data ?? []) as LanguageOption[];
  const activeLanguages = languages.filter((language) => language.is_active);
  const courses = (coursesResult.data ?? []) as CourseRow[];
  const courseIds = courses.map((course) => course.id);
  const versionsResult = courseIds.length
    ? await supabase
        .from("course_versions")
        .select("id, course_id, version_number, status")
        .in("course_id", courseIds)
        .in("status", ["draft", "published"])
    : { data: [], error: null };
  const versions = (versionsResult.data ?? []) as VersionRow[];
  const publishedCourseCount = courses.filter((course) => course.published_version_id !== null).length;
  const draftVersionCount = versions.filter((version) => version.status === "draft").length;
  const versionIds = versions.map((version) => version.id);
  const translationsResult = versionIds.length
    ? await supabase
        .from("course_translations")
        .select("course_version_id, language_code, title")
        .in("course_version_id", versionIds)
    : { data: [], error: null };
  const translations = (translationsResult.data ?? []) as CourseTranslationRow[];
  const versionsByCourse = new Map<number, VersionRow[]>();
  for (const version of versions) {
    const items = versionsByCourse.get(version.course_id) ?? [];
    items.push(version);
    versionsByCourse.set(version.course_id, items);
  }
  const titleByVersionAndLanguage = new Map(
    translations.map((translation) => [`${translation.course_version_id}:${translation.language_code}`, translation.title]),
  );
  const courseList: AdminCourseListRow[] = courses.map((course) => {
    const courseVersions = versionsByCourse.get(course.id) ?? [];
    const version = courseVersions.find((item) => item.status === "draft")
      ?? courseVersions.find((item) => item.id === course.published_version_id)
      ?? courseVersions.find((item) => item.status === "published");
    const title = version
      ? titleByVersionAndLanguage.get(`${version.id}:${course.default_language_code}`)
      : null;
    return {
      id: course.id,
      slug: course.slug,
      title: title ?? course.slug,
      languageCode: course.default_language_code,
      isPublished: course.published_version_id !== null,
      isActive: course.is_active,
      versionLabel: version
        ? `${version.status === "draft" ? "Szkic" : "Opublikowane"} · v${version.version_number}`
        : "Brak wersji",
    };
  });

  return (
    <>
      <AdminPageHeading
        title="Szkolenia"
        description="Twórz programy z modułów i lekcji, przygotuj tłumaczenia i publikuj je dla użytkowników."
        action={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            <LanguageSettingsModal languages={activeLanguages} />
            <CourseForm languages={activeLanguages} />
          </div>
        )}
      />

        {loadError || versionsResult.error || translationsResult.error ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            Nie udało się wczytać danych. Sprawdź, czy migracja treści Academy została zastosowana.
          </div>
        ) : null}

      <AdminStats metrics={[
        { icon: "courses", label: "Szkolenia", value: String(courses.length), caption: "W bibliotece Academy" },
        { icon: "courses", label: "Opublikowane", value: String(publishedCourseCount), caption: "Mają opublikowaną wersję" },
        { icon: "lessons", label: "Szkice", value: String(draftVersionCount), caption: "Wersje do dalszej edycji" },
        { icon: "languages", label: "Języki", value: String(activeLanguages.length), caption: "Aktywne wersje treści" },
      ]} />

      <AdminCard title="Biblioteka szkoleń" description={`${formatPolishCount(courseList.length, "szkolenie", "szkolenia", "szkoleń")} · ${formatPolishCount(publishedCourseCount, "opublikowane szkolenie", "opublikowane szkolenia", "opublikowanych szkoleń")} · ${formatPolishCount(draftVersionCount, "szkic", "szkice", "szkiców")}`}>
          {courseList.length ? (
            <CourseTable courses={courseList} />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-button-default bg-background-secondary-default px-6 py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-background-primary-default text-foreground-icon-secondary">
                <RiBookOpenLine className="size-5" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-body-medium text-text-primary">Biblioteka jest gotowa na pierwsze szkolenie</p>
                <p className="max-w-xl text-body-2-regular text-text-secondary">Utwórz szkolenie, dodaj moduły i lekcje, a potem opublikuj pierwszą wersję dla użytkowników.</p>
              </div>
              <CourseForm languages={activeLanguages} />
            </div>
          )}
      </AdminCard>

    </>
  );
}

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie szkoleń" />}>
      <CourseManagement />
    </Suspense>
  );
}
