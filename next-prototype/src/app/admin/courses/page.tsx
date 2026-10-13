import { Suspense } from "react";
import { AcademyLoading } from "@/components/academy-loading";
import { AcademyHeader } from "@/components/academy-header";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";
import { LinkButton } from "@/components/base/buttons/link-button";
import { CourseForm, LanguageForm, type LanguageOption } from "@/app/admin/courses/course-forms";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

type CourseRow = {
  id: number;
  slug: string;
  default_language_code: string;
  published_version_id: number | null;
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

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-title-3-semibold text-text-primary">{title}</h2>
      <p className="text-body-2-regular text-text-secondary">{description}</p>
    </div>
  );
}

async function CourseManagement() {
  const profile = await requireAcademyProfile();
  const supabase = await createAcademyServerClient();
  const [languagesResult, coursesResult] = await Promise.all([
    supabase
      .from("academy_languages")
      .select("code, name, native_name, is_active, sort_order")
      .order("sort_order"),
    supabase
      .from("courses")
      .select("id, slug, default_language_code, published_version_id, updated_at")
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

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-8">
        <header className="flex flex-col gap-2">
          <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">
            Xzone Academy · {profile.email}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-display-3-regular uppercase tracking-wide text-text-primary">
                Szkolenia
              </h1>
              <p className="mt-2 max-w-3xl text-body-regular text-text-secondary">
                Twórz wersjonowane szkolenia z modułami i lekcjami. Szkice są ukryte przed pracownikami.
              </p>
            </div>
            <LinkButton href="/admin" variant="secondary">Wróć do panelu</LinkButton>
          </div>
        </header>

        {loadError || versionsResult.error || translationsResult.error ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            Nie udało się wczytać danych. Sprawdź, czy migracja treści Academy została zastosowana.
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
            <SectionHeading title="Utwórz szkolenie" description="Wybierz język domyślny. Kolejne tłumaczenia dodasz w edytorze." />
            <CourseForm languages={activeLanguages} />
          </div>
          <div className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
            <SectionHeading title="Języki treści" description="Dodaj język, aby przygotować tłumaczenia szkoleń i lekcji." />
            <div className="flex flex-wrap gap-2" aria-label="Aktywne języki">
              {activeLanguages.map((language) => (
                <span key={language.code} className="rounded-full border border-border-button-default px-3 py-1.5 text-caption-1-semibold text-text-secondary">
                  {language.native_name} · {language.code.toUpperCase()}
                </span>
              ))}
            </div>
            <LanguageForm />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
          <SectionHeading title="Lista szkoleń" description="Wersja robocza pozostaje oddzielona od ostatniego wydania." />
          {courses.length ? (
            <Table aria-label="Szkolenia" size="sm">
              <TableHeader>
                <TableColumn id="title" isRowHeader>Szkolenie</TableColumn>
                <TableColumn id="language">Język</TableColumn>
                <TableColumn id="status">Wersja</TableColumn>
                <TableColumn id="edit">Edytuj</TableColumn>
              </TableHeader>
              <TableBody>
                {courses.map((course) => {
                  const courseVersions = versionsByCourse.get(course.id) ?? [];
                  const version = courseVersions.find((item) => item.status === "draft")
                    ?? courseVersions.find((item) => item.id === course.published_version_id)
                    ?? courseVersions.find((item) => item.status === "published");
                  const title = version
                    ? titleByVersionAndLanguage.get(`${version.id}:${course.default_language_code}`)
                    : null;
                  return (
                    <TableRow key={course.id} id={String(course.id)}>
                      <TableCell>
                        <span className="flex flex-col">
                          <span className="text-body-medium text-text-primary">{title ?? course.slug}</span>
                          <span className="text-caption-1-regular text-text-tertiary">/{course.slug}</span>
                        </span>
                      </TableCell>
                      <TableCell>{course.default_language_code.toUpperCase()}</TableCell>
                      <TableCell>
                        {version ? `${version.status === "draft" ? "Szkic" : "Opublikowane"} · v${version.version_number}` : "Brak wersji"}
                      </TableCell>
                      <TableCell>
                        <LinkButton href={`/admin/courses/${course.id}`} size="small">Otwórz edytor</LinkButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-body-2-regular text-text-secondary">Nie utworzono jeszcze szkoleń.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie szkoleń" />}>
      <CourseManagement />
    </Suspense>
  );
}
