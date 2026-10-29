"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  RiArrowRightLine,
  RiSearchLine,
  RiSettings3Line,
} from "@remixicon/react";
import { AcademyLanguagePicker } from "@/components/academy-header";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { InputBase } from "@/components/base/input/input";
import { useAcademy, type AcademyLanguage } from "@/components/academy-provider";
import {
  TRADE_FAIR_PRODUCT_CATEGORIES,
  TRADE_FAIR_PRODUCT_PRICES_EUR,
  TRADE_FAIR_PRODUCT_VIDEOS,
  type TradeFairCatalogCategory,
} from "@/lib/trade-fair-catalog-content";
import { TRADE_FAIR_PRODUCTS, type TradeFairProduct } from "@/lib/trade-fair-products";
import { cx } from "@/utils/cx";
import styles from "./trade-fair-catalog.module.css";

type CategoryId = "all" | TradeFairCatalogCategory;

type CatalogCopy = {
  kicker: string;
  brandSubtitle: string;
  title: string;
  description: string;
  search: string;
  searchLabel: string;
  categoriesLabel: string;
  all: string;
  helmet: string;
  leather: string;
  textile: string;
  accessories: string;
  motorcycle: string;
  offRoad: string;
  openDetails: string;
  details: string;
  productDescription: string;
  videos: string;
  video: string;
  photos: string;
  close: string;
  noResultsTitle: string;
  noResultsDescription: string;
  photo: (current: number, total: number) => string;
};

