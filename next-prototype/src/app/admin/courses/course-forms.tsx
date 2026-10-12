"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/lib/admin/action-state";
import {
  addLanguageAction,
  createCourseAction,
  createCourseDraftAction,
  publishCourseAction,
} from "@/app/admin/courses/actions";

export type LanguageOption = {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  sort_order: number;
};

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

export function CourseForm({ languages }: { languages: LanguageOption[] }) {
  const [state, action, isPending] = useActionState(createCourseAction, INITIAL_ADMIN_ACTION_STATE);
  const [languageCode, setLanguageCode] = useState(languages[0]?.code ?? "");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="title" label="Tytuł szkolenia" isRequired maxLength={160} />
        <Input name="slug" label="Adres szkolenia" placeholder="np. podstawy-jazdy" isRequired maxLength={100} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-body-medium text-text-primary" id="course-language-label">
          Język domyślny
        </label>
        <Select
          name="language_code"
          aria-labelledby="course-language-label"
          selectedKey={languageCode || null}
          onSelectionChange={(key) => setLanguageCode(String(key))}
          isRequired
        >
          {languages.map((language) => (
            <SelectItem key={language.code} id={language.code}>
              {language.native_name} · {language.code.toUpperCase()}
            </SelectItem>
          ))}
        </Select>
      </div>
      <Textarea name="description" label="Opis" rows={3} maxLength={2000} />
      <ActionMessage state={state} />
      <Button type="submit" disabled={isPending || languages.length === 0} className="self-start">
        {isPending ? "Tworzenie…" : "Utwórz szkolenie"}
      </Button>
    </form>
  );
}

export function LanguageForm() {
  const [state, action, isPending] = useActionState(addLanguageAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[0.65fr_1fr_1fr_auto] sm:items-end">
      <Input name="code" label="Kod" placeholder="pt-BR" isRequired maxLength={6} />
      <Input name="name" label="Nazwa po angielsku" placeholder="Portuguese" isRequired maxLength={60} />
      <Input name="native_name" label="Nazwa własna" placeholder="Português" isRequired maxLength={60} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Dodawanie…" : "Dodaj język"}
      </Button>
      <div className="sm:col-span-4">
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function CreateCourseDraftForm({ courseId }: { courseId: number }) {
  const [state, action, isPending] = useActionState(createCourseDraftAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <input type="hidden" name="course_id" value={courseId} />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Tworzenie szkicu…" : "Utwórz szkic z aktualnej wersji"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

export function PublishCourseForm({
  courseId,
  versionId,
  disabled,
}: {
  courseId: number;
  versionId: number;
  disabled: boolean;
}) {
  const [state, action, isPending] = useActionState(publishCourseAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="version_id" value={versionId} />
      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? "Publikowanie…" : "Opublikuj tę wersję"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
