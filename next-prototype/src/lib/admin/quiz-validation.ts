export type QuizEditorOption = {
  option_id: number | null;
  label: string;
  is_correct: boolean;
};

export type QuizEditorQuestion = {
  question_id: number | null;
  prompt: string;
  options: QuizEditorOption[];
};

export type QuizEditorContent = QuizEditorQuestion[];

export type QuizContentValidation =
  | { ok: true; value: QuizEditorContent }
  | { ok: false; error: string };

function readId(value: unknown): number | null | undefined {
  if (value === null) return null;
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function parseQuizEditorContent(value: unknown): QuizContentValidation {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) {
    return { ok: false, error: "Quiz musi zawierać od 1 do 100 pytań." };
  }

  const questionIds = new Set<number>();
  const parsedQuestions: QuizEditorContent = [];

  for (const question of value) {
    if (!question || typeof question !== "object" || Array.isArray(question)) {
      return { ok: false, error: "Nieprawidłowa treść pytania." };
    }
    const record = question as Record<string, unknown>;
    const questionId = readId(record.question_id);
    const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
    if (questionId === undefined || prompt.length < 1 || prompt.length > 1000 || !Array.isArray(record.options)) {
      return { ok: false, error: "Każde pytanie musi mieć prawidłowy tekst." };
    }
    if (questionId !== null) {
      if (questionIds.has(questionId)) return { ok: false, error: "Pytanie występuje więcej niż raz." };
      questionIds.add(questionId);
    }
    if (record.options.length < 2 || record.options.length > 6) {
      return { ok: false, error: "Każde pytanie musi mieć od 2 do 6 odpowiedzi." };
    }

    const optionIds = new Set<number>();
    const options: QuizEditorOption[] = [];
    for (const option of record.options) {
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        return { ok: false, error: "Nieprawidłowa odpowiedź." };
      }
      const optionRecord = option as Record<string, unknown>;
      const optionId = readId(optionRecord.option_id);
      const label = typeof optionRecord.label === "string" ? optionRecord.label.trim() : "";
      if (optionId === undefined || label.length < 1 || label.length > 500 || typeof optionRecord.is_correct !== "boolean") {
        return { ok: false, error: "Każda odpowiedź musi mieć prawidłowy tekst." };
      }
      if (optionId !== null) {
        if (optionIds.has(optionId)) return { ok: false, error: "Odpowiedź występuje więcej niż raz." };
        optionIds.add(optionId);
      }
      options.push({ option_id: optionId, label, is_correct: optionRecord.is_correct });
    }

    parsedQuestions.push({ question_id: questionId, prompt, options });
  }

  return { ok: true, value: parsedQuestions };
}
