import "server-only";

import { createElement } from "react";
import { Resend } from "resend";
import { AcademyInvitationEmail } from "@/emails/academy-invitation";
import type { InviteLanguage } from "@/lib/admin/validation";
import { getInvitationEmailCopy } from "@/lib/email/invitation-copy";

export type InvitationEmailResult =
  | { ok: true }
  | { ok: false; reason: "configuration" | "provider" };

export function isAcademyEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.RESEND_FROM_EMAIL?.trim(),
  );
}

export async function sendAcademyInvitationEmail(input: {
  to: string;
  actionLink: string;
  language: InviteLanguage;
}): Promise<InvitationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return { ok: false, reason: "configuration" };

  try {
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from,
      to: [input.to],
      subject: getInvitationEmailCopy(input.language).subject,
      react: createElement(AcademyInvitationEmail, {
        actionLink: input.actionLink,
        language: input.language,
      }),
    });

    return sendError ? { ok: false, reason: "provider" } : { ok: true };
  } catch {
    return { ok: false, reason: "provider" };
  }
}
