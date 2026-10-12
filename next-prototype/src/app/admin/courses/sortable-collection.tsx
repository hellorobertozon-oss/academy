"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { INITIAL_ADMIN_ACTION_STATE } from "@/lib/admin/action-state";
import { reorderLessonsAction, reorderModulesAction } from "@/app/admin/courses/actions";

type SortableItem = {
  id: number;
  title: string;
  content: ReactNode;
};

type SortableKind = "module" | "lesson";

export function SortableCollection({
  kind,
  scopeId,
  items,
  disabled = false,
}: {
  kind: SortableKind;
  scopeId: number;
  items: SortableItem[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function saveOrder(nextItems: SortableItem[]) {
    const previousItems = orderedItems;
    setOrderedItems(nextItems);
    setMessage("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set(kind === "module" ? "version_id" : "module_id", String(scopeId));
      formData.set("item_ids", nextItems.map((item) => item.id).join(","));
      const result = kind === "module"
        ? await reorderModulesAction(INITIAL_ADMIN_ACTION_STATE, formData)
        : await reorderLessonsAction(INITIAL_ADMIN_ACTION_STATE, formData);
      if (result.status === "error") {
        setOrderedItems(previousItems);
        setMessage(result.message);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  function moveItem(fromId: number, toId: number) {
    const fromIndex = orderedItems.findIndex((item) => item.id === fromId);
    const toIndex = orderedItems.findIndex((item) => item.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const nextItems = [...orderedItems];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, moved);
    saveOrder(nextItems);
  }

  return (
    <div className="flex flex-col gap-3" role="list" aria-label={kind === "module" ? "Kolejność modułów" : "Kolejność lekcji"}>
      {orderedItems.map((item, index) => (
        <div
          key={item.id}
          role="listitem"
          className="rounded-2xl border border-separator-border bg-background-primary-default p-3"
          onDragOver={(event) => {
            if (draggedId !== null) event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedId !== null) moveItem(draggedId, item.id);
            setDraggedId(null);
          }}
          onDragEnd={() => setDraggedId(null)}
        >
          <div className="flex items-start gap-3">
            {!disabled ? <div className="flex shrink-0 flex-col items-center gap-1">
              <Button
                type="button"
                size="xs"
                variant="secondary"
                className="cursor-grab active:cursor-grabbing"
                draggable={!isPending}
                aria-label={`Przeciągnij: ${item.title}`}
                onDragStart={(event) => {
                  setDraggedId(item.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(item.id));
                }}
              >
                ⠿
              </Button>
              <span className="text-caption-1-regular text-text-tertiary" aria-hidden="true">{index + 1}</span>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                aria-label={`Przesuń wyżej: ${item.title}`}
                disabled={isPending || index === 0}
                onClick={() => moveItem(item.id, orderedItems[index - 1].id)}
              >↑</Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                aria-label={`Przesuń niżej: ${item.title}`}
                disabled={isPending || index === orderedItems.length - 1}
                onClick={() => moveItem(item.id, orderedItems[index + 1].id)}
              >↓</Button>
            </div> : null}
            <div className="min-w-0 flex-1">{item.content}</div>
          </div>
        </div>
      ))}
      {message ? <p className="text-body-2-regular text-text-secondary" role="status">{message}</p> : null}
    </div>
  );
}
