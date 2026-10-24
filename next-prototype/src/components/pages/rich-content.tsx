import Image from "next/image";
import type { ReactNode } from "react";
import { sanitizeTiptapDocument } from "@/lib/admin/content-validation";

type RichNode = {
  type: string;
  text?: string;
  content?: RichNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
};

function renderText(node: RichNode, key: string): ReactNode {
  let content: ReactNode = node.text ?? "";

  for (const [index, mark] of (node.marks ?? []).entries()) {
    const markKey = `${key}-mark-${index}`;
    switch (mark.type) {
      case "bold":
        content = <strong key={markKey}>{content}</strong>;
        break;
      case "italic":
        content = <em key={markKey}>{content}</em>;
        break;
      case "strike":
        content = <s key={markKey}>{content}</s>;
        break;
      case "underline":
        content = <u key={markKey}>{content}</u>;
        break;
      case "code":
        content = <code key={markKey} className="rounded-md bg-background-secondary-default px-1.5 py-0.5 text-title-3-medium">{content}</code>;
        break;
      case "link": {
        const href = mark.attrs?.href;
        if (typeof href === "string" && (href.startsWith("https:") || href.startsWith("mailto:"))) {
          content = <a key={markKey} href={href} className="text-accent-300 underline decoration-accent-400 underline-offset-4">{content}</a>;
        }
        break;
      }
      default:
        break;
    }
  }

  return <span key={key}>{content}</span>;
}

function renderNode(node: RichNode, key: string): ReactNode {
  if (node.type === "text") return renderText(node, key);
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "horizontalRule") return <hr key={key} className="border-separator-border" />;

  if (node.type === "image") {
    const src = node.attrs?.src;
    if (typeof src !== "string" || !src.startsWith("https:")) return null;
    const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
    const title = typeof node.attrs?.title === "string" ? node.attrs.title : "";
    return (
      <figure key={key} className="flex flex-col gap-2">
        <Image src={src} alt={alt} width={1200} height={675} unoptimized className="h-auto max-w-full rounded-2xl" />
        {title ? <figcaption className="text-caption-1-regular text-text-secondary">{title}</figcaption> : null}
      </figure>
    );
  }

  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`));
  switch (node.type) {
    case "paragraph":
      return <p key={key} className="whitespace-pre-wrap text-title-3-regular text-text-primary">{children}</p>;
    case "heading":
      return node.attrs?.level === 3
        ? <h3 key={key} className="text-title-2-semibold text-text-primary">{children}</h3>
        : <h2 key={key} className="text-title-1-medium text-text-primary">{children}</h2>;
    case "blockquote":
      return <blockquote key={key} className="border-s-2 border-accent-300 ps-4 text-title-3-regular italic text-text-secondary">{children}</blockquote>;
    case "bulletList":
      return <ul key={key} className="list-disc space-y-2 ps-6 text-title-3-regular text-text-primary">{children}</ul>;
    case "orderedList":
      return <ol key={key} className="list-decimal space-y-2 ps-6 text-title-3-regular text-text-primary">{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    default:
      return null;
  }
}

export function RichContent({ content, unavailableMessage }: { content: unknown; unavailableMessage: string }) {
  const result = sanitizeTiptapDocument(content);
  if (!result.ok) {
    return <p role="alert" className="text-body-regular text-text-error-primary">{unavailableMessage}</p>;
  }

  const nodes = result.value.content as RichNode[];
  if (!nodes.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {nodes.map((node, index) => renderNode(node, `content-${index}`))}
    </div>
  );
}
