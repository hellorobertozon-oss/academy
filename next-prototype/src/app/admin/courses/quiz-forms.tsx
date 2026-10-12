"use client";

import { useActionState, useState } from "react";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/lib/admin/action-state";
import type { QuizEditorContent, QuizEditorQuestion } from "@/lib/admin/quiz-validation";
import { createQuizAction, saveQuizContentAction } from "@/app/admin/courses/quiz-actions";
import type { LanguageOption } from "@/app/admin/courses/course-forms";

export type AdminQuiz = {
  id: number;
  course_version_id: number;
  module_id: number | null;
  lesson_id: number | null;
  pass_percentage: number;
  translations: Array<{ language_code: string; title: string; instructions: string }>;
  questions: Array<{
    id: number;
    sort_order: number;
    translations: Array<{ language_code: string; prompt: string }>;
    options: Array<{
      id: number;
      sort_order: number;
      is_correct: boolean;
      translations: Array<{ language_code: string; label: string }>;
    }>;
  }>;
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

function QuizLanguageChooser({
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
      aria-label="Język quizu"
      selectedKey={selected || null}
      onSelectionChange={(key) => onChange(String(key))}
    >
      {languages.map((language) => (
        <SelectItem key={language.code} id={language.code}>
          {language.native_name} · {language.code.toUpperCase()}
        </SelectItem>
      ))}
    </Select>
  );
}

function newQuestion(): QuizEditorQuestion {
  return {
    question_id: null,
    prompt: "",
    options: [
      { option_id: null, label: "", is_correct: true },
      { option_id: null, label: "", is_correct: false },
    ],
  };
}

export function QuizTargetPanel({
  courseVersionId,
  targetType,
  targetId,
  languages,
  defaultLanguage,
  quiz,
  disabled,
}: {
  courseVersionId: number;
  targetType: "module" | "lesson";
  targetId: number;
  languages: LanguageOption[];
  defaultLanguage: string;
  quiz?: AdminQuiz;
  disabled: boolean;
}) {
  if (!quiz) {
    if (disabled) return <p className="text-body-2-regular text-text-secondary">Brak quizu w tym wydaniu.</p>;
    return <CreateQuizForm courseVersionId={courseVersionId} targetType={targetType} targetId={targetId} />;
  }

  const title = quiz.translations.find((translation) => translation.language_code === defaultLanguage)?.title;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="neutral">Próg zaliczenia: {quiz.pass_percentage}%</Badge>
        <Badge color="neutral">{quiz.questions.length} pytań</Badge>
        {title ? <span className="text-body-2-regular text-text-secondary">{title}</span> : null}
      </div>
      <QuizTranslationPanel
        quiz={quiz}
        languages={languages.filter((language) => language.is_active)}
        defaultLanguage={defaultLanguage}
        disabled={disabled}
      />
    </div>
  );
}

