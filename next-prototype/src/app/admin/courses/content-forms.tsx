"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
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
import {
  parseYoutubeVideoIds,
  type LessonConversationMessage,
  type TiptapDocument,
} from "@/lib/admin/content-validation";
import type { LanguageOption } from "@/app/admin/courses/course-forms";
import { getNativeLanguageName } from "@/lib/admin/language-label";
import { TrainingImageUpload } from "@/app/admin/courses/training-image-upload";
import { cx } from "@/utils/cx";
import { RiAddLine } from "@remixicon/react";
import { LessonContentSections } from "@/components/pages/lesson-content-sections";
import {
  CourseEditorSaveBar,
  useConfirmCourseEditorDiscard,
  useCourseEditorFormDirty,
} from "@/app/admin/courses/course-editor-state";

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
  image_path: string | null;
  image_url?: string | null;
};

export type ModuleTranslation = {
  language_code: string;
  title: string;
  summary: string;
  image_path: string | null;
  image_url?: string | null;
};

export type LessonTranslation = {
  language_code: string;
  title: string;
  summary: string;
  youtube_video_id: string | null;
  youtube_video_ids?: string[];
  content: TiptapDocument;
  product_bullets: string[];
  key_points_title: string;
  conversation_title: string;
  conversation: LessonConversationMessage[];
  image_path: string | null;
  image_url?: string | null;
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

export function AdminDisclosure({
  title,
  children,
  variant = "default",
}: {
  title: string;
  children: ReactNode;
  variant?: "default" | "action";
}) {
  const action = variant === "action";
  return (
    <details className="group min-w-0 w-full">
      <summary
        className={cx(
          "flex w-fit list-none cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-body-medium outline-none transition-colors",
          "[&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-border-focus-ring",
          action
            ? "w-full border-dashed border-border-button-default bg-background-secondary-default text-text-primary hover:border-accent-500"
            : "border-separator-border bg-background-primary-default text-text-secondary hover:border-border-button-hover hover:text-text-primary",
        )}
      >
        {action ? <span className="text-accent-700" aria-hidden="true">+</span> : null}
        <span>{title}</span>
        {!action ? <span className="text-text-tertiary transition-transform group-open:rotate-45" aria-hidden="true">+</span> : null}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function LanguageName({ language, value }: { language: LanguageOption; value: string }) {
  return <span className="text-caption-1-regular text-text-tertiary">{getNativeLanguageName(language)} · {value}</span>;
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
  const confirmDiscard = useConfirmCourseEditorDiscard();
  return (
    <Select
      aria-label="Język tłumaczenia"
      selectedKey={selected || null}
      onSelectionChange={(key) => {
        const nextLanguage = String(key);
        if (
          nextLanguage !== selected &&
          confirmDiscard(false, "Zmiana języka zamknie bieżący formularz. Niezapisane zmiany zostaną utracone. Kontynuować?")
        ) onChange(nextLanguage);
      }}
      isDisabled={languages.length === 0}
    >
      {languages.map((language) => (
        <SelectItem key={language.code} id={language.code}>
          {getNativeLanguageName(language)} · {language.code.toUpperCase()}
        </SelectItem>
      ))}
    </Select>
  );
}

function KeyPointEditor({
  title,
  onTitleChange,
  bullets,
  onBulletsChange,
  disabled,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  bullets: string[];
  onBulletsChange: (value: string[]) => void;
  disabled: boolean;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-separator-border p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h4 className="text-title-3-semibold text-text-primary">Punkty do zapamiętania</h4>
        <p className="text-body-2-regular text-text-secondary">
          Każdy punkt ma osobne pole. Na stronie kursanta lista otrzyma miętowe znaczniki.
        </p>
      </div>
      <Input
        label="Tytuł sekcji"
        value={title}
        onChange={onTitleChange}
        maxLength={120}
        isDisabled={disabled}
      />
      <div className="flex flex-col gap-3">
        {bullets.map((bullet, index) => (
          <div key={index} className="flex items-end gap-2">
            <Input
              label={`Punkt ${index + 1}`}
              placeholder="Wpisz krótką informację do zapamiętania"
              value={bullet}
              onChange={(value) => onBulletsChange(bullets.map((item, itemIndex) => itemIndex === index ? value : item))}
              maxLength={160}
              isDisabled={disabled}
            />
            {bullets.length > 1 ? (
              <Button
                type="button"
                size="small"
                variant="ghost"
                className="mb-0.5 min-h-10 shrink-0"
                onClick={() => onBulletsChange(bullets.filter((_, itemIndex) => itemIndex !== index))}
                disabled={disabled}
                aria-label={`Usuń punkt ${index + 1}`}
              >
                Usuń
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="small"
        variant="secondary"
        leadingIcon={RiAddLine}
        className="min-h-10 self-start"
        onClick={() => onBulletsChange([...bullets, ""])}
        disabled={disabled || bullets.length >= 12}
      >
        Dodaj punkt
      </Button>
    </section>
  );
}

function ConversationEditor({
  title,
  onTitleChange,
  messages,
  onMessagesChange,
  disabled,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  messages: LessonConversationMessage[];
  onMessagesChange: (value: LessonConversationMessage[]) => void;
  disabled: boolean;
}) {
  const updateMessage = (index: number, update: Partial<LessonConversationMessage>) => {
    onMessagesChange(messages.map((message, itemIndex) => itemIndex === index ? { ...message, ...update } : message));
  };

  const addMessage = () => {
    const previousSpeaker = messages[messages.length - 1]?.speaker;
    onMessagesChange([
      ...messages,
      { speaker: previousSpeaker === "client" ? "seller" : "client", text: "" },
    ]);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-separator-border p-4 sm:p-5">
      <p className="text-body-2-regular text-text-secondary">
        Dodawaj kwestie klienta i sprzedawcy. Kolejna wypowiedź domyślnie zmienia rozmówcę.
      </p>
      <Input
        label="Tytuł sekcji"
        value={title}
        onChange={onTitleChange}
        maxLength={120}
        isDisabled={disabled}
      />
      {messages.length ? (
        <ol className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <li key={index} className="grid gap-3 rounded-xl border border-separator-border p-3 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-end">
              <Select
                aria-label={`Kto mówi w wypowiedzi ${index + 1}`}
                selectedKey={message.speaker}
                onSelectionChange={(key) => {
                  if (key) updateMessage(index, { speaker: String(key) as LessonConversationMessage["speaker"] });
                }}
                isDisabled={disabled}
              >
                <SelectItem id="client">Klient</SelectItem>
                <SelectItem id="seller">Sprzedawca</SelectItem>
              </Select>
              <Textarea
                label={`Wypowiedź ${index + 1}`}
                value={message.text}
                onChange={(value) => updateMessage(index, { text: value })}
                rows={2}
                maxLength={500}
                isDisabled={disabled}
              />
              <Button
                type="button"
                size="small"
                variant="ghost"
                className="min-h-10 justify-self-start sm:mb-0.5 sm:justify-self-auto"
                onClick={() => onMessagesChange(messages.filter((_, itemIndex) => itemIndex !== index))}
                disabled={disabled}
                aria-label={`Usuń wypowiedź ${index + 1}`}
              >
                Usuń
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl bg-background-secondary-default p-4 text-body-2-regular text-text-secondary">
          Dodaj pierwszą wypowiedź, aby rozpocząć rozmowę.
        </p>
      )}
      <Button
        type="button"
        size="small"
        variant="secondary"
        leadingIcon={RiAddLine}
        className="min-h-10 self-start"
        onClick={addMessage}
        disabled={disabled || messages.length >= 30}
      >
        Dodaj wypowiedź
      </Button>
    </div>
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
  courseId,
  versionId,
  moduleId,
  languages,
  translations,
  defaultLanguage,
  disabled,
}: {
  courseId: number;
  versionId: number;
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
        courseId={courseId}
        versionId={versionId}
        moduleId={moduleId}
        language={language}
        translation={translation}
        disabled={disabled}
      />
    </div>
  );
}

export function LessonTranslationPanel({
  courseId,
  versionId,
  moduleId,
  lessonId,
  languages,
  translations,
  defaultLanguage,
  disabled,
}: {
  courseId: number;
  versionId: number;
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
        courseId={courseId}
        versionId={versionId}
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
  const { isDirty, markDirty, clearDirty } = useCourseEditorFormDirty(`course:${courseId}:${language.code}`);
  useEffect(() => {
    if (!isPending && state.status === "success") clearDirty();
  }, [clearDirty, isPending, state.status]);
  return (
    <form action={action} onChange={markDirty} className="flex flex-col gap-3 rounded-2xl border border-separator-border p-4">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="version_id" value={versionId} />
      <input type="hidden" name="language_code" value={language.code} />
      <TrainingImageUpload
        scopePrefix={`courses/${courseId}/versions/${versionId}/translations/course/${courseId}/${language.code}`}
        initialPath={translation?.image_path}
        initialUrl={translation?.image_url}
        disabled={disabled}
        label="szkolenia"
        onDirtyChange={markDirty}
      />
      <LanguageName language={language} value={translation ? "Tłumaczenie gotowe" : "Brak tłumaczenia"} />
      <Input name="title" label="Tytuł szkolenia" defaultValue={translation?.title ?? ""} isRequired maxLength={160} isDisabled={disabled} />
      <Textarea name="description" label="Opis" defaultValue={translation?.description ?? ""} rows={2} maxLength={2000} isDisabled={disabled} />
      <ActionMessage state={state} />
      <CourseEditorSaveBar isDirty={isDirty && !disabled} isPending={isPending} />
    </form>
  );
}

export function CreateModuleForm({
  versionId,
  language,
  disabled,
  onCreated,
}: {
  versionId: number;
  language: LanguageOption;
  disabled: boolean;
  onCreated?: (moduleId: number) => void;
}) {
  const [state, action, isPending] = useActionState(createModuleAction, INITIAL_ADMIN_ACTION_STATE);
  const { isDirty, markDirty, clearDirty } = useCourseEditorFormDirty(`new-module:${versionId}:${language.code}`);
  useEffect(() => {
    if (!isPending && state.status === "success") clearDirty();
    if (state.status === "success" && state.entityId) onCreated?.(state.entityId);
  }, [clearDirty, isPending, onCreated, state.entityId, state.status]);
  return (
    <form action={action} onChange={markDirty} className="grid gap-3 rounded-2xl border border-separator-border p-4 sm:grid-cols-2">
      <input type="hidden" name="version_id" value={versionId} />
      <input type="hidden" name="language_code" value={language.code} />
      <div className="sm:col-span-2">
        <LanguageName language={language} value="Język początkowego tytułu" />
      </div>
      <Input name="title" label="Nazwa modułu" isRequired maxLength={160} isDisabled={disabled} />
      <Input name="summary" label="Krótki opis" maxLength={500} isDisabled={disabled} />
      <div className="sm:col-span-2"><ActionMessage state={state} /></div>
      <div className="sm:col-span-2">
        <CourseEditorSaveBar isDirty={isDirty && !disabled} isPending={isPending} />
      </div>
    </form>
  );
}

export function ModuleTranslationEditor({
  courseId,
  versionId,
  moduleId,
  language,
  translation,
  disabled,
}: {
  courseId: number;
  versionId: number;
  moduleId: number;
  language: LanguageOption;
  translation?: ModuleTranslation;
  disabled: boolean;
}) {
  const [state, action, isPending] = useActionState(saveModuleTranslationAction, INITIAL_ADMIN_ACTION_STATE);
  const { isDirty, markDirty, clearDirty } = useCourseEditorFormDirty(`module:${moduleId}:${language.code}`);
  useEffect(() => {
    if (!isPending && state.status === "success") clearDirty();
  }, [clearDirty, isPending, state.status]);
  return (
    <form action={action} onChange={markDirty} className="flex flex-col gap-3 rounded-2xl border border-separator-border p-4">
      <input type="hidden" name="module_id" value={moduleId} />
      <input type="hidden" name="language_code" value={language.code} />
      <TrainingImageUpload
        scopePrefix={`courses/${courseId}/versions/${versionId}/translations/module/${moduleId}/${language.code}`}
        initialPath={translation?.image_path}
        initialUrl={translation?.image_url}
        disabled={disabled}
        label="modułu"
        onDirtyChange={markDirty}
      />
      <LanguageName language={language} value={translation ? "Tłumaczenie gotowe" : "Brak tłumaczenia"} />
      <Input name="title" label="Nazwa modułu" defaultValue={translation?.title ?? ""} isRequired maxLength={160} isDisabled={disabled} />
      <Textarea name="summary" label="Krótkie podsumowanie" defaultValue={translation?.summary ?? ""} rows={2} maxLength={500} isDisabled={disabled} />
      <ActionMessage state={state} />
      <CourseEditorSaveBar isDirty={isDirty && !disabled} isPending={isPending} />
    </form>
  );
}

export function LessonTranslationEditor({
  mode,
  courseId,
  versionId,
  moduleId,
  lessonId,
  language,
  translation,
  disabled,
  onCreated,
}: {
  mode: "create" | "update";
  courseId: number;
  versionId: number;
  moduleId: number;
  lessonId?: number;
  language: LanguageOption;
  translation?: LessonTranslation;
  disabled: boolean;
  onCreated?: (lessonId: number, moduleId: number) => void;
}) {
  const actionToRun = mode === "create" ? createLessonAction : saveLessonTranslationAction;
  const [state, action, isPending] = useActionState(actionToRun, INITIAL_ADMIN_ACTION_STATE);
  const { isDirty, markDirty, clearDirty } = useCourseEditorFormDirty(`lesson:${lessonId ?? "new"}:${language.code}`);
  useEffect(() => {
    if (mode === "create" && state.status === "success" && state.entityId) onCreated?.(state.entityId, moduleId);
  }, [mode, moduleId, onCreated, state.entityId, state.status]);
  useEffect(() => {
    if (!isPending && state.status === "success") clearDirty();
  }, [clearDirty, isPending, state.status]);
  const [content, setContent] = useState<TiptapDocument>(translation?.content ?? emptyDocument);
  const initialYoutubeVideoIds = translation?.youtube_video_ids?.length
    ? translation.youtube_video_ids
    : translation?.youtube_video_id
      ? [translation.youtube_video_id]
      : [];
  const [youtubeUrls, setYoutubeUrls] = useState(
    () => initialYoutubeVideoIds.map((id) => "https://youtu.be/" + id).join("\n"),
  );
  const youtubeIds = parseYoutubeVideoIds(youtubeUrls);
  const [keyPointsTitle, setKeyPointsTitle] = useState(translation?.key_points_title || "Warto zapamiętać");
  const [productBullets, setProductBullets] = useState<string[]>(() =>
    translation?.product_bullets.length ? [...translation.product_bullets] : [""],
  );
  const [conversationTitle, setConversationTitle] = useState(translation?.conversation_title || "Rozmowa z klientem");
  const [conversation, setConversation] = useState<LessonConversationMessage[]>(translation?.conversation ?? []);
  const imageEntityId = String(moduleId);

  return (
    <form action={action} onChange={markDirty} className="flex flex-col gap-5 rounded-2xl border border-separator-border p-4 sm:p-5">
      <input type="hidden" name="module_id" value={moduleId} />
      {mode === "update" && lessonId ? <input type="hidden" name="lesson_id" value={lessonId} /> : null}
      <input type="hidden" name="language_code" value={language.code} />
      <input type="hidden" name="content_json" value={JSON.stringify(content)} readOnly />
      <input type="hidden" name="product_bullets" value={JSON.stringify(productBullets)} readOnly />
      <input type="hidden" name="key_points_title" value={keyPointsTitle} readOnly />
      <input type="hidden" name="conversation_title" value={conversationTitle} readOnly />
      <input type="hidden" name="conversation_json" value={JSON.stringify(conversation)} readOnly />
      <TrainingImageUpload
        scopePrefix={`courses/${courseId}/versions/${versionId}/translations/lesson/${imageEntityId}/${language.code}`}
        initialPath={translation?.image_path}
        initialUrl={translation?.image_url}
        disabled={disabled}
        label="lekcji"
        onDirtyChange={markDirty}
      />
      <LanguageName language={language} value={mode === "create" ? "Język początkowej wersji lekcji" : translation ? "Tłumaczenie gotowe" : "Brak tłumaczenia"} />
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h4 className="text-title-3-semibold text-text-primary">Podstawowe informacje</h4>
          <p className="text-body-2-regular text-text-secondary">Tytuł jest wymagany. Podsumowanie i film możesz dodać później.</p>
        </div>
        <Input
          name="title"
          label="Tytuł lekcji"
          defaultValue={translation?.title ?? ""}
          isRequired
          maxLength={160}
          isDisabled={disabled}
        />
      </div>
      <AdminDisclosure title="Podsumowanie i materiały dodatkowe (opcjonalne)">
        <div className="flex flex-col gap-4 rounded-2xl border border-separator-border p-4">
          <p className="text-body-2-regular text-text-secondary">Dodaj tylko to, czego potrzebuje ta lekcja. Wszystkie pola w tej sekcji są opcjonalne.</p>
          <Textarea
            name="summary"
            label="Krótkie podsumowanie"
            defaultValue={translation?.summary ?? ""}
            rows={2}
            maxLength={500}
            isDisabled={disabled}
          />
          <Textarea
            name="youtube_urls"
            label="Filmy z YouTube (jeden adres w wierszu)"
            placeholder="https://youtu.be/..."
            rows={3}
            value={youtubeUrls}
            onChange={(value) => {
              setYoutubeUrls(value);
              markDirty();
            }}
            isDisabled={disabled}
          />
          {youtubeIds.ok && youtubeIds.value.length ? (
            <div className="flex flex-col gap-3">
              {youtubeIds.value.map((videoId, index) => (
                <div key={videoId} className="aspect-video overflow-hidden rounded-2xl border border-separator-border bg-background-secondary-default">
                  <iframe
                    title={"Podgląd filmu " + (index + 1) + ": " + (translation?.title ?? "nowa lekcja")}
                    src={"https://www.youtube-nocookie.com/embed/" + videoId}
                    className="size-full"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </AdminDisclosure>
      <KeyPointEditor
        title={keyPointsTitle}
        onTitleChange={(value) => {
          setKeyPointsTitle(value);
          markDirty();
        }}
        bullets={productBullets}
        onBulletsChange={(value) => {
          setProductBullets(value);
          markDirty();
        }}
        disabled={disabled}
      />
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-title-3-semibold text-text-primary">Treść lekcji</h4>
          <p className="text-body-2-regular text-text-secondary">Dodaj tekst, nagłówki, listy lub materiały, które przeprowadzą użytkownika przez temat.</p>
        </div>
        <RichTextEditor
          key={`${lessonId ?? "new"}:${language.code}`}
          value={content}
          onChange={(value) => {
            setContent(value);
            markDirty();
          }}
          editable={!disabled}
        />
      </section>
      <AdminDisclosure title="Rozmowa z klientem (opcjonalnie)">
        <ConversationEditor
          title={conversationTitle}
          onTitleChange={(value) => {
            setConversationTitle(value);
            markDirty();
          }}
          messages={conversation}
          onMessagesChange={(value) => {
            setConversation(value);
            markDirty();
          }}
          disabled={disabled}
        />
      </AdminDisclosure>
      <AdminDisclosure title="Podgląd widoku kursanta">
        <LessonContentSections
          content={content}
          productBullets={productBullets}
          keyPointsTitle={keyPointsTitle}
          conversationTitle={conversationTitle}
          conversation={conversation}
          unavailableMessage="Treść tej lekcji nie jest jeszcze dostępna."
        />
      </AdminDisclosure>
      <ActionMessage state={state} />
      <CourseEditorSaveBar isDirty={isDirty && !disabled} isPending={isPending} />
    </form>
  );
}
