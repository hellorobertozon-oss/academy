"use client";

import { useActionState } from "react";
import { useAcademy } from "@/components/academy-provider";
import { Button } from "@/components/base/buttons/button";
import { INITIAL_ADMIN_ACTION_STATE } from "@/lib/admin/action-state";
import { updateLeaderboardVisibilityAction } from "@/app/admin/leaderboard-actions";

export function LeaderboardVisibilityForm({ enabled }: { enabled: boolean | null }) {
  const { t } = useAcademy();
  const [state, formAction, isPending] = useActionState(
    updateLeaderboardVisibilityAction,
    INITIAL_ADMIN_ACTION_STATE,
  );
  const statusMessage = enabled === null
    ? t("adminLeaderboardUnavailable")
    : enabled
      ? t("adminLeaderboardEnabled")
      : t("adminLeaderboardDisabled");

  return (
    <section
      className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6"
      aria-labelledby="leaderboard-settings-title"
    >
      <div className="flex flex-col gap-1">
        <h2 id="leaderboard-settings-title" className="text-title-3-semibold text-text-primary">
          {t("adminLeaderboardTitle")}
        </h2>
        <p className="text-body-2-regular text-text-secondary">
          {t("adminLeaderboardDescription")}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-body-medium text-text-secondary" role="status" aria-live="polite">
          {statusMessage}
        </p>
        <form action={formAction}>
          <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
          <Button
            type="submit"
            variant={enabled ? "secondary" : "primary"}
            disabled={enabled === null || isPending}
          >
            {isPending
              ? t("adminLeaderboardSaving")
              : enabled
                ? t("adminLeaderboardHide")
                : t("adminLeaderboardShow")}
          </Button>
        </form>
      </div>
      {state.status !== "idle" ? (
        <p
          className={state.status === "error" ? "text-body-2-medium text-text-error-primary" : "text-body-2-medium text-text-secondary"}
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {state.status === "error" ? t("adminLeaderboardSaveError") : t("adminLeaderboardSaved")}
        </p>
      ) : null}
    </section>
  );
}
