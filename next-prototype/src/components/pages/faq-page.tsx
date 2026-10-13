"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiChat3Fill,
  RiChat3Line,
  RiHeartFill,
  RiHeartLine,
  type RemixiconComponentType,
} from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Textarea } from "@/components/base/textarea/textarea";
import { useAcademy, type CopyKey } from "@/components/academy-provider";
import { backActionClassName, RouteButton } from "@/components/route-button";
import { cx } from "@/utils/cx";

type Category = "productsCategory" | "useCategory" | "salesCategory";
type Comment = { author: string; body: string };
type CrossfadeIconProps = {
  active: boolean;
  animate: boolean;
  lineIcon: RemixiconComponentType;
  fillIcon: RemixiconComponentType;
};

function CrossfadeIcon({
  active,
  animate,
  lineIcon: LineIcon,
  fillIcon: FillIcon,
}: CrossfadeIconProps) {
  const shared = cx(
    "absolute inset-0 size-full",
    animate
      ? "transition-opacity duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-safe:transition-[opacity,transform,filter] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.2,0,0,1)]"
      : "transition-none",
  );

  return (
    <span aria-hidden="true" className="relative inline-grid size-6 shrink-0 place-items-center">
      <LineIcon
        className={cx(
          shared,
          active
            ? "opacity-0 motion-safe:scale-[0.25] motion-safe:blur-[4px]"
            : "opacity-100 motion-safe:scale-100 motion-safe:blur-0",
        )}
      />
      <FillIcon
        className={cx(
          shared,
          active
            ? "opacity-100 motion-safe:scale-100 motion-safe:blur-0"
            : "opacity-0 motion-safe:scale-[0.25] motion-safe:blur-[4px]",
        )}
      />
    </span>
  );
}

type Question = {
  id: number;
  author: string;
  store: string;
  category: Category;
  title: string;
  titleKey?: CopyKey;
  answer?: string;
  answerKey?: CopyKey;
  likes: number;
  comments: Comment[];
};

const initialQuestions: Question[] = [
  {
    id: 1,
    author: "Anna",
    store: "Moto Centrum",
    category: "useCategory",
    title: "",
    titleKey: "sampleQuestionOne",
    answerKey: "sampleQuestionOneAnswer",
    likes: 18,
    comments: [{ author: "Marek", body: "sample" }],
  },
  {
    id: 2,
    author: "Michał",
    store: "Moto Sklep",
    category: "productsCategory",
    title: "",
    titleKey: "sampleQuestionTwo",
    answerKey: "sampleQuestionTwoAnswer",
    likes: 11,
    comments: [],
  },
];