const CATALOG_COPY: Record<AcademyLanguage, CatalogCopy> = {
  pl: {
    kicker: "Katalog produktów",
    brandSubtitle: "Prezentacja produktów",
    title: "Produkty Xzone",
    description: "Poznaj produkty do pielęgnacji kasku, odzieży i motocykla.",
    search: "Szukaj produktu lub opisu…",
    searchLabel: "Szukaj produktu",
    categoriesLabel: "Kategorie produktów",
    all: "Wszystkie",
    helmet: "Pielęgnacja kasku",
    leather: "Odzież skórzana",
    textile: "Odzież tekstylna",
    accessories: "Akcesoria",
    motorcycle: "Pielęgnacja motocykla",
    offRoad: "Off-road",
    openDetails: "Zobacz szczegóły",
    details: "Szczegóły produktu",
    productDescription: "Opis produktu",
    videos: "Filmy produktowe",
    video: "Film instruktażowy",
    photos: "Zdjęcia produktu",
    close: "Zamknij szczegóły produktu",
    noResultsTitle: "Nie znaleźliśmy produktów",
    noResultsDescription: "Zmień kategorię lub wpisz inne hasło.",
    photo: (current, total) => `Zdjęcie ${current} z ${total}`,
  },
  en: {
    kicker: "Product catalogue",
    brandSubtitle: "Product showcase",
    title: "Xzone products",
    description: "Explore products for caring for helmets, riding gear and motorcycles.",
    search: "Search product or description…",
    searchLabel: "Search products",
    categoriesLabel: "Product categories",
    all: "All products",
    helmet: "Helmet care",
    leather: "Leather gear",
    textile: "Textile gear",
    accessories: "Accessories",
    motorcycle: "Motorcycle care",
    offRoad: "Off-road",
    openDetails: "View details",
    details: "Product details",
    productDescription: "Product description",
    videos: "Product videos",
    video: "Product video",
    photos: "Product photos",
    close: "Close product details",
    noResultsTitle: "No products found",
    noResultsDescription: "Choose another category or try a different search.",
    photo: (current, total) => `Photo ${current} of ${total}`,
  },
  de: {
    kicker: "Produktkatalog",
    brandSubtitle: "Produktpräsentation",
    title: "Xzone Produkte",
    description: "Produkte für die Pflege von Helmen, Motorradbekleidung und Motorrädern.",
    search: "Produkt oder Beschreibung suchen…",
    searchLabel: "Produkte suchen",
    categoriesLabel: "Produktkategorien",
    all: "Alle Produkte",
    helmet: "Helmpflege",
    leather: "Lederbekleidung",
    textile: "Textilbekleidung",
    accessories: "Zubehör",
    motorcycle: "Motorradpflege",
    offRoad: "Off-road",
    openDetails: "Details ansehen",
    details: "Produktdetails",
    productDescription: "Produktbeschreibung",
    videos: "Produktvideos",
    video: "Produktvideo",
    photos: "Produktfotos",
    close: "Produktdetails schließen",
    noResultsTitle: "Keine Produkte gefunden",
    noResultsDescription: "Wähle eine andere Kategorie oder ändere den Suchbegriff.",
    photo: (current, total) => `Foto ${current} von ${total}`,
  },
  cs: {
    kicker: "Katalog produktů",
    brandSubtitle: "Představení produktů",
    title: "Produkty Xzone",
    description: "Prozkoumejte produkty pro péči o helmy, motorkářské oblečení a motocykly.",
    search: "Hledat produkt nebo popis…",
    searchLabel: "Hledat produkty",
    categoriesLabel: "Kategorie produktů",
    all: "Všechny produkty",
    helmet: "Péče o helmy",
    leather: "Kožené oblečení",
    textile: "Textilní oblečení",
    accessories: "Příslušenství",
    motorcycle: "Péče o motocykly",
    offRoad: "Off-road",
    openDetails: "Zobrazit podrobnosti",
    details: "Podrobnosti o produktu",
    productDescription: "Popis produktu",
    videos: "Produktová videa",
    video: "Produktové video",
    photos: "Fotografie produktu",
    close: "Zavřít podrobnosti o produktu",
    noResultsTitle: "Nenašli jsme žádné produkty",
    noResultsDescription: "Vyberte jinou kategorii nebo zkuste jiné hledání.",
    photo: (current, total) => `Fotografie ${current} z ${total}`,
  },
  fr: {
    kicker: "Catalogue produits",
    brandSubtitle: "Présentation des produits",
    title: "Produits Xzone",
    description: "Découvrez les produits pour l’entretien des casques, des vêtements et des motos.",
    search: "Rechercher un produit ou une description…",
    searchLabel: "Rechercher des produits",
    categoriesLabel: "Catégories de produits",
    all: "Tous les produits",
    helmet: "Entretien du casque",
    leather: "Vêtements en cuir",
    textile: "Vêtements textiles",
    accessories: "Accessoires",
    motorcycle: "Entretien de la moto",
    offRoad: "Tout-terrain",
    openDetails: "Voir les détails",
    details: "Détails du produit",
    productDescription: "Description du produit",
    videos: "Vidéos produits",
    video: "Vidéo produit",
    photos: "Photos du produit",
    close: "Fermer les détails du produit",
    noResultsTitle: "Aucun produit trouvé",
    noResultsDescription: "Choisissez une autre catégorie ou modifiez votre recherche.",
    photo: (current, total) => `Photo ${current} sur ${total}`,
  },
  it: {
    kicker: "Catalogo prodotti",
    brandSubtitle: "Presentazione dei prodotti",
    title: "Prodotti Xzone",
    description: "Scopri i prodotti per la cura di caschi, abbigliamento e moto.",
    search: "Cerca un prodotto o una descrizione…",
    searchLabel: "Cerca prodotti",
    categoriesLabel: "Categorie di prodotti",
    all: "Tutti i prodotti",
    helmet: "Cura del casco",
    leather: "Abbigliamento in pelle",
    textile: "Abbigliamento in tessuto",
    accessories: "Accessori",
    motorcycle: "Cura della moto",
    offRoad: "Off-road",
    openDetails: "Scopri i dettagli",
    details: "Dettagli del prodotto",
    productDescription: "Descrizione del prodotto",
    videos: "Video dei prodotti",
    video: "Video del prodotto",
    photos: "Foto del prodotto",
    close: "Chiudi i dettagli del prodotto",
    noResultsTitle: "Nessun prodotto trovato",
    noResultsDescription: "Scegli un’altra categoria o prova una ricerca diversa.",
    photo: (current, total) => `Foto ${current} di ${total}`,
  },
};

const CATEGORY_IDS: CategoryId[] = [
  "all",
  "helmet",
  "leather",
  "textile",
  "accessories",
  "motorcycle",
  "off-road",
];

