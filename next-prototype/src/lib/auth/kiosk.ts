export function isAcademyKioskAutoLoginEnabled() {
  return process.env.ACADEMY_KIOSK_AUTO_LOGIN === "true";
}
