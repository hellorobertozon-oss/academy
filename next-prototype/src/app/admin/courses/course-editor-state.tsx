"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/base/buttons/button";

const leaveWarning = "Masz niezapisane zmiany. Jeśli opuścisz edytor, zostaną utracone. Czy chcesz wyjść?";

type CourseEditorChangesContextValue = {
  setFormDirty: (formId: string, dirty: boolean) => void;
  confirmDiscard: (clearOnAccept?: boolean, message?: string) => boolean;
};

const CourseEditorChangesContext = createContext<CourseEditorChangesContextValue | null>(null);

export function CourseEditorChangesProvider({ children }: { children: ReactNode }) {
  const dirtyForms = useRef(new Set<string>());

  const setFormDirty = useCallback((formId: string, dirty: boolean) => {
    if (dirty) dirtyForms.current.add(formId);
    else dirtyForms.current.delete(formId);
  }, []);

  const clearDirtyForms = useCallback(() => {
    dirtyForms.current.clear();
  }, []);

  const confirmDiscard = useCallback((clearOnAccept = true, message = leaveWarning) => {
    if (!dirtyForms.current.size) return true;
    const accepted = window.confirm(message);
    if (accepted && clearOnAccept) clearDirtyForms();
    return accepted;
  }, [clearDirtyForms]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyForms.current.size) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!dirtyForms.current.size || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

      const destination = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      if (
        destination.origin === current.origin &&
        destination.pathname === current.pathname &&
        destination.search === current.search &&
        destination.hash === current.hash
      ) return;

      if (!confirmDiscard()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [confirmDiscard]);

  const contextValue = useMemo(() => ({ setFormDirty, confirmDiscard }), [confirmDiscard, setFormDirty]);
  return <CourseEditorChangesContext.Provider value={contextValue}>{children}</CourseEditorChangesContext.Provider>;
}

export function useCourseEditorFormDirty(formId: string) {
  const context = useContext(CourseEditorChangesContext);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    context?.setFormDirty(formId, true);
  }, [context, formId]);

  const clearDirty = useCallback(() => {
    setIsDirty(false);
    context?.setFormDirty(formId, false);
  }, [context, formId]);

  useEffect(() => () => context?.setFormDirty(formId, false), [context, formId]);

  return { isDirty, markDirty, clearDirty };
}

export function useConfirmCourseEditorDiscard() {
  const context = useContext(CourseEditorChangesContext);
  return context?.confirmDiscard ?? (() => true);
}

export function CourseEditorSaveBar({
  isDirty,
  isPending,
}: {
  isDirty: boolean;
  isPending: boolean;
}) {
  if (!isDirty) return null;

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-separator-border bg-background-primary-default/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
      <p role="status" className="text-body-2-medium text-text-secondary">
        Niezapisane zmiany
      </p>
      <Button type="submit" size="large" disabled={isPending}>
        {isPending ? "Zapisywanie…" : "Zapisz"}
      </Button>
    </div>
  );
}
