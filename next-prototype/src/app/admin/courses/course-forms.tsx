"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { RiAddLine, RiSettings6Line } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/lib/admin/action-state";
import { getNativeLanguageName } from "@/lib/admin/language-label";
import {
  addLanguageAction,
  createCourseAction,
  ensureCourseDraftAction,
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

function courseSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CourseFormFields({ languages }: { languages: LanguageOption[] }) {
  const [state, action, isPending] = useActionState(createCourseAction, INITIAL_ADMIN_ACTION_STATE);
  const [languageCode, setLanguageCode] = useState(languages[0]?.code ?? "");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={action} className="flex min-w-0 flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="title"
          label="Nazwa szkolenia"
          value={title}
          onChange={(value) => {
            setTitle(value);
            if (!slugEdited) setSlug(courseSlug(value));
          }}
          isRequired
          maxLength={160}
        />
        <Input
          name="slug"
          label="Adres szkolenia"
          hint="Tworzymy go z nazwy. Możesz go zmienić."
          placeholder="np. podstawy-jazdy"
          value={slug}
          onChange={(value) => {
            setSlugEdited(true);
            setSlug(courseSlug(value));
          }}
          isRequired
          maxLength={100}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-body-medium text-text-primary" id="course-language-label">
          Język szkolenia
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
              {getNativeLanguageName(language)} · {language.code.toUpperCase()}
            </SelectItem>
          ))}
        </Select>
      </div>
      <Textarea name="description" label="Opis" rows={3} maxLength={2000} />
      <ActionMessage state={state} />
      <Button type="submit" disabled={isPending || languages.length === 0} className="self-start">
        {isPending ? "Przygotowywanie programu…" : "Utwórz i przejdź do programu"}
      </Button>
    </form>
  );
}

export function CourseForm({ languages }: { languages: LanguageOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setFormKey((current) => current + 1);
  }, []);
  const handleOpenChange = useCallback((open: boolean) => {
    if (open) setIsOpen(true);
    else closeModal();
  }, [closeModal]);

  return (
    <>
      <div>
        <Button type="button" leadingIcon={RiAddLine} onClick={() => setIsOpen(true)}>
          Utwórz szkolenie
        </Button>
      </div>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isDismissable
        className="admin-theme fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      >
        <Modal className="w-full max-w-2xl outline-none">
          <Dialog aria-label="Utwórz szkolenie" className="outline-none">
            <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-2xl">
              <header className="flex items-start justify-between gap-4 border-b border-separator-border p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">Nowe szkolenie · krok 1</p>
                  <h2 className="text-title-2-semibold text-text-primary">Podstawowe informacje</h2>
                  <p className="max-w-lg text-body-2-regular text-text-secondary">
                    Podaj nazwę i język. Po utworzeniu od razu ułożysz moduły i lekcje.
                  </p>
                </div>
                <CloseButton aria-label="Zamknij" size="md" onClick={closeModal} />
              </header>
              <div className="overflow-y-auto p-5 sm:p-6">
                <CourseFormFields key={formKey} languages={languages} />
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

export function LanguageForm() {
  const [state, action, isPending] = useActionState(addLanguageAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 sm:items-end">
      <Input name="code" label="Kod" placeholder="pt-BR" isRequired maxLength={6} />
      <Input name="name" label="Nazwa po angielsku" placeholder="Portuguese" isRequired maxLength={60} />
      <Input name="native_name" label="Nazwa własna" placeholder="Português" isRequired maxLength={60} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Dodawanie…" : "Dodaj język"}
      </Button>
      <div className="sm:col-span-2">
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function LanguageSettingsModal({ languages }: { languages: LanguageOption[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="small"
        leadingIcon={RiSettings6Line}
        onClick={() => setIsOpen(true)}
      >
        Ustawienia języków
      </Button>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        isDismissable
        className="admin-theme fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      >
        <Modal className="w-full max-w-xl outline-none">
          <Dialog aria-label="Ustawienia języków treści" className="outline-none">
            <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-2xl">
              <header className="flex items-start justify-between gap-4 border-b border-separator-border p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-title-2-semibold text-text-primary">Języki treści</h2>
                  <p className="max-w-lg text-body-2-regular text-text-secondary">
                    Dodaj język, aby przygotować tłumaczenia szkoleń i lekcji.
                  </p>
                </div>
                <CloseButton aria-label="Zamknij" size="md" onClick={() => setIsOpen(false)} />
              </header>
              <div className="flex flex-col gap-6 overflow-y-auto p-5 sm:p-6">
                <section className="flex flex-col gap-3" aria-labelledby="active-languages-heading">
                  <h3 id="active-languages-heading" className="text-body-medium text-text-primary">
                    Dostępne języki
                  </h3>
                  {languages.length ? (
                    <ul className="flex flex-wrap gap-2" aria-label="Aktywne języki">
                      {languages.map((language) => (
                        <li key={language.code} className="inline-flex items-center gap-2 rounded-full border border-border-button-default bg-background-secondary-default px-3 py-1.5 text-caption-1-semibold text-text-secondary">
                          {getNativeLanguageName(language)} · {language.code.toUpperCase()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-body-2-regular text-text-secondary">Nie dodano jeszcze żadnego języka.</p>
                  )}
                </section>
                <section className="flex flex-col gap-3 border-t border-separator-border pt-5" aria-labelledby="add-language-heading">
                  <div className="flex flex-col gap-1">
                    <h3 id="add-language-heading" className="text-body-medium text-text-primary">
                      Dodaj język
                    </h3>
                    <p className="text-body-2-regular text-text-secondary">
                      Będzie dostępny przy tworzeniu szkoleń i ich tłumaczeń.
                    </p>
                  </div>
                  <LanguageForm />
                </section>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

export function CourseDraftAutoPrepare({ courseId }: { courseId: number }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const prepareDraft = useCallback(async () => {
    setIsPending(true);
    setErrorMessage("");
    try {
      const result = await ensureCourseDraftAction(courseId);
      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }
      router.refresh();
    } catch {
      setErrorMessage("Nie udało się przygotować edytora. Spróbuj ponownie.");
    } finally {
      setIsPending(false);
    }
  }, [courseId, router]);

  useEffect(() => {
    void prepareDraft();
  }, [prepareDraft]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p role={errorMessage ? "alert" : "status"} className={errorMessage ? "text-body-2-medium text-text-error-primary" : "text-body-2-regular text-text-secondary"}>
        {errorMessage || (isPending ? "Przygotowujemy edytor…" : "Edytor jest gotowy.")}
      </p>
      {errorMessage ? (
        <Button type="button" variant="secondary" size="small" onClick={() => void prepareDraft()} disabled={isPending}>
          Spróbuj ponownie
        </Button>
      ) : null}
    </div>
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
