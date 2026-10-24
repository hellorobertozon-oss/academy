"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import ImageExtension from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/base/buttons/button";
import type { TiptapDocument } from "@/lib/admin/content-validation";

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: true },
  }),
  ImageExtension.configure({ allowBase64: false }),
];

function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const editorClassName = [
  "min-h-56 rounded-b-xl border border-separator-border bg-background-full p-4 text-body-regular text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
  "[&_h2]:my-4 [&_h2]:text-title-2-semibold [&_h3]:my-3 [&_h3]:text-title-3-semibold",
  "[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6",
  "[&_blockquote]:my-4 [&_blockquote]:border-s-2 [&_blockquote]:border-separator-border [&_blockquote]:ps-4",
  "[&_a]:text-accent-600 [&_a]:underline [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl",
].join(" ");

export function RichTextEditor({
  value,
  onChange,
  editable = true,
}: {
  value: TiptapDocument;
  onChange?: (document: TiptapDocument) => void;
  editable?: boolean;
}) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: value as JSONContent,
    immediatelyRender: false,
    editable,
    editorProps: {
      attributes: {
        class: "min-h-48 w-full cursor-text outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: changedEditor }) => {
      onChange?.(changedEditor.getJSON() as TiptapDocument);
    },
  });

  if (!editor) {
    return <div className="min-h-56 rounded-xl border border-separator-border bg-background-full p-4 text-body-2-regular text-text-secondary">Wczytywanie edytora…</div>;
  }

  return (
    <div className="course-rich-editor flex flex-col">
      {editable ? (
        <div className="flex flex-wrap gap-1 rounded-t-xl border border-separator-border bg-background-secondary-default p-2">
          <Button
            type="button"
            size="small"
            variant={editor.isActive("bold") ? "primary" : "secondary"}
            aria-label="Pogrubienie"
            aria-pressed={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >B</Button>
          <Button
            type="button"
            size="small"
            variant={editor.isActive("italic") ? "primary" : "secondary"}
            aria-label="Kursywa"
            aria-pressed={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          ><i>I</i></Button>
          <Button
            type="button"
            size="small"
            variant={editor.isActive("heading", { level: 2 }) ? "primary" : "secondary"}
            aria-label="Nagłówek drugiego poziomu"
            aria-pressed={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >H2</Button>
          <Button
            type="button"
            size="small"
            variant={editor.isActive("heading", { level: 3 }) ? "primary" : "secondary"}
            aria-label="Nagłówek trzeciego poziomu"
            aria-pressed={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >H3</Button>
          <Button
            type="button"
            size="small"
            variant={editor.isActive("bulletList") ? "primary" : "secondary"}
            aria-label="Lista punktowana"
            aria-pressed={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >• Lista</Button>
          <Button
            type="button"
            size="small"
            variant={editor.isActive("orderedList") ? "primary" : "secondary"}
            aria-label="Lista numerowana"
            aria-pressed={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >1. Lista</Button>
          <Button
            type="button"
            size="small"
            variant={editor.isActive("blockquote") ? "primary" : "secondary"}
            aria-label="Cytat"
            aria-pressed={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >Cytat</Button>
          <Button
            type="button"
            size="small"
            variant={editor.isActive("link") ? "primary" : "secondary"}
            aria-label="Dodaj link"
            onClick={() => {
              const current = editor.getAttributes("link").href as string | undefined;
              const entered = window.prompt("Wklej bezpieczny adres HTTPS.", current ?? "https://");
              if (entered === null) return;
              const href = safeHttpsUrl(entered);
              if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            }}
          >Link</Button>
          <Button
            type="button"
            size="small"
            variant="secondary"
            aria-label="Dodaj obraz z adresu internetowego"
            onClick={() => {
              const entered = window.prompt("Wklej publiczny adres obrazu HTTPS.", "https://");
              if (!entered) return;
              const src = safeHttpsUrl(entered);
              if (src) editor.chain().focus().setImage({ src, alt: "" }).run();
            }}
          >Obraz</Button>
        </div>
      ) : null}
      <EditorContent
        editor={editor}
        aria-label={editable ? "Treść lekcji" : "Podgląd treści lekcji"}
        className={editorClassName}
      />
    </div>
  );
}
