"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { RiDeleteBin6Line, RiImageAddLine, RiLoader4Line } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { createAcademyBrowserClient } from "@/lib/supabase/browser";
import { cx } from "@/utils/cx";

const bucketName = "academy-content-images";
const maxFileSize = 5 * 1024 * 1024;
const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function TrainingImageUpload({
  scopePrefix,
  initialPath,
  initialUrl,
  disabled,
  label,
  onDirtyChange,
}: {
  scopePrefix: string;
  initialPath?: string | null;
  initialUrl?: string | null;
  disabled: boolean;
  label: string;
  onDirtyChange?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagePath, setImagePath] = useState(initialPath ?? "");
  const [previewUrl, setPreviewUrl] = useState(initialUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputId = `training-image-${scopePrefix.replace(/[^a-zA-Z0-9]/g, "-")}`;

  async function upload(file: File) {
    if (disabled) return;
    setMessage("");
    const extension = extensionByType[file.type];
    if (!extension) {
      setMessage("Wybierz plik JPG, PNG albo WebP.");
      return;
    }
    if (file.size > maxFileSize) {
      setMessage("Plik może mieć maksymalnie 5 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const client = createAcademyBrowserClient();
      const objectPath = `${scopePrefix}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await client.storage.from(bucketName).upload(objectPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data, error: urlError } = await client.storage.from(bucketName).createSignedUrl(objectPath, 3600);
      if (urlError || !data?.signedUrl) throw urlError ?? new Error("Nie udało się przygotować podglądu.");
      setImagePath(objectPath);
      setPreviewUrl(data.signedUrl);
      setMessage("Grafika jest gotowa. Zapisz formularz, aby dodać ją do treści.");
      onDirtyChange?.();
    } catch {
      setMessage("Nie udało się wgrać grafiki. Sprawdź połączenie i spróbuj ponownie.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) void upload(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="image_path" value={imagePath} />
      {!disabled ? (
        <input
          ref={inputRef}
          id={fileInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isUploading}
          onChange={onInputChange}
          className="sr-only"
        />
      ) : null}
      <p className="text-body-2-medium text-text-primary">Grafika: {label}</p>
      {previewUrl ? (
        <div className="overflow-hidden rounded-2xl border border-separator-border bg-background-secondary-default">
          <div
            role="img"
            aria-label={`Podgląd: ${label}`}
            className="aspect-[16/7] bg-cover bg-center"
            style={{ backgroundImage: `url("${previewUrl}")` }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-separator-border p-3">
            {disabled ? (
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <p className="text-caption-1-regular text-text-tertiary">Przygotowujemy kopię do edycji.</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-body-2-medium text-text-primary transition-colors hover:bg-background-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring disabled:opacity-50"
                >
                  <RiImageAddLine className="size-4" aria-hidden="true" />
                  Zmień grafikę
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => {
                    setImagePath("");
                    setPreviewUrl("");
                    setMessage("Grafika zostanie usunięta z treści po zapisaniu formularza.");
                    onDirtyChange?.();
                  }}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-body-2-medium text-text-secondary transition-colors hover:bg-background-secondary-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring disabled:opacity-50"
                >
                  <RiDeleteBin6Line className="size-4" aria-hidden="true" />
                  Usuń
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        disabled ? (
          <div className="flex aspect-[16/7] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-separator-border bg-background-secondary-default px-4 text-center">
            <RiImageAddLine className="size-7 text-text-tertiary" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-body-2-medium text-text-primary">Grafika będzie dostępna do zmiany za chwilę</p>
              <p className="text-caption-1-regular text-text-tertiary">Przygotowujemy kopię szkolenia do edycji.</p>
            </div>
          </div>
        ) : (
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
            }}
            onDrop={onDrop}
            className={cx(
              "rounded-2xl border border-dashed transition-colors",
              isDragging ? "border-accent-500 bg-accent-50" : "border-separator-border bg-background-secondary-default",
            )}
          >
            <label
              htmlFor={fileInputId}
              className={cx(
                "flex aspect-[16/7] cursor-pointer flex-col items-center justify-center gap-2 px-4 text-center text-text-secondary focus-within:ring-2 focus-within:ring-border-focus-ring",
                isUploading && "cursor-wait",
              )}
            >
              {isUploading ? (
                <RiLoader4Line className="size-7 animate-spin text-accent-600" aria-hidden="true" />
              ) : (
                <RiImageAddLine className="size-7 text-accent-600" aria-hidden="true" />
              )}
              <span className="text-body-2-medium text-text-primary">
                {isUploading ? "Wgrywanie grafiki…" : "Przeciągnij grafikę tutaj lub wybierz plik"}
              </span>
              <span className="text-caption-1-regular text-text-tertiary">JPG, PNG lub WebP · maks. 5 MB</span>
            </label>
          </div>
        )
      )}
      <p className="min-h-5 text-caption-1-regular text-text-secondary" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
