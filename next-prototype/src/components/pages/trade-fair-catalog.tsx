"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiPlayFill,
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
  type TradeFairProductVideo,
} from "@/lib/trade-fair-catalog-content";
import { TRADE_FAIR_PRODUCTS, type TradeFairProduct } from "@/lib/trade-fair-products";
import { cx } from "@/utils/cx";
import styles from "./trade-fair-catalog.module.css";

type CategoryId = "all" | TradeFairCatalogCategory;
type ProductGridColumns = 3 | 4 | 5;

const PRODUCT_GRID_COLUMN_CLASSES: Record<ProductGridColumns, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

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
  playVideo: string;
  photos: string;
  close: string;
  noResultsTitle: string;
  noResultsDescription: string;
  previousPhoto: string;
  nextPhoto: string;
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
    playVideo: "Odtwórz film",
    photos: "Zdjęcia produktu",
    close: "Zamknij szczegóły produktu",
    noResultsTitle: "Nie znaleźliśmy produktów",
    noResultsDescription: "Zmień kategorię lub wpisz inne hasło.",
    previousPhoto: "Poprzednie zdjęcie",
    nextPhoto: "Następne zdjęcie",
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
    playVideo: "Play video",
    photos: "Product photos",
    close: "Close product details",
    noResultsTitle: "No products found",
    noResultsDescription: "Choose another category or try a different search.",
    previousPhoto: "Previous photo",
    nextPhoto: "Next photo",
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
    playVideo: "Video abspielen",
    photos: "Produktfotos",
    close: "Produktdetails schließen",
    noResultsTitle: "Keine Produkte gefunden",
    noResultsDescription: "Wähle eine andere Kategorie oder ändere den Suchbegriff.",
    previousPhoto: "Vorheriges Foto",
    nextPhoto: "Nächstes Foto",
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
    playVideo: "Přehrát video",
    photos: "Fotografie produktu",
    close: "Zavřít podrobnosti o produktu",
    noResultsTitle: "Nenašli jsme žádné produkty",
    noResultsDescription: "Vyberte jinou kategorii nebo zkuste jiné hledání.",
    previousPhoto: "Předchozí fotografie",
    nextPhoto: "Další fotografie",
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
    playVideo: "Lire la vidéo",
    photos: "Photos du produit",
    close: "Fermer les détails du produit",
    noResultsTitle: "Aucun produit trouvé",
    noResultsDescription: "Choisissez une autre catégorie ou modifiez votre recherche.",
    previousPhoto: "Photo précédente",
    nextPhoto: "Photo suivante",
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
    playVideo: "Riproduci il video",
    photos: "Foto del prodotto",
    close: "Chiudi i dettagli del prodotto",
    noResultsTitle: "Nessun prodotto trovato",
    noResultsDescription: "Scegli un’altra categoria o prova una ricerca diversa.",
    previousPhoto: "Foto precedente",
    nextPhoto: "Foto successiva",
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

const KIOSK_SETTINGS_COPY = {
  settings: "Ustawienia kiosku",
  description: "Wpisz hasło, aby otworzyć ustawienia kiosku. Zmiany zapiszą się po zamknięciu okna.",
  unlockedDescription: "Ustaw widoczność filmów i liczbę kolumn produktów. Zmiany zapiszą się po zamknięciu okna.",
  videoLabel: "Filmy produktowe",
  gridColumnsLabel: "Kolumny siatki produktów",
  gridColumnsOptions: { 3: "3 kolumny", 4: "4 kolumny", 5: "5 kolumn" },
  enabled: "Włączone",
  disabled: "Wyłączone",
  passwordLabel: "Hasło do ustawień",
  passwordPrompt: "Wpisz hasło kiosk, aby odblokować ustawienia filmów i siatki produktów.",
  passwordPlaceholder: "Hasło",
  unlock: "Odblokuj ustawienia",
  save: "Zapisz i zamknij",
  close: "Zamknij ustawienia",
  incorrectPassword: "Nieprawidłowe hasło.",
} satisfies {
  settings: string;
  description: string;
  unlockedDescription: string;
  videoLabel: string;
  gridColumnsLabel: string;
  gridColumnsOptions: Record<ProductGridColumns, string>;
  enabled: string;
  disabled: string;
  passwordLabel: string;
  passwordPrompt: string;
  passwordPlaceholder: string;
  unlock: string;
  save: string;
  close: string;
  incorrectPassword: string;
};

const VIDEO_SETTINGS_STORAGE_KEY = "xzone.trade-fair.show-product-videos";
const PRODUCT_GRID_COLUMNS_STORAGE_KEY = "xzone.trade-fair.product-grid-columns";
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

