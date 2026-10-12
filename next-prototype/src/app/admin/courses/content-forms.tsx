"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/lib/admin/action-state";
import {
  createLessonAction,
  createModuleAction,
  saveCourseTranslationAction,
  saveLessonTranslationAction,
  saveModuleTranslationAction,
} from "@/app/admin/courses/actions";
import { parseYoutubeVideoId, type TiptapDocument } from "@/lib/admin/content-validation";
import type { LanguageOption } from "@/app/admin/courses/course-forms";

const RichTextEditor = dynamic(
  () => import("@/app/admin/courses/rich-text-editor").then((module) => module.RichTextEditor),
  {
    ssr: false,
    loading: () => <div className="min-h-56 rounded-xl border border-separator-border bg-background-full p-4 text-body-2-regular text-text-secondary">Wczytywanie edytora…</div>,
  },
);

export type CourseTranslation = {
  language_code: string;
  title: string;
  description: string;
};

export type ModuleTranslation = {
  language_code: string;
  title: string;
  summary: string;
};

export type LessonTranslation = {
  language_code: string;
  title: string;
  summary: string;
  youtube_video_id: string | null;
  content: TiptapDocument;
  product_bullets: string[];
};

const emptyDocument: TiptapDocument = { type: "doc", content: [] };

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      className={state.status === "error" ? "text-body-2-medium text-text-error-primary" : "text-body-2-medium text-text-secondary"}
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function AdminDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  return (
    <div className="rounded-2xl border border-separator-border p-3">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </Button>
      {open ? <div id={contentId} className="mt-3">{children}</div> : null}
    </div>
  );
}

function LanguageName({ language, value }: { language: LanguageOption; value: string }) {
  return <span className="text-caption-1-regular text-text-tertiary">{language.native_name} · {value}</span>;
}

function LanguageChooser({
  languages,
  selected,
  onChange,
}: {
  languages: LanguageOption[];
  selected: string;
  onChange: (code: string) => void;
}) {
  return (
    <Select
      aria-label="Język tłumaczenia"
      selectedKey={selected || null}
      onSelectionChange={(key) => onChange(String(key))}
      isDisabled={languages.length === 0}
    >
      {languages.map((language) => (
        <SelectItem key={language.code} id={language.code}>
          {language.native_name} · {language.code.toUpperCase()}
        </SelectItem>
      ))}
    </Select>
  );
}

export function CourseTranslationPanel({
  courseId,
  versionId,
  defaultLanguage,
  languages,
  translations,
  disabled,
}: {
  courseId: number;
  versionId: number;
  defaultLanguage: string;
  languages: LanguageOption[];
  translations: CourseTranslation[];
  disabled: boolean;
}) {
  const [languageCode, setLanguageCode] = useState(defaultLanguage || languages[0]?.code || "");
  const language = languages.find((item) => item.code === languageCode);
  const translation = translations.find((item) => item.language_code === languageCode);
  if (!language) return <p className="text-body-2-regular text-text-secondary">Dodaj język treści, aby edytować tłumaczenie.</p>;

  return (
    <div className="flex flex-col gap-3">
      <LanguageChooser languages={languages} selected={languageCode} onChange={setLanguageCode} />
      <CourseTranslationEditor
        key={`${versionId}:${languageCode}`}
        courseId={courseId}
        versionId={versionId}
        language={language}
        translation={translation}
        disabled={disabled}
      />
    </div>
  );
}

export function ModuleTranslationPanel({
  moduleId,
  languages,
  translations,
  defaultLanguage,
  disabled,
}: {
  moduleId: number;
  languages: LanguageOption[];
  translations: ModuleTranslation[];
  defaultLanguage: string;
  disabled: boolean;
}) {
  const [languageCode, setLanguageCode] = useState(defaultLanguage || languages[0]?.code || "");
  const language = languages.find((item) => item.code === languageCode);
  const translation = translations.find((item) => item.language_code === languageCode);
  if (!language) return <p className="text-body-2-regular text-text-secondary">Dodaj język treści, aby edytować tłumaczenie.</p>;

  return (
    <div className="flex flex-col gap-3">
      <LanguageChooser languages={languages} selected={languageCode} onChange={setLanguageCode} />
      <ModuleTranslationEditor
        key={`${moduleId}:${languageCode}`}
        moduleId={moduleId}
        language={language}
        translation={translation}
        disabled={disabled}
      />
    </div>
  );
}

