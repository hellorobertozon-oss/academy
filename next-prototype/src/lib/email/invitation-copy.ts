import type { InviteLanguage } from "../admin/validation";

export const INVITATION_EMAIL_COPY: Record<
  InviteLanguage,
  {
    subject: string;
    preview: string;
    heading: string;
    body: string;
    button: string;
    fallback: string;
  }
> = {
  pl: {
    subject: "Zaproszenie do Xzone Academy",
    preview: "Skonfiguruj dostęp do Xzone Academy.",
    heading: "Zaproszenie do Xzone Academy",
    body: "Administrator utworzył dla Ciebie konto. Potwierdź adres e-mail i ustaw hasło, aby rozpocząć szkolenie.",
    button: "Aktywuj konto",
    fallback: "Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:",
  },
  en: {
    subject: "Your invitation to Xzone Academy",
    preview: "Set up your access to Xzone Academy.",
    heading: "Your Xzone Academy invitation",
    body: "An administrator has created an account for you. Confirm your email address and set a password to start your training.",
    button: "Activate account",
    fallback: "If the button does not work, copy this address into your browser:",
  },
  de: {
    subject: "Deine Einladung zur Xzone Academy",
    preview: "Richte deinen Zugang zur Xzone Academy ein.",
    heading: "Deine Einladung zur Xzone Academy",
    body: "Ein Administrator hat ein Konto für dich erstellt. Bestätige deine E-Mail-Adresse und lege ein Passwort fest, um mit der Schulung zu beginnen.",
    button: "Konto aktivieren",
    fallback: "Falls die Schaltfläche nicht funktioniert, kopiere diese Adresse in deinen Browser:",
  },
  cs: {
    subject: "Pozvánka do Xzone Academy",
    preview: "Nastavte si přístup do Xzone Academy.",
    heading: "Pozvánka do Xzone Academy",
    body: "Administrátor pro vás vytvořil účet. Potvrďte svou e-mailovou adresu a nastavte heslo, abyste mohli začít se školením.",
    button: "Aktivovat účet",
    fallback: "Pokud tlačítko nefunguje, zkopírujte tuto adresu do prohlížeče:",
  },
};

export function getInvitationEmailCopy(language: InviteLanguage) {
  return INVITATION_EMAIL_COPY[language];
}