function TradeFairProductVideoPlayer({
  video,
  videoLabel,
  playLabel,
}: {
  video: TradeFairProductVideo;
  videoLabel: string;
  playLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function playVideo() {
    const player = videoRef.current;
    if (!player) return;

    void player.play().catch(() => setIsPlaying(false));
  }

  return (
    <div
      className="relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-xl border border-black bg-white"
      style={{
        width: "min(100%, 36.5625dvh)",
        maxHeight: "65dvh",
        aspectRatio: "9 / 16",
        marginInline: "auto",
      }}
    >
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        title={videoLabel}
        className="size-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={video.src} type="video/mp4" />
      </video>
      {!isPlaying ? (
        <Button
          type="button"
          variant="primary"
          leadingIcon={RiPlayFill}
          aria-label={playLabel}
          onClick={playVideo}
          className="absolute left-1/2 top-1/2 z-10 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/75 px-5 text-white shadow-lg backdrop-blur-sm transition-transform hover:bg-black/85 active:scale-[0.96]"
        >
          {playLabel}
        </Button>
      ) : null}
    </div>
  );
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
  const [productGridColumns, setProductGridColumns] = useState<ProductGridColumns>(4);
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

    const savedColumns = window.localStorage.getItem(PRODUCT_GRID_COLUMNS_STORAGE_KEY);
    if (savedColumns === "3" || savedColumns === "4" || savedColumns === "5") {
      setProductGridColumns(Number(savedColumns) as ProductGridColumns);
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
    window.localStorage.setItem(PRODUCT_GRID_COLUMNS_STORAGE_KEY, String(productGridColumns));
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
              aria-label={KIOSK_SETTINGS_COPY.settings}
              aria-haspopup="dialog"
              aria-expanded={videoSettingsDialogOpen}
              title={KIOSK_SETTINGS_COPY.settings}
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
            <div className={cx("grid grid-cols-2 gap-3 sm:gap-4 2xl:gap-5", PRODUCT_GRID_COLUMN_CLASSES[productGridColumns])}>
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

              <div className="grid gap-6 p-4 sm:px-7 sm:py-7 lg:pb-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
                <section aria-label={copy.photos} className="lg:sticky lg:top-28 lg:self-start">
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white lg:mx-auto lg:w-[min(100%,calc(100dvh_-_15.5rem))]">
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
                    {selectedImages.length > 1 ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          iconOnly
                          leadingIcon={RiArrowLeftLine}
                          aria-label={copy.previousPhoto}
                          disabled={selectedImageIndex === 0}
                          onClick={() => setSelectedImageIndex((index) => Math.max(0, index - 1))}
                          className="absolute left-3 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform active:scale-[0.96]"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          iconOnly
                          leadingIcon={RiArrowRightLine}
                          aria-label={copy.nextPhoto}
                          disabled={selectedImageIndex === selectedImages.length - 1}
                          onClick={() => setSelectedImageIndex((index) => Math.min(selectedImages.length - 1, index + 1))}
                          className="absolute right-3 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform active:scale-[0.96]"
                        />
                      </>
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
                            <TradeFairProductVideoPlayer
                              video={video}
                              videoLabel={`${copy.video}: ${video.title}`}
                              playLabel={copy.playVideo}
                            />
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
                {KIOSK_SETTINGS_COPY.settings}
              </h2>
            </div>
            <CloseButton
              type="button"
              aria-label={KIOSK_SETTINGS_COPY.close}
              size="sm"
              onClick={() => videoSettingsDialogRef.current?.close()}
            />
          </div>

          <p id="trade-fair-video-settings-description" className="mt-3 text-body-2-regular text-text-secondary">
            {videoSettingsUnlocked
              ? KIOSK_SETTINGS_COPY.unlockedDescription
              : KIOSK_SETTINGS_COPY.description}
          </p>

          {!videoSettingsUnlocked ? (
            <div className="mt-6">
              <label htmlFor="trade-fair-video-password" className="text-body-2-medium text-text-primary">
                {KIOSK_SETTINGS_COPY.passwordLabel}
              </label>
              <p className="mt-1 text-caption-1-regular text-text-secondary">
                {KIOSK_SETTINGS_COPY.passwordPrompt}
              </p>
              <InputBase
                id="trade-fair-video-password"
                type="password"
                autoComplete="off"
                autoFocus
                aria-invalid={videoPasswordError}
                aria-describedby={videoPasswordError ? "trade-fair-video-password-error" : undefined}
                placeholder={KIOSK_SETTINGS_COPY.passwordPlaceholder}
                value={videoPassword}
                onChange={(event) => {
                  setVideoPassword(event.target.value);
                  setVideoPasswordError(false);
                }}
                fieldClassName="mt-2 h-11 rounded-xl border border-border-button-default bg-background-primary-default px-3"
              />
              {videoPasswordError ? (
                <p id="trade-fair-video-password-error" role="alert" className="mt-2 text-body-2-regular text-text-error-primary">
                  {KIOSK_SETTINGS_COPY.incorrectPassword}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-separator-border bg-background-secondary-default p-4">
                <div>
                  <p className="text-body-medium text-text-primary">{KIOSK_SETTINGS_COPY.videoLabel}</p>
                  <p className="mt-1 text-body-2-regular text-text-secondary">
                    {showProductVideos ? KIOSK_SETTINGS_COPY.enabled : KIOSK_SETTINGS_COPY.disabled}
                  </p>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <span className="sr-only">{KIOSK_SETTINGS_COPY.videoLabel}</span>
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

              <fieldset className="rounded-xl border border-separator-border bg-background-secondary-default p-4">
                <legend className="px-1 text-body-medium text-text-primary">
                  {KIOSK_SETTINGS_COPY.gridColumnsLabel}
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {([3, 4, 5] as const).map((columns) => (
                    <label key={columns} className="cursor-pointer">
                      <input
                        type="radio"
                        name="trade-fair-product-grid-columns"
                        value={columns}
                        checked={productGridColumns === columns}
                        onChange={() => setProductGridColumns(columns)}
                        aria-label={KIOSK_SETTINGS_COPY.gridColumnsOptions[columns]}
                        className="peer sr-only"
                      />
                      <span
                        className={cx(
                          "flex h-11 items-center justify-center rounded-lg border text-body-medium transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-800",
                          productGridColumns === columns
                            ? "border-accent-800 bg-accent-800 text-white"
                            : "border-border-button-default bg-background-primary-default text-text-primary hover:bg-background-tertiary-default",
                        )}
                      >
                        {KIOSK_SETTINGS_COPY.gridColumnsOptions[columns]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="submit" variant="primary">
              {videoSettingsUnlocked ? KIOSK_SETTINGS_COPY.save : KIOSK_SETTINGS_COPY.unlock}
            </Button>
          </div>
        </form>
      </dialog>

    </div>
  );
}