const PRICE_COPY: Record<AcademyLanguage, { label: string; unavailable: string; locale: string }> = {
  pl: { label: "Cena katalogowa", unavailable: "Brak w cenniku", locale: "pl-PL" },
  en: { label: "Catalogue price", unavailable: "Not listed", locale: "en-IE" },
  de: { label: "Katalogpreis", unavailable: "Nicht gelistet", locale: "de-DE" },
  cs: { label: "Katalogová cena", unavailable: "Není uvedena", locale: "cs-CZ" },
  fr: { label: "Prix catalogue", unavailable: "Non renseigné", locale: "fr-FR" },
  it: { label: "Prezzo di catalogo", unavailable: "Non indicato", locale: "it-IT" },
};

const VIDEO_TOGGLE_COPY: Record<AcademyLanguage, {
  settings: string;
  description: string;
  unlockedDescription: string;
  videoLabel: string;
  enabled: string;
  disabled: string;
  passwordLabel: string;
  passwordPrompt: string;
  passwordPlaceholder: string;
  unlock: string;
  save: string;
  close: string;
  incorrectPassword: string;
}> = {
  pl: {
    settings: "Ustawienia filmów",
    description: "Wpisz hasło, aby otworzyć ustawienia filmów. Zmiany zapiszą się po zamknięciu okna.",
    unlockedDescription: "Ustaw widoczność filmów. Zmiany zapiszą się po zamknięciu okna.",
    videoLabel: "Filmy produktowe",
    enabled: "Włączone",
    disabled: "Wyłączone",
    passwordLabel: "Hasło do ustawień",
    passwordPrompt: "Wpisz hasło kiosk, aby odblokować przełącznik filmów.",
    passwordPlaceholder: "Hasło",
    unlock: "Odblokuj ustawienia",
    save: "Zapisz i zamknij",
    close: "Zamknij ustawienia",
    incorrectPassword: "Nieprawidłowe hasło.",
  },
  en: {
    settings: "Video settings",
    description: "Enter the password to open video settings. Changes are saved when you close this window.",
    unlockedDescription: "Choose whether product videos are on or off. Your choice is saved when you close this window.",
    videoLabel: "Product videos",
    enabled: "On",
    disabled: "Off",
    passwordLabel: "Settings password",
    passwordPrompt: "Enter the kiosk password to unlock the video switch.",
    passwordPlaceholder: "Password",
    unlock: "Unlock settings",
    save: "Save and close",
    close: "Close settings",
    incorrectPassword: "Incorrect password.",
  },
  de: {
    settings: "Videoeinstellungen",
    description: "Geben Sie das Passwort ein, um die Videoeinstellungen zu öffnen. Änderungen werden beim Schließen gespeichert.",
    unlockedDescription: "Legen Sie fest, ob Produktvideos ein- oder ausgeschaltet sind. Ihre Auswahl wird beim Schließen gespeichert.",
    videoLabel: "Produktvideos",
    enabled: "Ein",
    disabled: "Aus",
    passwordLabel: "Passwort für die Einstellungen",
    passwordPrompt: "Geben Sie das Kiosk-Passwort ein, um den Videoschalter freizuschalten.",
    passwordPlaceholder: "Passwort",
    unlock: "Einstellungen freischalten",
    save: "Speichern und schließen",
    close: "Einstellungen schließen",
    incorrectPassword: "Falsches Passwort.",
  },
  cs: {
    settings: "Nastavení videí",
    description: "Zadejte heslo pro otevření nastavení videí. Změny se uloží při zavření okna.",
    unlockedDescription: "Zvolte, zda mají být produktová videa zapnutá nebo vypnutá. Volba se uloží při zavření okna.",
    videoLabel: "Produktová videa",
    enabled: "Zapnuto",
    disabled: "Vypnuto",
    passwordLabel: "Heslo k nastavení",
    passwordPrompt: "Zadejte heslo kiosku pro odemknutí přepínače videí.",
    passwordPlaceholder: "Heslo",
    unlock: "Odemknout nastavení",
    save: "Uložit a zavřít",
    close: "Zavřít nastavení",
    incorrectPassword: "Nesprávné heslo.",
  },
  fr: {
    settings: "Réglages vidéo",
    description: "Saisissez le mot de passe pour accéder aux réglages vidéo. Les changements sont enregistrés à la fermeture.",
    unlockedDescription: "Choisissez d’activer ou non les vidéos produits. Votre choix sera enregistré à la fermeture.",
    videoLabel: "Vidéos produits",
    enabled: "Activées",
    disabled: "Désactivées",
    passwordLabel: "Mot de passe des réglages",
    passwordPrompt: "Saisissez le mot de passe kiosque pour déverrouiller le contrôle vidéo.",
    passwordPlaceholder: "Mot de passe",
    unlock: "Déverrouiller les réglages",
    save: "Enregistrer et fermer",
    close: "Fermer les réglages",
    incorrectPassword: "Mot de passe incorrect.",
  },
  it: {
    settings: "Impostazioni video",
    description: "Inserisci la password per accedere alle impostazioni video. Le modifiche vengono salvate alla chiusura.",
    unlockedDescription: "Scegli se attivare o disattivare i video dei prodotti. La scelta viene salvata alla chiusura.",
    videoLabel: "Video dei prodotti",
    enabled: "Attivi",
    disabled: "Disattivi",
    passwordLabel: "Password delle impostazioni",
    passwordPrompt: "Inserisci la password del chiosco per sbloccare il controllo video.",
    passwordPlaceholder: "Password",
    unlock: "Sblocca impostazioni",
    save: "Salva e chiudi",
    close: "Chiudi impostazioni",
    incorrectPassword: "Password errata.",
  },
};

