import { Avatar } from "@/components/base/avatar/avatar";
import { RichContent } from "@/components/pages/rich-content";
import type { LessonConversationMessage } from "@/lib/admin/content-validation";
import { cx } from "@/utils/cx";

const participants = {
  client: { label: "Klient", avatar: "/avatars/avatar-dialog-client.png" },
  seller: { label: "Sprzedawca", avatar: "/avatars/avatar-dialog-seller.png" },
} as const;

export function LessonContentSections({
  content,
  productBullets,
  keyPointsTitle,
  conversationTitle,
  conversation,
  unavailableMessage,
}: {
  content: unknown;
  productBullets: string[];
  keyPointsTitle: string;
  conversationTitle: string;
  conversation: LessonConversationMessage[];
  unavailableMessage: string;
}) {
  const visibleBullets = productBullets.filter((bullet) => bullet.trim());

  return (
    <article className="flex flex-col gap-6">
      {visibleBullets.length ? (
        <section className="flex flex-col gap-4 border-b border-separator-border pb-6" aria-labelledby="lesson-key-points-heading">
          <h2 id="lesson-key-points-heading" className="text-title-1-medium text-text-primary">
            {keyPointsTitle || "Warto zapamiętać"}
          </h2>
          <ul className="flex flex-col gap-3">
            {visibleBullets.map((bullet, index) => (
              <li key={`${index}-${bullet}`} className="flex items-start gap-3">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-accent-300" aria-hidden="true" />
                <span className="text-title-3-regular text-text-primary">{bullet}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RichContent content={content} unavailableMessage={unavailableMessage} />

      {conversation.length ? (
        <section className="flex flex-col gap-4 border-t border-separator-border pt-6" aria-labelledby="lesson-conversation-heading">
          <h2 id="lesson-conversation-heading" className="text-title-1-medium text-text-primary">
            {conversationTitle || "Rozmowa z klientem"}
          </h2>
          <ol className="flex flex-col gap-4">
            {conversation.map((message, index) => {
              const participant = participants[message.speaker];
              const isSeller = message.speaker === "seller";

              return (
                <li
                  key={`${index}-${message.speaker}`}
                  className={cx("flex items-end gap-3", isSeller ? "justify-end" : "justify-start")}
                >
                  {!isSeller ? <Avatar size="lg" src={participant.avatar} alt="" className="border border-separator-border" /> : null}
                  <div className={cx("flex min-w-0 max-w-2xl flex-col gap-1", isSeller && "items-end")}>
                    <p
                      className={cx(
                        "max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-title-3-regular",
                        isSeller
                          ? "rounded-ee-md bg-accent-300 text-neutral-950"
                          : "rounded-es-md bg-background-secondary-default text-text-primary",
                      )}
                    >
                      {message.text}
                    </p>
                    <span className="px-1 text-caption-1-semibold text-text-tertiary">{participant.label}</span>
                  </div>
                  {isSeller ? <Avatar size="lg" src={participant.avatar} alt="" className="border border-separator-border" /> : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </article>
  );
}