export function LessonTranslationPanel({
  moduleId,
  lessonId,
  languages,
  translations,
  defaultLanguage,
  disabled,
}: {
  moduleId: number;
  lessonId: number;
  languages: LanguageOption[];
  translations: LessonTranslation[];
  defaultLanguage: string;
  disabled: boolean;
}) {
  const [languageCode, setLanguageCode] = useState(defaultLanguage || languages[0]?.code || "");
  const language = languages.find((item) => item.code === languageCode);
  const translation = translations.find((item) => item.language_code === languageCode);
  if (!language) return <p className="text-body-2-regular text-text-secondary">Dodaj język treści, aby edytować tłumaczenie.</p>;

  return (
    <div className="flex flex-col gap-3">
      <LanguageChooser languages={languages} selected={languageCode} onChange={setLanguageCode} />
      <LessonTranslationEditor
        key={`${lessonId}:${languageCode}`}
        mode="update"
        moduleId={moduleId}
        lessonId={lessonId}
        language={language}
        translation={translation}
        disabled={disabled}
      />
    </div>
  );
}

export function CourseTranslationEditor({
  courseId,
  versionId,
  language,
  translation,
  disabled,
}: {
  courseId: number;
  versionId: number;
  language: LanguageOption;
  translation?: CourseTranslation;
  disabled: boolean;
}) {
  const [state, action, isPending] = useActionState(saveCourseTranslationAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-separator-border p-4">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="version_id" value={versionId} />
      <input type="hidden" name="language_code" value={language.code} />
      <LanguageName language={language} value={translation ? "Tłumaczenie gotowe" : "Brak tłumaczenia"} />
      <Input name="title" label="Tytuł szkolenia" defaultValue={translation?.title ?? ""} isRequired maxLength={160} isDisabled={disabled} />
      <Textarea name="description" label="Opis" defaultValue={translation?.description ?? ""} rows={2} maxLength={2000} isDisabled={disabled} />
      {!disabled ? <Button type="submit" disabled={isPending} className="self-start">{isPending ? "Zapisywanie…" : "Zapisz tłumaczenie"}</Button> : null}
      <ActionMessage state={state} />
    </form>
  );
}

export function CreateModuleForm({
  versionId,
  language,
  disabled,
}: {
  versionId: number;
  language: LanguageOption;
  disabled: boolean;
}) {
  const [state, action, isPending] = useActionState(createModuleAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-separator-border p-4 sm:grid-cols-2">
      <input type="hidden" name="version_id" value={versionId} />
      <input type="hidden" name="language_code" value={language.code} />
      <div className="sm:col-span-2">
        <LanguageName language={language} value="Język początkowego tytułu" />
      </div>
      <Input name="title" label="Nazwa modułu" isRequired maxLength={160} isDisabled={disabled} />
      <Input name="summary" label="Krótki opis" maxLength={500} isDisabled={disabled} />
      {!disabled ? <Button type="submit" disabled={isPending} className="self-start">{isPending ? "Dodawanie…" : "Dodaj moduł"}</Button> : null}
      <div className="sm:col-span-2"><ActionMessage state={state} /></div>
    </form>
  );
}

