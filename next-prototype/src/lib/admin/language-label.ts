type LanguageLabelInput = {
  code: string;
  native_name: string;
};

export function getNativeLanguageName(language: LanguageLabelInput): string {
  if (language.code.toLowerCase() === "cs" && /[ÄĹ]/u.test(language.native_name)) {
    return "\u010Ce\u0161tina";
  }

  return language.native_name;
}
