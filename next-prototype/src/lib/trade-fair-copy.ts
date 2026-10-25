import type { AcademyLanguage } from "@/components/academy-provider";

export type TradeFairCopy = {
  staffSettings: string;
  settingsDialog: string;
  kioskSettings: string;
  changeProductEvery: string;
  loopOn: string;
  loopOff: string;
  stopRotation: string;
  startRotation: string;
  password: string;
  invalidPassword: string;
  unlockSettings: string;
  academy: string;
  productPhotos: string;
  photoNumber: (current: number, total: number) => string;
  exploreProducts: string;
  tapToExplore: string;
  previousProducts: string;
  nextProducts: string;
  productDescription: string;
};

export const TRADE_FAIR_COPY: Record<AcademyLanguage, TradeFairCopy> = {
  pl: {
    staffSettings: "Ustawienia obsługi",
    settingsDialog: "Ustawienia prezentacji",
    kioskSettings: "Ustawienia kiosku",
    changeProductEvery: "Zmieniaj produkt co",
    loopOn: "Pętla włączona",
    loopOff: "Pętla wyłączona",
    stopRotation: "Zatrzymaj pokaz",
    startRotation: "Uruchom pokaz",
    password: "Hasło",
    invalidPassword: "Nieprawidłowe hasło",
    unlockSettings: "Odblokuj ustawienia",
    academy: "Akademia",
    productPhotos: "Zdjęcia produktu",
    photoNumber: (current, total) => `Zdjęcie ${current} z ${total}`,
    exploreProducts: "Poznaj produkty",
    tapToExplore: "Dotknij produktu, aby poznać szczegóły",
    previousProducts: "Poprzednie produkty",
    nextProducts: "Następne produkty",
    productDescription: "Opis produktu",
  },
  en: {
    staffSettings: "Staff settings",
    settingsDialog: "Presentation settings",
    kioskSettings: "Kiosk settings",
    changeProductEvery: "Change product every",
    loopOn: "Loop on",
    loopOff: "Loop off",
    stopRotation: "Stop rotation",
    startRotation: "Start rotation",
    password: "Password",
    invalidPassword: "Incorrect password",
    unlockSettings: "Unlock settings",
    academy: "Academy",
    productPhotos: "Product photos",
    photoNumber: (current, total) => `Photo ${current} of ${total}`,
    exploreProducts: "Explore products",
    tapToExplore: "Tap a product to explore it",
    previousProducts: "Previous products",
    nextProducts: "Next products",
    productDescription: "Product description",
  },
  de: {
    staffSettings: "Einstellungen für das Personal",
    settingsDialog: "Präsentationseinstellungen",
    kioskSettings: "Kioskeinstellungen",
    changeProductEvery: "Produkt wechseln alle",
    loopOn: "Endlosschleife ein",
    loopOff: "Endlosschleife aus",
    stopRotation: "Produktwechsel anhalten",
    startRotation: "Produktwechsel starten",
    password: "Passwort",
    invalidPassword: "Falsches Passwort",
    unlockSettings: "Einstellungen entsperren",
    academy: "Academy",
    productPhotos: "Produktfotos",
    photoNumber: (current, total) => `Foto ${current} von ${total}`,
    exploreProducts: "Produkte entdecken",
    tapToExplore: "Produkt antippen, um mehr zu erfahren",
    previousProducts: "Vorherige Produkte",
    nextProducts: "Nächste Produkte",
    productDescription: "Produktbeschreibung",
  },
  cs: {
    staffSettings: "Nastavení obsluhy",
    settingsDialog: "Nastavení prezentace",
    kioskSettings: "Nastavení kiosku",
    changeProductEvery: "Změnit produkt každých",
    loopOn: "Smyčka zapnuta",
    loopOff: "Smyčka vypnuta",
    stopRotation: "Zastavit střídání produktů",
    startRotation: "Spustit střídání produktů",
    password: "Heslo",
    invalidPassword: "Nesprávné heslo",
    unlockSettings: "Odemknout nastavení",
    academy: "Akademie",
    productPhotos: "Fotografie produktu",
    photoNumber: (current, total) => `Fotografie ${current} z ${total}`,
    exploreProducts: "Prohlédněte si produkty",
    tapToExplore: "Klepněte na produkt a prohlédněte si ho",
    previousProducts: "Předchozí produkty",
    nextProducts: "Další produkty",
    productDescription: "Popis produktu",
  },
  fr: {
    staffSettings: "Réglages de l’équipe",
    settingsDialog: "Réglages de la présentation",
    kioskSettings: "Réglages de la borne",
    changeProductEvery: "Changer de produit toutes les",
    loopOn: "Boucle activée",
    loopOff: "Boucle désactivée",
    stopRotation: "Arrêter le défilement",
    startRotation: "Lancer le défilement",
    password: "Mot de passe",
    invalidPassword: "Mot de passe incorrect",
    unlockSettings: "Déverrouiller les réglages",
    academy: "Academy",
    productPhotos: "Photos du produit",
    photoNumber: (current, total) => `Photo ${current} sur ${total}`,
    exploreProducts: "Découvrez les produits",
    tapToExplore: "Touchez un produit pour le découvrir",
    previousProducts: "Produits précédents",
    nextProducts: "Produits suivants",
    productDescription: "Description du produit",
  },
  it: {
    staffSettings: "Impostazioni staff",
    settingsDialog: "Impostazioni della presentazione",
    kioskSettings: "Impostazioni del kiosk",
    changeProductEvery: "Cambia prodotto ogni",
    loopOn: "Ripetizione attiva",
    loopOff: "Ripetizione disattivata",
    stopRotation: "Ferma la rotazione",
    startRotation: "Avvia la rotazione",
    password: "Password",
    invalidPassword: "Password non corretta",
    unlockSettings: "Sblocca le impostazioni",
    academy: "Academy",
    productPhotos: "Foto del prodotto",
    photoNumber: (current, total) => `Foto ${current} di ${total}`,
    exploreProducts: "Scopri i prodotti",
    tapToExplore: "Tocca un prodotto per scoprirlo",
    previousProducts: "Prodotti precedenti",
    nextProducts: "Prodotti successivi",
    productDescription: "Descrizione del prodotto",
  },
};