export function FAQPage({ previewMode = false }: { previewMode?: boolean }) {
  const { t } = useAcademy();
  const [questions, setQuestions] = useState(initialQuestions);
  const [likedQuestions, setLikedQuestions] = useState<Set<number>>(() => new Set());
  const [expandedComments, setExpandedComments] = useState<Set<number>>(() => new Set());
  const [pointerAnimatedQuestionId, setPointerAnimatedQuestionId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notice, setNotice] = useState("");

  function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("question") ?? "").trim();
    if (!title) return;

    setQuestions((current) => [{
      id: Date.now(),
      author: "Karol",
      store: "",
      category: "productsCategory",
      title,
      likes: 0,
      comments: [],
    }, ...current]);
    setIsFormOpen(false);
    setNotice(t("questionAdded"));
    event.currentTarget.reset();
  }

  function addComment(event: FormEvent<HTMLFormElement>, questionId: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = String(data.get("comment") ?? "").trim();
    if (!body) return;
    setQuestions((current) => current.map((question) => question.id === questionId
      ? { ...question, comments: [...question.comments, { author: "Karol", body }] }
      : question));
    form.reset();
  }

  function toggleQuestionLike(questionId: number) {
    setLikedQuestions((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  function toggleComments(questionId: number) {
    setExpandedComments((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  return (
    <div className="relative isolate min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <div className="pointer-events-none absolute inset-x-0 top-28 z-0 h-96 overflow-hidden sm:top-20" aria-hidden="true">
          <Image
            src="/assets/main-faq-v3.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background-full/20 via-background-full/60 to-background-full" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <RouteButton href={previewMode ? "/admin/user-preview" : "/dashboard"} size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className={cx(backActionClassName, "mb-8")}>
          {t("backToDashboard")}
        </RouteButton>

        <header className="max-w-4xl">
          <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">{t("community")}</p>
          <h1 className="mt-2 font-display text-display-2-regular uppercase tracking-wide text-text-primary">{t("questionsTitle")}</h1>
          <p className="mt-3 max-w-2xl text-headline-regular text-text-secondary sm:text-title-3-regular">{t("questionsIntro")}</p>
        </header>

        <section className="mt-10" aria-labelledby="seller-questions-heading">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="seller-questions-heading" className="text-title-2-medium text-text-primary">{t("sellerQuestions")}</h2>
              <p className="mt-1 text-body-2-regular text-text-secondary">{t("sellerQuestionsDescription")}</p>
            </div>
            <Button className="rounded-full" size="large" leadingIcon={RiAddLine} onClick={() => setIsFormOpen((open) => !open)}>
              {t("askQuestion")}
            </Button>
          </div>

          {isFormOpen ? (
            <form onSubmit={addQuestion} className="mb-5 flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-7">
              <h3 className="text-title-3-semibold text-text-primary">{t("newQuestion")}</h3>
              <Textarea name="question" label={t("question")} placeholder={t("questionPlaceholder")} fieldClassName="rounded-2xl" rows={4} isRequired />
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button className="rounded-full" size="large" variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>{t("cancel")}</Button>
                <Button className="rounded-full" size="large" type="submit" trailingIcon={RiArrowRightLine}>{t("publishQuestion")}</Button>
              </div>
            </form>
          ) : null}

          {notice ? <p className="mb-3 text-body-2-regular text-accent-300" role="status">{notice}</p> : null}

          <div className="grid gap-5">
            {questions.map((question) => {
              const title = question.titleKey ? t(question.titleKey) : question.title;
              const answer = question.answerKey ? t(question.answerKey) : question.answer;
              const isLiked = likedQuestions.has(question.id);
              const likeCount = question.likes + (isLiked ? 1 : 0);
              const areCommentsExpanded = expandedComments.has(question.id);
              return (
                <article key={question.id} className="rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        {question.author ? <p className="text-body-medium text-text-primary">{question.author}</p> : null}
                        {question.store ? <p className="text-caption-1-regular text-text-tertiary">{question.store}</p> : null}
                    </div>
                    <span className="text-caption-1-regular text-text-tertiary">{t("questionDateMock")}</span>
                  </div>

                  <h3 className="mt-6 text-title-2-medium text-text-primary">{title}</h3>

                  {answer ? (
                    <div className="mt-5 rounded-2xl border border-accent-300/50 bg-accent-300/15 p-4 sm:p-5">
                      <p className="text-caption-1-semibold uppercase tracking-wide text-accent-300">
                        {t("officialAnswer")}
                      </p>
                      <p className="mt-3 text-body-regular text-text-secondary">{answer}</p>
                    </div>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-separator-border bg-background-secondary-default p-4 text-body-regular text-text-secondary">{t("waitingAnswer")}</p>
                  )}

                  <div className="mt-5 flex items-center justify-start gap-2 border-t border-separator-border pt-3">
                    <Button
                      size="medium"
                      variant="ghost"
                      className={cx("rounded-full bg-transparent", isLiked ? "text-accent-300" : "text-text-secondary")}
                      aria-label={`${t(isLiked ? "unlikeQuestion" : "likeQuestion")}: ${likeCount}`}
                      aria-pressed={isLiked}
                      onClick={(event) => {
                        setPointerAnimatedQuestionId(event.detail > 0 ? question.id : null);
                        toggleQuestionLike(question.id);
                      }}
                    >
                      <span className="inline-flex items-center gap-4">
                        <CrossfadeIcon
                          active={isLiked}
                          animate={pointerAnimatedQuestionId === question.id}
                          lineIcon={RiHeartLine}
                          fillIcon={RiHeartFill}
                        />
                        <span className="inline-flex items-center gap-2">
                          <span>{t("likeAction")}</span>
                          <Badge className="min-w-5 rounded-full bg-background-tertiary-default px-1.5 py-0.5 text-caption-2-semibold tabular-nums text-text-secondary">
                            {likeCount}
                          </Badge>
                        </span>
                      </span>
                    </Button>
                    <Button
                      size="medium"
                      variant="ghost"
                      className={cx("rounded-full bg-transparent", areCommentsExpanded ? "text-accent-300" : "text-text-secondary")}
                      aria-label={`${t(areCommentsExpanded ? "hideComments" : "showComments")}: ${question.comments.length}`}
                      aria-expanded={areCommentsExpanded}
                      aria-controls={`comments-${question.id}`}
                      onClick={(event) => {
                        setPointerAnimatedQuestionId(event.detail > 0 ? question.id : null);
                        toggleComments(question.id);
                      }}
                    >
                      <span className="inline-flex items-center gap-4">
                        <CrossfadeIcon
                          active={areCommentsExpanded}
                          animate={pointerAnimatedQuestionId === question.id}
                          lineIcon={RiChat3Line}
                          fillIcon={RiChat3Fill}
                        />
                        <span className="inline-flex items-center gap-2">
                          <span>{t("comments")}</span>
                          <Badge className="min-w-5 rounded-full bg-background-tertiary-default px-1.5 py-0.5 text-caption-2-semibold tabular-nums text-text-secondary">
                            {question.comments.length}
                          </Badge>
                        </span>
                      </span>
                    </Button>
                  </div>
                  {areCommentsExpanded ? (
                    <div id={`comments-${question.id}`} className="mt-4">
                      {question.comments.length ? (
                        <ul className="grid gap-3">
                          {question.comments.map((comment, index) => (
                            <li key={`${comment.author}-${index}`} className="rounded-2xl bg-background-secondary-default p-3">
                              <p className="text-caption-1-semibold text-text-primary">{comment.author}</p>
                              <p className="mt-1 text-body-regular text-text-secondary">{comment.body === "sample" ? t("sampleComment") : comment.body}</p>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <form onSubmit={(event) => addComment(event, question.id)} className={cx("flex items-end gap-2", question.comments.length > 0 && "mt-4 border-t border-separator-border pt-4")}>
                        <Input name="comment" label={t("addComment")} placeholder={t("commentPlaceholder")} fieldClassName="rounded-full" className="min-w-0 flex-1" />
                        <Button className="rounded-full" type="submit">{t("send")}</Button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          <p className="mt-5 text-center text-caption-1-regular text-text-tertiary">{t("demoNote")}</p>
        </section>
      </main>
    </div>
  );
}