const VIDEO_SETTINGS_STORAGE_KEY = "xzone.trade-fair.show-product-videos";
const VIDEO_SETTINGS_PASSWORD = "kiosk";

function formatCatalogPrice(productId: string, language: AcademyLanguage) {
  const price = TRADE_FAIR_PRODUCT_PRICES_EUR[productId];
  if (price === undefined) return PRICE_COPY[language].unavailable;

  return new Intl.NumberFormat(PRICE_COPY[language].locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function categoryLabel(category: CategoryId, copy: CatalogCopy) {
  switch (category) {
    case "all": return copy.all;
    case "helmet": return copy.helmet;
    case "leather": return copy.leather;
    case "textile": return copy.textile;
    case "accessories": return copy.accessories;
    case "motorcycle": return copy.motorcycle;
    case "off-road": return copy.offRoad;
  }
}

function productCategory(product: TradeFairProduct): TradeFairCatalogCategory {
  return TRADE_FAIR_PRODUCT_CATEGORIES[product.id] ?? "accessories";
}

const CATALOG_PRODUCTS = TRADE_FAIR_PRODUCTS.filter(
  (product) => product.id !== "wooden-knee-sliders" && product.id !== "need-speed-hoodie",
);

export function TradeFairCatalog() {
  const { language, setKioskLanguage } = useAcademy();
  const copy = CATALOG_COPY[language];
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductVideos, setShowProductVideos] = useState(true);
  const [videoSettingsDialogOpen, setVideoSettingsDialogOpen] = useState(false);
  const [videoSettingsUnlocked, setVideoSettingsUnlocked] = useState(false);
  const [videoPassword, setVideoPassword] = useState("");
  const [videoPasswordError, setVideoPasswordError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TradeFairProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [detailsScrolled, setDetailsScrolled] = useState(false);
  const detailsDialogRef = useRef<HTMLDialogElement>(null);
  const videoSettingsDialogRef = useRef<HTMLDialogElement>(null);
  const detailsScrollRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(language);

    return CATALOG_PRODUCTS.filter((product) => {
      const matchesCategory = activeCategory === "all" || productCategory(product) === activeCategory;
      const matchesQuery = !query || `${product.name} ${product.descriptionByLanguage[language]}`
        .toLocaleLowerCase(language)
        .includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, language, searchQuery]);

  useEffect(() => {
    const applyLanguage = (value: unknown) => {
      if (typeof value === "string" && ["pl", "en", "de", "cs", "fr", "it"].includes(value)) {
        setKioskLanguage(value as AcademyLanguage);
      }
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== "https://robertozon.com") return;
      if (event.source !== window.parent || !event.data || typeof event.data !== "object") return;
      if (event.data.type === "xzone-language") applyLanguage(event.data.lang);
    };

    applyLanguage(new URLSearchParams(window.location.search).get("lang"));
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setKioskLanguage]);

  useEffect(() => {
    const savedVisibility = window.localStorage.getItem(VIDEO_SETTINGS_STORAGE_KEY);
    if (savedVisibility === "true" || savedVisibility === "false") {
      setShowProductVideos(savedVisibility === "true");
    }
  }, []);

  useEffect(() => {
    const dialog = detailsDialogRef.current;
    if (!dialog) return;

    if (selectedProduct && !dialog.open) dialog.showModal();
    if (!selectedProduct && dialog.open) dialog.close();
  }, [selectedProduct]);

  useEffect(() => {
    const dialog = videoSettingsDialogRef.current;
    if (!dialog) return;

    if (videoSettingsDialogOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>("#trade-fair-video-password")?.focus();
    }
    if (!videoSettingsDialogOpen && dialog.open) dialog.close();
  }, [videoSettingsDialogOpen]);

  function openProduct(product: TradeFairProduct) {
    setSelectedImageIndex(0);
    setDetailsScrolled(false);
    setSelectedProduct(product);
  }

  function closeProduct() {
    detailsDialogRef.current?.close();
    setSelectedProduct(null);
  }

  function openVideoSettings() {
    setVideoSettingsUnlocked(false);
    setVideoPassword("");
    setVideoPasswordError(false);
    setVideoSettingsDialogOpen(true);
  }

  function persistVideoSettingsOnClose() {
    window.localStorage.setItem(VIDEO_SETTINGS_STORAGE_KEY, String(showProductVideos));
    setVideoSettingsDialogOpen(false);
    setVideoSettingsUnlocked(false);
    setVideoPassword("");
    setVideoPasswordError(false);
  }

  function submitVideoSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!videoSettingsUnlocked) {
      if (videoPassword.trim() !== VIDEO_SETTINGS_PASSWORD) {
        setVideoPasswordError(true);
        return;
      }

      setVideoSettingsUnlocked(true);
      setVideoPassword("");
      setVideoPasswordError(false);
      return;
    }

    videoSettingsDialogRef.current?.close();
  }

  function changeVideoVisibility(shouldShow: boolean) {
    setShowProductVideos(shouldShow);
    setVideoPasswordError(false);
  }

  const selectedImages = selectedProduct
    ? selectedProduct.galleryImages.length > 0
      ? selectedProduct.galleryImages
      : selectedProduct.image
        ? [selectedProduct.image]
        : []
    : [];
  const selectedDescriptionParagraphs = selectedProduct
    ? selectedProduct.detailDescriptionByLanguage[language].filter((paragraph) => paragraph.trim().length > 0)
    : [];
  const selectedVideos = showProductVideos && selectedProduct
    ? TRADE_FAIR_PRODUCT_VIDEOS[selectedProduct.id] ?? []
    : [];
  const selectedImage = selectedImages[selectedImageIndex] ?? selectedImages[0];

  return (
    <div className="min-h-screen bg-background-tertiary-default p-0 text-text-primary sm:p-4">
      <div className="mx-auto min-h-screen max-w-[1800px] overflow-hidden rounded-none bg-background-secondary-default shadow-xl sm:min-h-[calc(100vh-2rem)] sm:rounded-3xl">
        <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-separator-border bg-background-primary-default px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <Image
              src="/assets/xzone-logo.png"
              alt="Xzone"
              width={1024}
              height={930}
              priority
              className="h-12 w-24 shrink-0 object-contain brightness-0 sm:h-16 sm:w-36"
            />
            <div className="hidden border-s border-separator-border ps-4 sm:block">
              <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-text-secondary">EICMA</p>
              <p className="text-body-2-regular text-text-tertiary">{copy.brandSubtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="small"
              iconOnly
              leadingIcon={RiSettings3Line}
              aria-label={VIDEO_TOGGLE_COPY[language].settings}
              aria-haspopup="dialog"
              aria-expanded={videoSettingsDialogOpen}
              title={VIDEO_TOGGLE_COPY[language].settings}
              onClick={openVideoSettings}
              className="size-11 rounded-full p-0"
            />
            <AcademyLanguagePicker
              persistence="kiosk"
              className="min-h-10 rounded-full border-border-button-default bg-background-primary-default px-3 shadow-xs"
            />
          </div>
        </header>

        <section className="dark bg-background-full text-text-primary">
          <div className="flex flex-col justify-between gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">
            <div>
              <p className="mb-1 text-caption-1-semibold uppercase tracking-[0.18em] text-accent-300">{copy.kicker} · EICMA</p>
              <h1 className="font-display text-display-3-regular uppercase tracking-wide sm:text-display-2-regular">{copy.title}</h1>
              <p className="mt-1 max-w-2xl text-body-regular text-text-secondary">{copy.description}</p>
            </div>
          </div>
        </section>

        <main className="bg-background-secondary-default p-4 sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div role="group" aria-label={copy.categoriesLabel} className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORY_IDS.map((category) => {
                const selected = activeCategory === category;
                return (
                  <Button
                    key={category}
                    type="button"
                    variant="secondary"
                    size="small"
                    aria-pressed={selected}
                    onClick={() => setActiveCategory(category)}
                    className={cx(
                      "h-10 shrink-0 rounded-full px-4 text-caption-1-semibold",
                      selected && "border-accent-500 bg-accent-500 text-text-primary hover:border-accent-400 hover:bg-accent-400 active:bg-accent-500",
                    )}
                  >
                    {categoryLabel(category, copy)}
                  </Button>
                );
              })}
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
              <InputBase
                type="search"
                size="medium"
                aria-label={copy.searchLabel}
                placeholder={copy.search}
                leadingIcon={RiSearchLine}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                fieldClassName="h-11 rounded-xl border border-border-button-default bg-background-primary-default px-3 sm:w-72"
              />
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4 2xl:gap-5">
              {filteredProducts.map((product) => {
                const productImages = product.galleryImages.length > 0
                  ? product.galleryImages
                  : product.image
                    ? [product.image]
                    : [];
                return (
                  <Button
                    key={product.id}
                    type="button"
                    variant="secondary"
                    aria-haspopup="dialog"
                    onClick={() => openProduct(product)}
                    className={cx(
                      "group/card h-auto min-h-full w-full flex-col items-stretch overflow-hidden rounded-xl p-0 text-start whitespace-normal",
                      "border-border-button-default bg-background-primary-default text-text-primary shadow-sm",
                      "[&>span]:flex [&>span]:w-full [&>span]:flex-col [&>span]:items-stretch [&>span]:justify-start [&>span]:px-0 [&>span]:whitespace-normal",
                      "hover:border-accent-500 active:scale-[0.99]",
                      styles.catalogCard,
                    )}
                  >
                    <span className="relative block h-36 w-full overflow-hidden bg-background-primary-default sm:h-44 lg:h-48">
                      {productImages[0] ? (
                        <Image
                          src={productImages[0]}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className={cx("object-contain p-5 sm:p-6", styles.catalogImage)}
                        />
                      ) : null}
                      <span className="absolute left-2 top-2 rounded-md border border-separator-border bg-background-primary-default px-2 py-1 text-caption-1-semibold text-text-secondary sm:left-3 sm:top-3">
                        {categoryLabel(productCategory(product), copy)}
                      </span>
                    </span>
                    <span className="flex min-h-44 w-full flex-1 flex-col p-3 sm:p-4">
                      <span className="line-clamp-2 min-h-12 text-body-2-medium text-text-primary sm:text-body-medium">
                        {product.name}
                      </span>
                      {product.descriptionByLanguage[language] ? (
                        <span className="mt-2 line-clamp-3 text-body-2-regular text-text-secondary">
                          {product.descriptionByLanguage[language]}
                        </span>
                      ) : null}
                      <span className="mt-auto flex items-end justify-between gap-2 pt-4">
                        <span className="flex min-w-0 flex-col items-start gap-0.5">
                          <span className="text-caption-2-medium uppercase tracking-wide text-text-tertiary">
                            {PRICE_COPY[language].label}
                          </span>
                          <span className="text-title-3-semibold tabular-nums text-text-primary">
                            {formatCatalogPrice(product.id, language)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 pb-0.5 text-caption-1-semibold uppercase tracking-wide text-text-primary">
                          {copy.openDetails}
                          <RiArrowRightLine className="size-4 shrink-0 text-accent-800" aria-hidden="true" />
                        </span>
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-separator-border bg-background-primary-default px-6 py-12 text-center">
              <h2 className="text-title-2-semibold text-text-primary">{copy.noResultsTitle}</h2>
              <p className="mt-2 text-body-regular text-text-secondary">{copy.noResultsDescription}</p>
            </div>
          )}
        </main>
      </div>

      <dialog
        ref={detailsDialogRef}
        aria-labelledby="trade-fair-product-title"
        className={cx(
          "m-auto w-[calc(100vw-1.5rem)] max-w-6xl overflow-hidden rounded-2xl border border-separator-border bg-background-primary-default p-0 text-text-primary shadow-2xl backdrop:backdrop-blur-sm sm:w-[calc(100vw-3rem)] sm:rounded-3xl",
          styles.productDialog,
        )}
        onClose={() => setSelectedProduct(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeProduct();
        }}
      >
        {selectedProduct ? (
          <div className="relative overflow-hidden">
            <div
              ref={detailsScrollRef}
              onScroll={(event) => setDetailsScrolled(event.currentTarget.scrollTop > 0)}
              className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-3rem)]"
            >
              <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-separator-border bg-background-primary-default px-4 py-4 sm:px-7 sm:py-5">
                <div className="min-w-0">
                  <p className="mb-1 text-caption-1-semibold uppercase tracking-[0.15em] text-accent-800">
                    {categoryLabel(productCategory(selectedProduct), copy)} · {copy.details}
                  </p>
                  <h2 id="trade-fair-product-title" className="text-balance text-title-2-semibold text-text-primary sm:text-title-1-semibold">
                    {selectedProduct.name}
                  </h2>
                </div>
                <CloseButton
                  aria-label={copy.close}
                  size="md"
                  onClick={closeProduct}
                  className="shrink-0"
                />
              </header>

              <div className="grid gap-6 p-4 sm:p-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
                <section aria-label={copy.photos}>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                    {selectedImage ? (
                      <Image
                        src={selectedImage}
                        alt={selectedProduct.name}
                        fill
                        priority
                        sizes="(max-width: 1024px) 90vw, 42vw"
                        className="object-contain"
                      />
                    ) : null}
                  </div>
                  {selectedImages.length > 1 ? (
                    <div role="group" aria-label={copy.photos} className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                      {selectedImages.map((image, index) => (
                        <Button
                          key={`${selectedProduct.id}-${image}`}
                          type="button"
                          variant="secondary"
                          size="small"
                          aria-label={copy.photo(index + 1, selectedImages.length)}
                          aria-pressed={index === selectedImageIndex}
                          onClick={() => setSelectedImageIndex(index)}
                          className={cx(
                            "size-16 shrink-0 rounded-xl p-1",
                            "[&>span]:flex [&>span]:size-full [&>span]:items-center [&>span]:justify-center [&>span]:px-0",
                            index === selectedImageIndex && "border-accent-500 bg-accent-50 hover:bg-accent-50 active:bg-accent-50",
                          )}
                        >
                          <span className="relative block size-full overflow-hidden rounded-lg bg-background-primary-default">
                            <Image src={image} alt="" fill sizes="64px" className="object-contain" />
                          </span>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </section>

                <div>
                  <div className="mb-6 rounded-xl border border-separator-border bg-background-secondary-default p-4">
                    <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">
                      {PRICE_COPY[language].label}
                    </p>
                    <p className="mt-1 text-title-2-semibold tabular-nums text-text-primary">
                      {formatCatalogPrice(selectedProduct.id, language)}
                    </p>
                  </div>

                  {selectedDescriptionParagraphs.length > 0 ? (
                    <section>
                      <h3 className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">{copy.productDescription}</h3>
                      <div className="mt-2 space-y-3 text-pretty text-body-regular text-text-secondary">
                        {selectedDescriptionParagraphs.map((paragraph, index) => (
                          <p key={`${selectedProduct.id}-description-${index}`}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {selectedVideos.length > 0 ? (
                    <section aria-label={copy.videos} className="mt-7 border-t border-separator-border pt-6">
                      <h3 className="text-title-3-semibold text-text-primary">{copy.videos}</h3>
                      <div className="mt-4 grid w-full gap-4">
                        {selectedVideos.map((video, index) => (
                          <article key={`${video.src}-${index}`} className="min-w-0">
                            <div className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-background-secondary-default">
                              <video
                                controls
                                playsInline
                                preload="metadata"
                                title={`${copy.video}: ${video.title}`}
                                className="size-full"
                              >
                                <source src={video.src} type="video/mp4" />
                              </video>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-6" aria-hidden="true">
              <div className={styles.scrollFadeSoft} style={{ opacity: detailsScrolled ? 1 : 0 }} />
              <div className={styles.scrollFadeStrong} style={{ opacity: detailsScrolled ? 1 : 0 }} />
              <div className={styles.scrollFadeSurface} style={{ opacity: detailsScrolled ? 1 : 0 }} />
            </div>
          </div>
        ) : null}
      </dialog>

      <dialog
        ref={videoSettingsDialogRef}
        aria-labelledby="trade-fair-video-settings-title"
        aria-describedby="trade-fair-video-settings-description"
        className="m-auto w-[calc(100vw-2rem)] max-w-lg rounded-2xl border border-separator-border bg-background-primary-default p-0 text-text-primary shadow-2xl backdrop:backdrop-blur-sm"
        onClose={persistVideoSettingsOnClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) videoSettingsDialogRef.current?.close();
        }}
      >
        <form onSubmit={submitVideoSettings} className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-caption-1-semibold uppercase tracking-[0.15em] text-accent-800">Kiosk</p>
              <h2 id="trade-fair-video-settings-title" className="mt-1 text-title-2-semibold text-text-primary">
                {VIDEO_TOGGLE_COPY[language].settings}
              </h2>
            </div>
            <CloseButton
              type="button"
              aria-label={VIDEO_TOGGLE_COPY[language].close}
              size="sm"
              onClick={() => videoSettingsDialogRef.current?.close()}
            />
          </div>

          <p id="trade-fair-video-settings-description" className="mt-3 text-body-2-regular text-text-secondary">
            {videoSettingsUnlocked
              ? VIDEO_TOGGLE_COPY[language].unlockedDescription
              : VIDEO_TOGGLE_COPY[language].description}
          </p>

          {!videoSettingsUnlocked ? (
            <div className="mt-6">
              <label htmlFor="trade-fair-video-password" className="text-body-2-medium text-text-primary">
                {VIDEO_TOGGLE_COPY[language].passwordLabel}
              </label>
              <p className="mt-1 text-caption-1-regular text-text-secondary">
                {VIDEO_TOGGLE_COPY[language].passwordPrompt}
              </p>
              <InputBase
                id="trade-fair-video-password"
                type="password"
                autoComplete="off"
                autoFocus
                aria-invalid={videoPasswordError}
                aria-describedby={videoPasswordError ? "trade-fair-video-password-error" : undefined}
                placeholder={VIDEO_TOGGLE_COPY[language].passwordPlaceholder}
                value={videoPassword}
                onChange={(event) => {
                  setVideoPassword(event.target.value);
                  setVideoPasswordError(false);
                }}
                fieldClassName="mt-2 h-11 rounded-xl border border-border-button-default bg-background-primary-default px-3"
              />
              {videoPasswordError ? (
                <p id="trade-fair-video-password-error" role="alert" className="mt-2 text-body-2-regular text-text-error-primary">
                  {VIDEO_TOGGLE_COPY[language].incorrectPassword}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-separator-border bg-background-secondary-default p-4">
              <div>
                <p className="text-body-medium text-text-primary">{VIDEO_TOGGLE_COPY[language].videoLabel}</p>
                <p className="mt-1 text-body-2-regular text-text-secondary">
                  {showProductVideos ? VIDEO_TOGGLE_COPY[language].enabled : VIDEO_TOGGLE_COPY[language].disabled}
                </p>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <span className="sr-only">{VIDEO_TOGGLE_COPY[language].videoLabel}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={showProductVideos}
                  onChange={(event) => changeVideoVisibility(event.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="relative h-7 w-12 rounded-full bg-background-tertiary-default transition-colors after:absolute after:start-1 after:top-1 after:size-5 after:rounded-full after:bg-background-primary-default after:shadow-sm after:transition-transform peer-checked:bg-accent-800 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-800"
                />
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="submit" variant="primary">
              {videoSettingsUnlocked ? VIDEO_TOGGLE_COPY[language].save : VIDEO_TOGGLE_COPY[language].unlock}
            </Button>
          </div>
        </form>
      </dialog>

    </div>
  );
}
