(() => {
  const storageKey = "xzone-academy-language";

  function create(translations) {
    const supportedLanguages = Object.keys(translations);
    let language = supportedLanguages[0] || "pl";

    try {
      const savedLanguage = localStorage.getItem(storageKey);
      if (savedLanguage && translations[savedLanguage]) language = savedLanguage;
    } catch {}

    const languageControls = [...document.querySelectorAll("[data-language-control]")];
    const translate = (key) => translations[language]?.[key] ?? translations.pl?.[key] ?? key;

    function closeMenus({ restoreFocus = false } = {}) {
      languageControls.forEach((control) => {
        const button = control.querySelector("[data-language-button]");
        const menu = control.querySelector("[data-language-menu]");
        if (!button || !menu) return;
        const shouldRestoreFocus = restoreFocus && menu.contains(document.activeElement);
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
        if (shouldRestoreFocus) button.focus({ preventScroll: true });
      });
    }

    function apply() {
      const copy = translations[language] || translations.pl || {};
      document.documentElement.lang = language;

      if (copy.pageTitle) document.title = copy.pageTitle;
      if (copy.metaDescription) {
        const description = document.querySelector('meta[name="description"]');
        if (description) description.content = copy.metaDescription;
      }

      document.querySelectorAll("[data-i18n]").forEach((element) => {
        const value = copy[element.dataset.i18n];
        if (value !== undefined) element.textContent = value;
      });
      document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
        const value = copy[element.dataset.i18nAria];
        if (value !== undefined) element.setAttribute("aria-label", value);
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        const value = copy[element.dataset.i18nPlaceholder];
        if (value !== undefined) element.placeholder = value;
      });

      languageControls.forEach((control) => {
        const selectedOption = control.querySelector(`[data-language-option="${language}"]`);
        if (selectedOption) {
          const selectedName = control.querySelector("[data-selected-language-name]");
          const selectedFlag = control.querySelector("[data-selected-language-flag]");
          const optionName = selectedOption.querySelector("[data-language-option-name]") || selectedOption.querySelector("span");
          const optionFlag = selectedOption.querySelector("svg");
          if (selectedName && optionName) selectedName.textContent = optionName.textContent;
          if (selectedFlag && optionFlag) selectedFlag.innerHTML = optionFlag.innerHTML;
        }

        control.querySelectorAll("[data-language-option]").forEach((option) => {
          option.setAttribute("aria-checked", String(option.dataset.languageOption === language));
        });
      });
    }

    function setLanguage(nextLanguage) {
      if (!translations[nextLanguage]) return;
      language = nextLanguage;
      try { localStorage.setItem(storageKey, language); } catch {}
      apply();
      closeMenus({ restoreFocus: true });
      document.dispatchEvent(new CustomEvent("xzone:languagechange", { detail: { language } }));
    }

    languageControls.forEach((control) => {
      const button = control.querySelector("[data-language-button]");
      const menu = control.querySelector("[data-language-menu]");
      if (!button || !menu) return;

      button.addEventListener("click", () => {
        const shouldOpen = menu.hidden;
        closeMenus();
        if (shouldOpen) {
          menu.hidden = false;
          button.setAttribute("aria-expanded", "true");
        }
      });

      control.querySelectorAll("[data-language-option]").forEach((option) => {
        option.addEventListener("click", () => setLanguage(option.dataset.languageOption));
      });
    });

    if (languageControls.length) {
      document.addEventListener("click", (event) => {
        if (!languageControls.some((control) => control.contains(event.target))) closeMenus();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenus({ restoreFocus: true });
      });
    }

    apply();
    return {
      get language() { return language; },
      translate,
      setLanguage
    };
  }

  window.XzoneAcademyI18n = { create };
})();