export function ModuleTranslationEditor({
  moduleId,
  language,
  translation,
  disabled,
}: {
  moduleId: number;
  language: LanguageOption;
  translation?: ModuleTranslation;
  disabled: boolean;
}) {
  const [state, action, isPending] = useActionState(saveModuleTranslationAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-separator-border p-4">
      <input type="hidden" name="module_id" value={moduleId} />
      <input type="hidden" name="language_code" value={language.code} />
      <LanguageName language={language} value={translation ? "Tłumaczenie gotowe" : "Brak tłumaczenia"} />
      <Input name="title" label="Nazwa modułu" defaultValue={translation?.title ?? ""} isRequired maxLength={160} isDisabled={disabled} />
      <Textarea name="summary" label="Krótkie podsumowanie" defaultValue={translation?.summary ?? ""} rows={2} maxLength={500} isDisabled={disabled} />
      {!disabled ? <Button type="submit" disabled={isPending} className="self-start">{isPending ? "Zapisywanie…" : "Zapisz tłumaczenie"}</Button> : null}
      <ActionMessage state={state} />
    </form>
  );
}

export function LessonTranslationEditor({
  mode,
  moduleId,
  lessonId,
  language,
  translation,
  disabled,
}: {
  mode: "create" | "update";
  moduleId: number;
  lessonId?: number;
  language: LanguageOption;
  translation?: LessonTranslation;
  disabled: boolean;
}) {
  const actionToRun = mode === "create" ? createLessonAction : saveLessonTranslationAction;
  const [state, action, isPending] = useActionState(actionToRun, INITIAL_ADMIN_ACTION_STATE);
  const [content, setContent] = useState<TiptapDocument>(translation?.content ?? emptyDocument);
  const [youtubeUrl, setYoutubeUrl] = useState(
    translation?.youtube_video_id ? `https://youtu.be/${translation.youtube_video_id}` : "",
  );
  const youtubeId = parseYoutubeVideoId(youtubeUrl);
  const bullets = translation?.product_bullets.join("\n") ?? "";

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-separator-border p-4">
      <input type="hidden" name="module_id" value={moduleId} />
      {mode === "update" && lessonId ? <input type="hidden" name="lesson_id" value={lessonId} /> : null}
      <input type="hidden" name="language_code" value={language.code} />
      <input type="hidden" name="content_json" value={JSON.stringify(content)} readOnly />
      <LanguageName language={language} value={mode === "create" ? "Język początkowej wersji lekcji" : translation ? "Tłumaczenie gotowe" : "Brak tłumaczenia"} />
      <Input
        name="title"
        label="Tytuł lekcji"
        defaultValue={translation?.title ?? ""}
        isRequired
        maxLength={160}
        isDisabled={disabled}
      />
      <Textarea
        name="summary"
        label="Krótkie podsumowanie"
        defaultValue={translation?.summary ?? ""}
        rows={2}
        maxLength={500}
        isDisabled={disabled}
      />
      <Input
        name="youtube_url"
        type="url"
        label="Adres filmu YouTube (opcjonalnie)"
        placeholder="https://youtu.be/..."
        value={youtubeUrl}
        onChange={setYoutubeUrl}
        isDisabled={disabled}
      />
      {youtubeId.ok && youtubeId.value ? (
        <div className="aspect-video overflow-hidden rounded-2xl border border-separator-border bg-background-secondary-default">
          <iframe
            title={`Podgląd filmu: ${translation?.title ?? "nowa lekcja"}`}
            src={`https://www.youtube-nocookie.com/embed/${youtubeId.value}`}
            className="size-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <span className="text-body-medium text-text-primary">Treść lekcji</span>
        <RichTextEditor
          key={`${lessonId ?? "new"}:${language.code}`}
          value={content}
          onChange={setContent}
          editable={!disabled}
        />
        <AdminDisclosure title="Podgląd treści">
          <RichTextEditor value={content} editable={false} />
        </AdminDisclosure>
      </div>
      <Textarea
        name="product_bullets"
        label="Krótkie punkty o produkcie (po jednym w wierszu)"
        defaultValue={bullets}
        rows={3}
        maxLength={2000}
        isDisabled={disabled}
      />
      {!disabled ? (
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Zapisywanie…" : mode === "create" ? "Dodaj lekcję" : "Zapisz tłumaczenie lekcji"}
        </Button>
      ) : null}
      <ActionMessage state={state} />
    </form>
  );
}