function CreateQuizForm({
  courseVersionId,
  targetType,
  targetId,
}: {
  courseVersionId: number;
  targetType: "module" | "lesson";
  targetId: number;
}) {
  const [state, action, isPending] = useActionState(createQuizAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <input type="hidden" name="course_version_id" value={courseVersionId} />
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <p className="text-body-2-regular text-text-secondary">Quiz wymaga co najmniej jednego pytania i dwóch odpowiedzi.</p>
      <Button type="submit" variant="secondary" leadingIcon={RiAddLine} disabled={isPending}>
        {isPending ? "Dodawanie..." : "Dodaj quiz"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

function QuizTranslationPanel({
  quiz,
  languages,
  defaultLanguage,
  disabled,
}: {
  quiz: AdminQuiz;
  languages: LanguageOption[];
  defaultLanguage: string;
  disabled: boolean;
}) {
  const [languageCode, setLanguageCode] = useState(defaultLanguage || languages[0]?.code || "");
  const language = languages.find((option) => option.code === languageCode);
  const translation = quiz.translations.find((item) => item.language_code === languageCode);
  const questions: QuizEditorContent = quiz.questions.map((question) => ({
    question_id: question.id,
    prompt: question.translations.find((item) => item.language_code === languageCode)?.prompt ?? "",
    options: question.options.map((option) => ({
      option_id: option.id,
      label: option.translations.find((item) => item.language_code === languageCode)?.label ?? "",
      is_correct: option.is_correct,
    })),
  }));
  if (!language) return <p className="text-body-2-regular text-text-secondary">Dodaj aktywny język, aby edytować quiz.</p>;

  return (
    <div className="flex flex-col gap-3">
      <QuizLanguageChooser languages={languages} selected={languageCode} onChange={setLanguageCode} />
      <QuizTranslationEditor
        key={`${quiz.id}:${languageCode}`}
        quizId={quiz.id}
        languageCode={languageCode}
        isDefaultLanguage={languageCode === defaultLanguage}
        title={translation?.title ?? ""}
        instructions={translation?.instructions ?? ""}
        initialQuestions={questions}
        disabled={disabled}
      />
    </div>
  );
}

function QuizTranslationEditor({
  quizId,
  languageCode,
  isDefaultLanguage,
  title,
  instructions,
  initialQuestions,
  disabled,
}: {
  quizId: number;
  languageCode: string;
  isDefaultLanguage: boolean;
  title: string;
  instructions: string;
  initialQuestions: QuizEditorContent;
  disabled: boolean;
}) {
  const [state, action, isPending] = useActionState(saveQuizContentAction, INITIAL_ADMIN_ACTION_STATE);
  const [questions, setQuestions] = useState<QuizEditorContent>(
    initialQuestions.length ? initialQuestions : isDefaultLanguage ? [newQuestion()] : [],
  );

  function updateQuestion(index: number, updater: (question: QuizEditorQuestion) => QuizEditorQuestion) {
    setQuestions((current) => current.map((question, currentIndex) => currentIndex === index ? updater(question) : question));
  }

  function updateOption(questionIndex: number, optionIndex: number, updater: (option: QuizEditorQuestion["options"][number]) => QuizEditorQuestion["options"][number]) {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: question.options.map((option, currentIndex) => currentIndex === optionIndex ? updater(option) : option),
    }));
  }

  function chooseCorrect(questionIndex: number, optionIndex: number) {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: question.options.map((option, currentIndex) => ({ ...option, is_correct: currentIndex === optionIndex })),
    }));
  }

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-separator-border p-4">
      <input type="hidden" name="quiz_id" value={quizId} />
      <input type="hidden" name="language_code" value={languageCode} />
      <input type="hidden" name="questions_json" value={JSON.stringify(questions)} readOnly />
      <Input name="title" label="Tytuł quizu" defaultValue={title} isRequired maxLength={160} isDisabled={disabled} />
      <Textarea name="instructions" label="Instrukcja dla pracownika" defaultValue={instructions} rows={2} maxLength={2000} isDisabled={disabled} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-title-3-semibold text-text-primary">Pytania i odpowiedzi</h3>
          {isDefaultLanguage && !disabled ? (
            <Button type="button" size="small" variant="secondary" leadingIcon={RiAddLine} onClick={() => setQuestions((current) => [...current, newQuestion()])}>
              Dodaj pytanie
            </Button>
          ) : null}
        </div>
        {!questions.length ? (
          <p className="text-body-2-regular text-text-secondary">Najpierw dodaj pytania w języku domyślnym.</p>
        ) : questions.map((question, questionIndex) => (
          <fieldset key={question.question_id ?? `new-${questionIndex}`} className="flex flex-col gap-3 rounded-xl border border-separator-border p-3">
            <div className="flex items-start justify-between gap-3">
              <legend className="text-body-semibold text-text-primary">Pytanie {questionIndex + 1}</legend>
              {isDefaultLanguage && !disabled ? (
                <Button
                  type="button"
                  size="small"
                  variant="ghost"
                  iconOnly
                  leadingIcon={RiDeleteBinLine}
                  aria-label={`Usuń pytanie ${questionIndex + 1}`}
                  disabled={questions.length <= 1}
                  onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))}
                />
              ) : null}
            </div>
            <Textarea
              label={`Treść pytania ${questionIndex + 1}`}
              value={question.prompt}
              onChange={(value) => updateQuestion(questionIndex, (current) => ({ ...current, prompt: value }))}
              rows={2}
              maxLength={1000}
              isRequired
              isDisabled={disabled}
            />
            {question.options.map((option, optionIndex) => (
              <div key={option.option_id ?? `new-option-${questionIndex}-${optionIndex}`} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    label={`Pytanie ${questionIndex + 1}, odpowiedź ${optionIndex + 1}`}
                    value={option.label}
                    onChange={(value) => updateOption(questionIndex, optionIndex, (current) => ({ ...current, label: value }))}
                    maxLength={500}
                    isRequired
                    isDisabled={disabled}
                  />
                  {option.is_correct && !isDefaultLanguage ? <Badge color="primary" className="mt-2">Poprawna odpowiedź</Badge> : null}
                </div>
                {isDefaultLanguage && !disabled ? (
                  <Button
                    type="button"
                    size="small"
                    variant="ghost"
                    iconOnly
                    leadingIcon={RiDeleteBinLine}
                    aria-label={`Usuń odpowiedź ${optionIndex + 1} w pytaniu ${questionIndex + 1}`}
                    disabled={question.options.length <= 2}
                    onClick={() => {
                      const removedCorrect = option.is_correct;
                      updateQuestion(questionIndex, (current) => {
                        const nextOptions = current.options.filter((_, index) => index !== optionIndex);
                        if (removedCorrect && nextOptions.length) {
                          nextOptions[0] = { ...nextOptions[0], is_correct: true };
                        }
                        return { ...current, options: nextOptions };
                      });
                    }}
                  />
                ) : null}
              </div>
            ))}
            {isDefaultLanguage && !disabled && question.options.length < 6 ? (
              <Button
                type="button"
                size="small"
                variant="ghost"
                leadingIcon={RiAddLine}
                className="self-start"
                onClick={() => updateQuestion(questionIndex, (current) => ({
                  ...current,
                  options: [...current.options, { option_id: null, label: "", is_correct: false }],
                }))}
              >
                Dodaj odpowiedź
              </Button>
            ) : null}
            {isDefaultLanguage && !disabled ? (
              <Select
                aria-label={`Poprawna odpowiedź do pytania ${questionIndex + 1}`}
                selectedKey={String(Math.max(question.options.findIndex((option) => option.is_correct), 0))}
                onSelectionChange={(key) => chooseCorrect(questionIndex, Number(key))}
              >
                {question.options.map((option, optionIndex) => (
                  <SelectItem key={String(optionIndex)} id={String(optionIndex)}>
                    Poprawna: {option.label || `Odpowiedź ${optionIndex + 1}`}
                  </SelectItem>
                ))}
              </Select>
            ) : null}
          </fieldset>
        ))}
      </div>

      <ActionMessage state={state} />
      {!disabled ? (
        <Button type="submit" disabled={isPending || !questions.length} className="self-start">
          {isPending ? "Zapisywanie..." : "Zapisz quiz"}
        </Button>
      ) : null}
    </form>
  );
}
