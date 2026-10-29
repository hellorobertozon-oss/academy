"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  RiArrowRightLine,
  RiCloseLine,
  RiInformationLine,
  RiMotorbikeLine,
  RiRefreshLine,
  RiStarFill,
  RiTimer2Line,
} from "@remixicon/react";
import { useAcademy, type AcademyLanguage } from "@/components/academy-provider";
import { GAME_PRODUCT_CATALOG, type GameProductCategory } from "@/lib/game-product-catalog";
import { CUSTOMER_ADVICE_SCENARIOS, type CustomerAdviceScenario, type CustomerAdviceTurn } from "@/lib/customer-advice-scenarios";

type GameLanguage = AcademyLanguage;

function getGameCopy<T>(copy: Record<GameLanguage, T>, language: AcademyLanguage): T {
  return copy[language];
}

const ROUND_SECONDS_BY_DIFFICULTY: Record<CustomerAdviceScenario["difficulty"], number> = {
  easy: 120,
  medium: 105,
  hard: 90,
};
const CHARACTER_TIME_BONUS_SECONDS = 20;
const CHARACTER_POINTS_MULTIPLIER = 1.1;
const CUSTOMERS_PER_ROUND = 5;
const WRONG_CHOICE_PENALTY = 5;
const ALTERNATIVE_PRODUCT_POINTS = 35;
const ROUND_DIFFICULTY_PLAN = [
  { difficulty: "easy", count: CUSTOMERS_PER_ROUND },
  { difficulty: "medium", count: CUSTOMERS_PER_ROUND },
  { difficulty: "hard", count: CUSTOMERS_PER_ROUND },
] as const;
const GAME_ASSETS = "/assets/game-concept";
const BACKGROUND_FRAMES = [1, 2, 3, 4] as const;
const SOUNDTRACKS = [
  `${GAME_ASSETS}/audio/soundtrack-1.mp3`,
  `${GAME_ASSETS}/audio/soundtrack-2.mp3`,
] as const;
const VOCAL_CLIPS = [
  `${GAME_ASSETS}/audio/vocal-1.mp3`,
  `${GAME_ASSETS}/audio/vocal-2.mp3`,
  `${GAME_ASSETS}/audio/vocal-3.mp3`,
  `${GAME_ASSETS}/audio/vocal-4.mp3`,
  `${GAME_ASSETS}/audio/vocal-5.mp3`,
  `${GAME_ASSETS}/audio/vocal-6.mp3`,
  `${GAME_ASSETS}/audio/vocal-7.mp3`,
  `${GAME_ASSETS}/audio/vocal-8.mp3`,
] as const;
const CUSTOMER_IMAGES = [
  `${GAME_ASSETS}/customers/varied/customer-01-urban-man-gesture.png`,
  `${GAME_ASSETS}/customers/varied/customer-02-adventure-woman-question.png`,
  `${GAME_ASSETS}/customers/varied/customer-03-veteran-man-arms-crossed.png`,
  `${GAME_ASSETS}/customers/varied/customer-04-city-woman-hip-pose.png`,
  `${GAME_ASSETS}/customers/varied/customer-05-sport-man-crouch.png`,
  `${GAME_ASSETS}/customers/varied/customer-06-sport-woman-glove.png`,
  `${GAME_ASSETS}/customers/varied/customer-07-cruiser-man-thumbs-up.png`,
  `${GAME_ASSETS}/customers/varied/customer-08-adventure-woman-over-shoulder.png`,
  `${GAME_ASSETS}/customers/varied/customer-09-commuter-man-phone.png`,
  `${GAME_ASSETS}/customers/varied/customer-10-touring-woman-wave.png`,
] as const;
const CONTEST_ASSETS = `${GAME_ASSETS}/contest`;
const GAME_ROUTE_PATHS = new Set([
  "/games/customer-advice",
  "/admin/user-preview/games/customer-advice",
]);
const CONTESTANTS = [
  { id: "one", image: `${CONTEST_ASSETS}/woman-person-cutout.png`, perk: "points" },
  { id: "two", image: `${CONTEST_ASSETS}/man-person.png`, perk: "time" },
] as const;

type GameScreen = "start" | "choose-character" | "intro" | "game";
type ContestantId = (typeof CONTESTANTS)[number]["id"];
type ProductSaleFlight = {
  id: number;
  image: string;
  left: number;
  top: number;
  size: number;
  deltaX: number;
  deltaY: number;
  pointsEarned: number;
  message: string;
  tone: "best" | "alternative";
};

type ContestFlowCopy = {
  titleEyebrow: string;
  title: string;
  tagline: string;
  start: string;
  chooseTitle: string;
  chooseHint: string;
  playerOne: string;
  playerTwo: string;
  chooseCharacter: string;
  manager: string;
  bossIntro: string;
  selectedLabel: string;
  rivalLabel: string;
  selectedReply: string;
  rivalReply: string;
  next: string;
  begin: string;
  back: string;
  characterAlt: string;
  managerAlt: string;
  motorcycleAlt: string;
};

const CONTEST_FLOW_COPY: Record<GameLanguage, ContestFlowCopy> = {
  pl: {
    titleEyebrow: "MOTO EKSPERT · WYZWANIE SPRZEDAŻOWE",
    title: "Mistrz sprzedaży",
    tagline: "Obsłuż klientów i zgarnij motocykl.",
    start: "Rozpocznij grę",
    chooseTitle: "Wybierz swojego sprzedawcę",
    chooseHint: "Wybierz postać, którą poprowadzisz dzisiejszy wyścig sprzedażowy.",
    playerOne: "Agnieszka",
    playerTwo: "Robert",
    chooseCharacter: "Wybierz postać",
    manager: "Szef salonu",
    bossIntro: "Dziś rusza konkurs! Do zamknięcia sklepu wygrywa osoba, która sprzeda najwięcej. Nagrodą jest ten motocykl!",
    selectedLabel: "TY",
    rivalLabel: "RYWAL",
    selectedReply: "Wchodzę w to. Dziś dam z siebie wszystko!",
    rivalReply: "Powodzenia. Zobaczymy, kto najlepiej doradzi klientom!",
    next: "Dalej",
    begin: "Rozpocznij sprzedaż",
    back: "Wróć do wyboru",
    characterAlt: "Postać pracownika salonu motocyklowego",
    managerAlt: "Szef salonu ogłasza konkurs",
    motorcycleAlt: "Motocykl będący nagrodą w konkursie",
  },
  en: {
    titleEyebrow: "MOTO EXPERT · SALES CHALLENGE",
    title: "Sales Champion",
    tagline: "Help customers. Sell the most. Claim the prize.",
    start: "Start the game",
    chooseTitle: "Choose your salesperson",
    chooseHint: "Choose the character who will lead today's sales challenge.",
    playerOne: "Agnieszka",
    playerTwo: "Robert",
    chooseCharacter: "Choose character",
    manager: "Store manager",
    bossIntro: "The contest starts today! By closing time, the person who sells the most wins this motorcycle!",
    selectedLabel: "YOU",
    rivalLabel: "RIVAL",
    selectedReply: "I'm in. I'll give it everything today!",
    rivalReply: "Good luck. Let's see who gives customers the best advice!",
    next: "Next",
    begin: "Start selling",
    back: "Back to character selection",
    characterAlt: "Motorcycle shop employee character",
    managerAlt: "The shop manager announces the contest",
    motorcycleAlt: "The motorcycle prize for the contest",
  },
  de: {
    titleEyebrow: "MOTO EXPERTE · VERKAUFSCHALLENGE",
    title: "Verkaufsmeister",
    tagline: "Berate Kunden. Verkaufe am meisten. Hol dir den Preis.",
    start: "Spiel starten",
    chooseTitle: "Wähle deinen Verkäufer",
    chooseHint: "Wähle die Figur, die dich durch den heutigen Verkaufswettbewerb führt.",
    playerOne: "Agnieszka",
    playerTwo: "Robert",
    chooseCharacter: "Figur auswählen",
    manager: "Filialleiter",
    bossIntro: "Heute beginnt der Wettbewerb! Wer bis Ladenschluss am meisten verkauft, gewinnt dieses Motorrad!",
    selectedLabel: "DU",
    rivalLabel: "KONKURRENT",
    selectedReply: "Ich bin dabei. Heute gebe ich alles!",
    rivalReply: "Viel Glück. Mal sehen, wer die Kunden am besten berät!",
    next: "Weiter",
    begin: "Verkauf starten",
    back: "Zurück zur Figurenwahl",
    characterAlt: "Mitarbeiterfigur eines Motorradgeschäfts",
    managerAlt: "Der Filialleiter kündigt den Wettbewerb an",
    motorcycleAlt: "Das Motorrad als Wettbewerbspreis",
  },
  cs: {
    titleEyebrow: "MOTO EXPERT · PRODEJNÍ VÝZVA",
    title: "Mistr prodeje",
    tagline: "Poradíš zákazníkům. Prodáš nejvíc. Získáš cenu.",
    start: "Spustit hru",
    chooseTitle: "Vyber svého prodejce",
    chooseHint: "Vyber postavu, která tě provede dnešní prodejní výzvou.",
    playerOne: "Agnieszka",
    playerTwo: "Robert",
    chooseCharacter: "Vybrat postavu",
    manager: "Vedoucí prodejny",
    bossIntro: "Dnes začíná soutěž! Kdo do zavírací doby prodá nejvíc, vyhrává tuto motorku!",
    selectedLabel: "TY",
    rivalLabel: "SOUPEŘ",
    selectedReply: "Jdu do toho. Dnes ze sebe vydám vše!",
    rivalReply: "Hodně štěstí. Uvidíme, kdo zákazníkům poradí lépe!",
    next: "Další",
    begin: "Začít prodávat",
    back: "Zpět k výběru postavy",
    characterAlt: "Postava zaměstnance motocyklového obchodu",
    managerAlt: "Vedoucí obchodu vyhlašuje soutěž",
    motorcycleAlt: "Motorka jako cena soutěže",
  },
  fr: {
    titleEyebrow: "MOTO EXPERT · DÉFI COMMERCIAL",
    title: "Champion des ventes",
    tagline: "Conseilles les clients. Vends le plus. Remporte le prix.",
    start: "Lancer le jeu",
    chooseTitle: "Choisis ton vendeur",
    chooseHint: "Choisis le personnage qui mènera le défi commercial d'aujourd'hui.",
    playerOne: "Agnieszka",
    playerTwo: "Robert",
    chooseCharacter: "Choisir ce personnage",
    manager: "Responsable du magasin",
    bossIntro: "Le concours commence aujourd'hui ! À la fermeture, la personne qui aura vendu le plus remportera cette moto !",
    selectedLabel: "TOI",
    rivalLabel: "RIVAL",
    selectedReply: "J'accepte le défi. Je vais tout donner aujourd'hui !",
    rivalReply: "Bonne chance. Voyons qui saura le mieux conseiller les clients !",
    next: "Suivant",
    begin: "Commencer les ventes",
    back: "Retour au choix du personnage",
    characterAlt: "Personnage employé d'un magasin de motos",
    managerAlt: "Le responsable annonce le concours",
    motorcycleAlt: "La moto à gagner dans le concours",
  },
  it: {
    titleEyebrow: "ESPERTO DI MOTO · SFIDA DI VENDITA",
    title: "Campione di vendite",
    tagline: "Consiglia i clienti e aggiudicati la moto.",
    start: "Inizia il gioco",
    chooseTitle: "Scegli il tuo addetto alle vendite",
    chooseHint: "Scegli il personaggio che guiderà la sfida di vendita di oggi.",
    playerOne: "Agnieszka",
    playerTwo: "Robert",
    chooseCharacter: "Scegli il personaggio",
    manager: "Responsabile del negozio",
    bossIntro: "La gara inizia oggi! Alla chiusura, chi avrà venduto di più vincerà questa moto!",
    selectedLabel: "TU",
    rivalLabel: "AVVERSARIO",
    selectedReply: "Ci sto. Oggi darò il massimo!",
    rivalReply: "Buona fortuna. Vediamo chi saprà consigliare meglio i clienti!",
    next: "Avanti",
    begin: "Inizia a vendere",
    back: "Torna alla scelta del personaggio",
    characterAlt: "Personaggio di un addetto alle vendite di un negozio di moto",
    managerAlt: "Il responsabile del negozio annuncia la gara",
    motorcycleAlt: "La moto in palio nella gara",
  },
};

type GameCopy = {
  round: string;
  demoNote: string;
  customerImageAlt: string;
  scoreLabel: string;
  pointsUnit: string;
  timerLabel: string;
  levelLabel: string;
  levelProgressLabel: string;
  sceneEyebrow: string;
  shelfTitle: string;
  question: string;
  product: string;
  productDescription: string;
  productType: string;
  washOption: string;
  washDescription: string;
  helmetOption: string;
  helmetDescription: string;
  chainLubeOption: string;
  visorCleanerOption: string;
  correctTitle: string;
  correctDescription: string;
  wrongTitle: string;
  wrongDescription: string;
  speedBonus: string;
  timeUpTitle: string;
  timeUpDescription: string;
  replay: string;
  arrowBack: string;
  arrowForward: string;
  selectProduct: string;
  productNumberLabel: string;
  productCategories: string;
  allProducts: string;
  categoryHelmets: string;
  categoryTextileClothing: string;
  categoryLeatherClothing: string;
  categoryCare: string;
  categoryAccessories: string;
  confirmSelection: string;
};

const GAME_COPY: Record<GameLanguage, GameCopy> = {
  pl: {
    round: "Obsłuż 15 klientów",
    demoNote: "15 rozmów · 3 rundy rosnącej trudności",
    customerImageAlt: "Motocyklista rozmawiający ze sprzedawcą",
    scoreLabel: "Twoje punkty",
    pointsUnit: "pkt",
    timerLabel: "Czas",
    levelLabel: "Poziom",
    levelProgressLabel: "Klienci obsłużeni w rundzie",
    sceneEyebrow: "MOTO EKSPERT · TRENING SPRZEDAWCY",
    shelfTitle: "Co polecisz klientowi?",
    question: "Po myciu chcę dodać motocyklowi połysku i ochronić go przed szybkim osiadaniem brudu. Co polecasz?",
    product: "Ceramic Detailer",
    productDescription: "Nadaje połysk i pozostawia warstwę hydrofobową, która pomaga ograniczyć osadzanie się brudu.",
    productType: "Pielęgnacja motocykla",
    washOption: "Produkt do mycia motocykla",
    washDescription: "Do usuwania zabrudzeń podczas mycia.",
    helmetOption: "Środek do czyszczenia kasku",
    helmetDescription: "Do pielęgnacji skorupy i wizjera.",
    chainLubeOption: "Smar do łańcucha",
    visorCleanerOption: "Płyn do czyszczenia wizjera",
    correctTitle: "Dobrze dobrana porada!",
    correctDescription: "Ceramic Detailer nada połysk i zostawi warstwę hydrofobową, która pomaga ograniczyć osadzanie brudu.",
    wrongTitle: "To produkt do innego zadania.",
    wrongDescription: "Klient ma już umyty motocykl i szuka wykończenia po myciu. Spróbuj jeszcze raz.",
    speedBonus: "Bonus za szybkość",
    timeUpTitle: "Koniec czasu",
    timeUpDescription: "Zagraj jeszcze raz i spróbuj obsłużyć więcej klientów.",
    replay: "Zagraj jeszcze raz",
    arrowBack: "Poprzednie produkty",
    arrowForward: "Następne produkty",
    selectProduct: "Wybierz produkt",
    productNumberLabel: "Produkt",
    productCategories: "Kategorie produktów",
    allProducts: "Wszystkie",
    categoryHelmets: "Kaski",
    categoryTextileClothing: "Odzież tekstylna",
    categoryLeatherClothing: "Odzież skórzana",
    categoryCare: "Pielęgnacja",
    categoryAccessories: "Akcesoria",
    confirmSelection: "Sprawdź wybór",
  },
  en: {
    round: "Serve 15 customers",
    demoNote: "15 conversations · 3 rounds of increasing difficulty",
    customerImageAlt: "A motorcyclist talking to a shop assistant",
    scoreLabel: "Your points",
    pointsUnit: "pts",
    timerLabel: "Time",
    levelLabel: "Level",
    levelProgressLabel: "Customers served this round",
    sceneEyebrow: "MOTO EXPERT · SALES PRACTICE",
    shelfTitle: "What would you recommend?",
    question: "After washing, I’d like my motorcycle to shine and stay cleaner for longer. What would you recommend?",
    product: "Ceramic Detailer",
    productDescription: "Adds gloss and leaves a hydrophobic layer that helps reduce dirt build-up.",
    productType: "Motorcycle care",
    washOption: "Motorcycle wash product",
    washDescription: "For removing dirt during a wash.",
    helmetOption: "Helmet cleaning product",
    helmetDescription: "For caring for the shell and visor.",
    chainLubeOption: "Chain lubricant",
    visorCleanerOption: "Visor cleaner",
    correctTitle: "Great recommendation!",
    correctDescription: "Ceramic Detailer adds gloss and leaves a hydrophobic layer that helps reduce dirt build-up.",
    wrongTitle: "This product is for a different task.",
    wrongDescription: "The customer has already washed the motorcycle and wants a finishing product. Try again.",
    speedBonus: "Speed bonus",
    timeUpTitle: "Time’s up",
    timeUpDescription: "Play again and try to serve more customers.",
    replay: "Play again",
    arrowBack: "Previous products",
    arrowForward: "Next products",
    selectProduct: "Choose a product",
    productNumberLabel: "Product",
    productCategories: "Product categories",
    allProducts: "All",
    categoryHelmets: "Helmets",
    categoryTextileClothing: "Textile clothing",
    categoryLeatherClothing: "Leather clothing",
    categoryCare: "Care",
    categoryAccessories: "Accessories",
    confirmSelection: "Check selection",
  },
  de: {
    round: "Bediene 15 Kunden",
    demoNote: "15 Gespräche · 3 Runden mit steigendem Schwierigkeitsgrad",
    customerImageAlt: "Ein Motorradfahrer spricht mit einem Verkäufer",
    scoreLabel: "Deine Punkte",
    pointsUnit: "Pkt.",
    timerLabel: "Zeit",
    levelLabel: "Stufe",
    levelProgressLabel: "Bediente Kunden in dieser Runde",
    sceneEyebrow: "MOTO EXPERTE · VERKAUFSTRAINING",
    shelfTitle: "Was empfiehlst du?",
    question: "Nach dem Waschen soll mein Motorrad glänzen und länger sauber bleiben. Was empfiehlst du?",
    product: "Ceramic Detailer",
    productDescription: "Verleiht Glanz und hinterlässt eine hydrophobe Schicht, die Schmutzablagerungen reduzieren hilft.",
    productType: "Motorradpflege",
    washOption: "Motorrad-Reiniger",
    washDescription: "Zum Entfernen von Schmutz beim Waschen.",
    helmetOption: "Helmreiniger",
    helmetDescription: "Zur Pflege von Helmschale und Visier.",
    chainLubeOption: "Kettenschmiermittel",
    visorCleanerOption: "Visierreiniger",
    correctTitle: "Gute Empfehlung!",
    correctDescription: "Ceramic Detailer verleiht Glanz und hinterlässt eine hydrophobe Schicht, die Schmutzablagerungen reduzieren hilft.",
    wrongTitle: "Dieses Produkt ist für eine andere Aufgabe.",
    wrongDescription: "Das Motorrad ist bereits gewaschen. Gesucht wird ein Finish nach der Wäsche. Versuch es noch einmal.",
    speedBonus: "Schnelligkeitsbonus",
    timeUpTitle: "Die Zeit ist abgelaufen",
    timeUpDescription: "Spiele noch einmal und versuche, mehr Kunden zu bedienen.",
    replay: "Noch einmal spielen",
    arrowBack: "Vorherige Produkte",
    arrowForward: "Nächste Produkte",
    selectProduct: "Produkt auswählen",
    productNumberLabel: "Produkt",
    productCategories: "Produktkategorien",
    allProducts: "Alle",
    categoryHelmets: "Helme",
    categoryTextileClothing: "Textilbekleidung",
    categoryLeatherClothing: "Lederbekleidung",
    categoryCare: "Pflege",
    categoryAccessories: "Zubehör",
    confirmSelection: "Auswahl prüfen",
  },
  cs: {
    round: "Obsluž 15 zákazníků",
    demoNote: "15 rozhovorů · 3 kola rostoucí obtížnosti",
    customerImageAlt: "Motorkář mluví s prodavačem",
    scoreLabel: "Tvé body",
    pointsUnit: "bodů",
    timerLabel: "Čas",
    levelLabel: "Úroveň",
    levelProgressLabel: "Obsloužení zákazníci v tomto kole",
    sceneEyebrow: "MOTO EXPERT · TRÉNINK PRODEJE",
    shelfTitle: "Co zákazníkovi doporučíš?",
    question: "Po umytí chci, aby se motorka leskla a déle zůstala čistá. Co doporučíš?",
    product: "Ceramic Detailer",
    productDescription: "Dodá lesk a zanechá hydrofobní vrstvu, která pomáhá omezit usazování nečistot.",
    productType: "Péče o motorku",
    washOption: "Přípravek na mytí motorky",
    washDescription: "K odstranění nečistot při mytí.",
    helmetOption: "Přípravek na čištění helmy",
    helmetDescription: "K péči o skořepinu a hledí.",
    chainLubeOption: "Mazivo na řetěz",
    visorCleanerOption: "Čistič hledí",
    correctTitle: "Skvělé doporučení!",
    correctDescription: "Ceramic Detailer dodá lesk a zanechá hydrofobní vrstvu, která pomáhá omezit usazování nečistot.",
    wrongTitle: "Tento produkt se hodí na jiný úkol.",
    wrongDescription: "Motorka už je umytá a zákazník hledá závěrečnou péči. Zkus to znovu.",
    speedBonus: "Bonus za rychlost",
    timeUpTitle: "Čas vypršel",
    timeUpDescription: "Zahraj si znovu a zkus obsloužit více zákazníků.",
    replay: "Hrát znovu",
    arrowBack: "Předchozí produkty",
    arrowForward: "Další produkty",
    selectProduct: "Vyber produkt",
    productNumberLabel: "Produkt",
    productCategories: "Kategorie produktů",
    allProducts: "Vše",
    categoryHelmets: "Helmy",
    categoryTextileClothing: "Textilní oblečení",
    categoryLeatherClothing: "Kožené oblečení",
    categoryCare: "Péče",
    categoryAccessories: "Příslušenství",
    confirmSelection: "Zkontrolovat výběr",
  },
  fr: {
    round: "Conseiller 15 clients",
    demoNote: "15 échanges · 3 manches de difficulté croissante",
    customerImageAlt: "Un motard parle avec un vendeur",
    scoreLabel: "Tes points",
    pointsUnit: "pts",
    timerLabel: "Temps",
    levelLabel: "Niveau",
    levelProgressLabel: "Clients servis pendant cette manche",
    sceneEyebrow: "MOTO EXPERT · ENTRAÎNEMENT CONSEIL",
    shelfTitle: "Que recommandes-tu au client ?",
    question: "Après le lavage, j’aimerais faire briller ma moto et la garder propre plus longtemps. Que recommandes-tu ?",
    product: "Ceramic Detailer",
    productDescription: "Apporte de la brillance et laisse une couche hydrophobe qui aide à limiter l’accumulation de saletés.",
    productType: "Entretien moto",
    washOption: "Produit de lavage moto",
    washDescription: "Pour retirer la saleté pendant le lavage.",
    helmetOption: "Nettoyant pour casque",
    helmetDescription: "Pour entretenir la coque et l’écran.",
    chainLubeOption: "Lubrifiant de chaîne",
    visorCleanerOption: "Nettoyant pour visière",
    correctTitle: "Bonne recommandation !",
    correctDescription: "Ceramic Detailer apporte de la brillance et laisse une couche hydrophobe qui aide à limiter l’accumulation de saletés.",
    wrongTitle: "Ce produit répond à un autre besoin.",
    wrongDescription: "La moto est déjà lavée. Le client cherche un produit de finition. Réessaie.",
    speedBonus: "Bonus de rapidité",
    timeUpTitle: "Temps écoulé",
    timeUpDescription: "Rejoue et essaie de conseiller plus de clients.",
    replay: "Rejouer",
    arrowBack: "Produits précédents",
    arrowForward: "Produits suivants",
    selectProduct: "Choisis un produit",
    productNumberLabel: "Produit",
    productCategories: "Catégories de produits",
    allProducts: "Tout",
    categoryHelmets: "Casques",
    categoryTextileClothing: "Vêtements textiles",
    categoryLeatherClothing: "Vêtements en cuir",
    categoryCare: "Entretien",
    categoryAccessories: "Accessoires",
    confirmSelection: "Vérifier la sélection",
  },
  it: {
    round: "Servi 15 clienti",
    demoNote: "15 conversazioni · 3 turni a difficoltà crescente",
    customerImageAlt: "Un motociclista parla con un addetto alle vendite",
    scoreLabel: "Il tuo punteggio",
    pointsUnit: "punti",
    timerLabel: "Tempo",
    levelLabel: "Livello",
    levelProgressLabel: "Clienti serviti in questo turno",
    sceneEyebrow: "ESPERTO DI MOTO · ALLENAMENTO ALLA VENDITA",
    shelfTitle: "Cosa consiglieresti al cliente?",
    question: "Dopo il lavaggio vorrei dare brillantezza alla moto e proteggerla dallo sporco. Cosa mi consigli?",
    product: "Ceramic Detailer",
    productDescription: "Dona brillantezza e lascia uno strato idrofobico che aiuta a ridurre l’accumulo di sporco.",
    productType: "Cura della moto",
    washOption: "Prodotto per il lavaggio della moto",
    washDescription: "Per rimuovere lo sporco durante il lavaggio.",
    helmetOption: "Prodotto per la pulizia del casco",
    helmetDescription: "Per la cura della calotta e della visiera.",
    chainLubeOption: "Lubrificante per catena",
    visorCleanerOption: "Detergente per visiera",
    correctTitle: "Ottimo consiglio!",
    correctDescription: "Ceramic Detailer dona brillantezza e lascia uno strato idrofobico che aiuta a ridurre l’accumulo di sporco.",
    wrongTitle: "Questo prodotto serve per un’altra esigenza.",
    wrongDescription: "La moto è già stata lavata e il cliente cerca un prodotto per la finitura. Riprova.",
    speedBonus: "Bonus velocità",
    timeUpTitle: "Tempo scaduto",
    timeUpDescription: "Gioca di nuovo e prova a servire più clienti.",
    replay: "Gioca ancora",
    arrowBack: "Prodotti precedenti",
    arrowForward: "Prodotti successivi",
    selectProduct: "Scegli un prodotto",
    productNumberLabel: "Prodotto",
    productCategories: "Categorie di prodotti",
    allProducts: "Tutti",
    categoryHelmets: "Caschi",
    categoryTextileClothing: "Abbigliamento in tessuto",
    categoryLeatherClothing: "Abbigliamento in pelle",
    categoryCare: "Cura",
    categoryAccessories: "Accessori",
    confirmSelection: "Verifica la selezione",
  },
};

const CONVERSATION_COPY: Record<GameLanguage, { answerPrompt: string; completeTitle: string; completePrompt: string }> = {
  pl: { answerPrompt: "Co odpowiesz klientowi?", completeTitle: "Zmiana zakończona", completePrompt: "To wszyscy klienci na dziś. Zobacz wynik i zagraj ponownie." },
  en: { answerPrompt: "What would you tell the customer?", completeTitle: "Shift complete", completePrompt: "That’s all the customers for today. See your score and play again." },
  de: { answerPrompt: "Was antwortest du dem Kunden?", completeTitle: "Schicht beendet", completePrompt: "Das waren alle Kunden für heute. Sieh dir dein Ergebnis an und spiele noch einmal." },
  cs: { answerPrompt: "Co zákazníkovi odpovíš?", completeTitle: "Směna skončila", completePrompt: "To byli všichni dnešní zákazníci. Podívej se na výsledek a zahraj si znovu." },
  fr: { answerPrompt: "Que réponds-tu au client ?", completeTitle: "Service terminé", completePrompt: "C’étaient tous les clients du jour. Consulte ton score et rejoue." },
  it: { answerPrompt: "Cosa risponderesti al cliente?", completeTitle: "Turno completato", completePrompt: "Questi erano tutti i clienti di oggi. Guarda il punteggio e gioca ancora." },
};

const PRODUCT_INFO_COPY: Record<GameLanguage, {
  button: string;
  title: string;
  category: string;
  close: string;
  categoryDescriptions: Record<GameProductCategory, string>;
  refresherDescription: string;
  helmetRefresherDescription: string;
  textileWashDescription: string;
  ceramicDetailerDescription: string;
}> = {
  pl: {
    button: "Info",
    title: "Informacje o produkcie",
    category: "Kategoria",
    close: "Zamknij",
    categoryDescriptions: {
      helmets: "Produkt do pielęgnacji kasku. Dopasuj go do miejsca użycia: wnętrza, skorupy albo wizjera; sprawdź wskazówki na etykiecie.",
      "textile-clothing": "Produkt do pielęgnacji odzieży tekstylnej i technicznej. Sprawdź rodzaj tkaniny oraz zalecenia producenta, zwłaszcza przy membranach.",
      "leather-clothing": "Produkt do czyszczenia i pielęgnacji odzieży skórzanej. Sprawdź rodzaj skóry oraz zalecenia producenta.",
      care: "Produkt do mycia lub pielęgnacji motocykla. Sprawdź na etykiecie, na jakich powierzchniach można go stosować.",
      accessories: "Akcesorium wspierające czyszczenie lub pielęgnację. Dobierz je do powierzchni i używanego środka.",
    },
    refresherDescription: "Odświeża odzież motocyklową, rękawice i buty między praniami. Jony srebra pomagają ograniczyć nieprzyjemne zapachy.",
    helmetRefresherDescription: "Odświeża wnętrze kasku i pomaga ograniczyć nieprzyjemne zapachy między czyszczeniami. Nie zastępuje mycia.",
    textileWashDescription: "Płyn do prania odzieży technicznej i motocyklowej. Pomaga usuwać pot i zabrudzenia, dbając o właściwości materiału. Nie używaj płynu do płukania.",
    ceramicDetailerDescription: "Szybki detailer do czystej powierzchni motocykla po myciu: dodaje połysk i efekt hydrofobowy, ułatwia późniejsze mycie. To nie jest klasyczna powłoka ceramiczna.",
  },
  en: {
    button: "Info",
    title: "Product information",
    category: "Category",
    close: "Close",
    categoryDescriptions: {
      helmets: "A helmet care product. Check whether it is intended for the lining, shell, or visor, and follow the label.",
      "textile-clothing": "A care product for textile and technical clothing. Check the fabric and manufacturer’s instructions, especially for membrane garments.",
      "leather-clothing": "A cleaning and care product for leather motorcycle clothing. Check the leather type and garment instructions.",
      care: "A motorcycle cleaning or care product. Check the label to see which surfaces it can be used on.",
      accessories: "An accessory for cleaning or care. Match it to the surface and the product you are using.",
    },
    refresherDescription: "Freshens motorcycle clothing, gloves and boots between washes. Silver ions help reduce unpleasant odours.",
    helmetRefresherDescription: "Refreshes the helmet interior and helps reduce unpleasant odours between cleanings. It does not replace washing.",
    textileWashDescription: "A detergent for technical and motorcycle clothing. Helps remove sweat and dirt while caring for fabric performance. Do not use fabric softener.",
    ceramicDetailerDescription: "A quick detailer for a clean motorcycle after washing: adds shine and water repellency, and makes future washes easier. It is not a traditional ceramic coating.",
  },
  de: {
    button: "Info",
    title: "Produktinformationen",
    category: "Kategorie",
    close: "Schließen",
    categoryDescriptions: {
      helmets: "Ein Pflegeprodukt für Helme. Prüfe, ob es für Innenfutter, Helmschale oder Visier gedacht ist, und beachte das Etikett.",
      "textile-clothing": "Ein Pflegeprodukt für Textil- und Funktionsbekleidung. Beachte das Gewebe und die Pflegehinweise, besonders bei Membrankleidung.",
      "leather-clothing": "Ein Reinigungs- und Pflegeprodukt für Motorrad-Lederbekleidung. Beachte Lederart und Pflegehinweise.",
      care: "Ein Reinigungs- oder Pflegeprodukt für Motorräder. Prüfe auf dem Etikett, für welche Oberflächen es geeignet ist.",
      accessories: "Ein Zubehörteil für Reinigung oder Pflege. Stimme es auf die Oberfläche und das verwendete Mittel ab.",
    },
    refresherDescription: "Frischt Motorradbekleidung, Handschuhe und Stiefel zwischen den Wäschen auf. Silberionen helfen, unangenehme Gerüche zu reduzieren.",
    helmetRefresherDescription: "Erfrischt das Helminnere und hilft, unangenehme Gerüche zwischen den Reinigungen zu reduzieren. Es ersetzt keine Wäsche.",
    textileWashDescription: "Waschmittel für technische und Motorradbekleidung. Entfernt Schweiß und Schmutz und schont die Funktion des Materials. Keinen Weichspüler verwenden.",
    ceramicDetailerDescription: "Ein Detailer für die saubere Oberfläche nach der Motorradwäsche: sorgt für Glanz und Wasserabweisung und erleichtert die nächste Wäsche. Keine klassische Keramikversiegelung.",
  },
  cs: {
    button: "Info",
    title: "Informace o produktu",
    category: "Kategorie",
    close: "Zavřít",
    categoryDescriptions: {
      helmets: "Přípravek na péči o helmu. Ověřte, zda je určený na výstelku, skořepinu, nebo hledí, a řiďte se etiketou.",
      "textile-clothing": "Přípravek na péči o textilní a funkční oblečení. Zkontrolujte materiál a pokyny výrobce, zejména u membrán.",
      "leather-clothing": "Přípravek na čištění a péči o kožené motocyklové oblečení. Zkontrolujte typ kůže a pokyny výrobce.",
      care: "Přípravek na čištění nebo péči o motocykl. Na etiketě ověřte, na které povrchy se smí používat.",
      accessories: "Pomůcka pro čištění nebo péči. Zvolte ji podle povrchu a používaného přípravku.",
    },
    refresherDescription: "Osvěžuje moto oblečení, rukavice a boty mezi praním. Stříbrné ionty pomáhají omezit nepříjemné pachy.",
    helmetRefresherDescription: "Osvěžuje vnitřek helmy a pomáhá omezit nepříjemné pachy mezi čištěními. Nenahrazuje mytí.",
    textileWashDescription: "Prací prostředek na funkční a motocyklové oblečení. Pomáhá odstranit pot a nečistoty a zachovat vlastnosti materiálu. Nepoužívejte aviváž.",
    ceramicDetailerDescription: "Rychlý detailer na čistý povrch motocyklu po mytí: dodá lesk a hydrofobní efekt a usnadní další mytí. Nejde o klasickou keramickou ochranu.",
  },
  fr: {
    button: "Info",
    title: "Informations sur le produit",
    category: "Catégorie",
    close: "Fermer",
    categoryDescriptions: {
      helmets: "Produit d’entretien pour casque. Vérifie s’il convient à l’intérieur, à la coque ou à la visière et suis l’étiquette.",
      "textile-clothing": "Produit d’entretien pour vêtements textiles et techniques. Vérifie le tissu et les consignes du fabricant, surtout pour les membranes.",
      "leather-clothing": "Produit de nettoyage et d’entretien pour vêtements moto en cuir. Vérifie le type de cuir et les consignes du fabricant.",
      care: "Produit de nettoyage ou d’entretien pour moto. Vérifie sur l’étiquette les surfaces compatibles.",
      accessories: "Accessoire de nettoyage ou d’entretien. Choisis-le selon la surface et le produit utilisé.",
    },
    refresherDescription: "Rafraîchit les vêtements de moto, les gants et les bottes entre les lavages. Les ions d’argent aident à réduire les mauvaises odeurs.",
    helmetRefresherDescription: "Rafraîchit l’intérieur du casque et aide à réduire les mauvaises odeurs entre deux nettoyages. Ne remplace pas le lavage.",
    textileWashDescription: "Lessive pour vêtements techniques et moto. Aide à éliminer la transpiration et la saleté tout en préservant les propriétés du tissu. Ne pas utiliser d’adoucissant.",
    ceramicDetailerDescription: "Detailer rapide pour une moto propre après lavage : ajoute de la brillance et un effet déperlant, et facilite les lavages suivants. Ce n’est pas un revêtement céramique classique.",
  },
  it: {
    button: "Info",
    title: "Informazioni sul prodotto",
    category: "Categoria",
    close: "Chiudi",
    categoryDescriptions: {
      helmets: "Prodotto per la cura del casco. Verifica se è indicato per l’imbottitura, la calotta o la visiera e segui le istruzioni sull’etichetta.",
      "textile-clothing": "Prodotto per la cura dell’abbigliamento in tessuto e tecnico. Controlla il materiale e le istruzioni del produttore, soprattutto per i capi con membrana.",
      "leather-clothing": "Prodotto per la pulizia e la cura dell’abbigliamento da moto in pelle. Controlla il tipo di pelle e le istruzioni del capo.",
      care: "Prodotto per la pulizia o la cura della moto. Controlla sull’etichetta su quali superfici può essere utilizzato.",
      accessories: "Accessorio per la pulizia o la cura. Sceglilo in base alla superficie e al prodotto che stai usando.",
    },
    refresherDescription: "Rinfresca l’abbigliamento da moto, i guanti e gli stivali tra un lavaggio e l’altro. Gli ioni d’argento aiutano a ridurre gli odori sgradevoli.",
    helmetRefresherDescription: "Rinfresca l’interno del casco e aiuta a ridurre gli odori sgradevoli tra una pulizia e l’altra. Non sostituisce il lavaggio.",
    textileWashDescription: "Detergente per l’abbigliamento tecnico e da moto. Aiuta a rimuovere sudore e sporco preservando le proprietà del tessuto. Non usare l’ammorbidente.",
    ceramicDetailerDescription: "Prodotto di finitura rapido da usare su una moto pulita dopo il lavaggio: dona brillantezza e un effetto idrofobico e facilita i lavaggi successivi. Non è un rivestimento ceramico tradizionale.",
  },
};

const PRODUCT_INFO_DETAILS_PL: Record<string, string> = {
  "interior-refresher-man": "Odświeżacz z jonami srebra do odzieży motocyklowej, rękawic i butów. Pomaga ograniczać nieprzyjemne zapachy między praniami.",
  "interior-refresher-woman": "Odświeżacz z jonami srebra do odzieży motocyklowej, rękawic i butów. Pomaga ograniczać nieprzyjemne zapachy między praniami.",
  "interior-refresher-neptun": "Odświeżacz z jonami srebra do odzieży motocyklowej, rękawic i butów. Pomaga ograniczać nieprzyjemne zapachy między praniami.",
  "freshener-orange-spritz": "Odświeżacz z jonami srebra do odzieży motocyklowej, rękawic i butów. Pomaga odświeżyć wyposażenie między praniami.",
  "helmet-freshener-mint": "Odświeżacz do wnętrza kasku. Pomaga odświeżyć wyściółkę między czyszczeniami; ma miętowy zapach.",
  "leather-care-balm": "Mleczko do konserwacji odzieży skórzanej. Pielęgnuje skórę matową i błyszczącą, bez tłustego filmu.",
  "leather-cleaner": "Środek do czyszczenia odzieży skórzanej. Użyj go przed nałożeniem produktu do konserwacji skóry.",
  "leather-cleaning-brush": "Szczotka przeznaczona do czyszczenia odzieży skórzanej.",
  "helmet-interior-care": "Płyn do prania wyściółki kasku. Sprawdź zalecenia producenta kasku przed czyszczeniem.",
  "helmet-interior-care-sachet": "Porcja płynu do ręcznego prania wyściółki kasku, wygodna w podróży.",
  "helmet-cleaning-gel": "Żel do czyszczenia kasku. Dobierz go do czyszczonej powierzchni i stosuj zgodnie z etykietą.",
  "helmet-cleaning-gel-mini": "Podróżna wersja żelu do czyszczenia kasku.",
  "helmet-detailer": "Preparat do wykończenia i pielęgnacji kasku po czyszczeniu.",
  "helmet-detailer-mini": "Podróżna wersja preparatu do wykończenia i pielęgnacji kasku.",
  "helmet-care-kit": "Zestaw produktów do kompleksowej pielęgnacji kasku.",
  "helmet-care-trip-kit": "Podręczny zestaw do pielęgnacji kasku w podróży.",
  "helmet-cleaning-trip-kit": "Podręczny zestaw do czyszczenia kasku w podróży.",
  "zip-service-agent": "Preparat do serwisu zamków błyskawicznych, opracowany tak, by nie zostawiać tłustych plam.",
  "textile-washing-liquid": "Płyn do prania odzieży motocyklowej i technicznej, także z tkaninami membranowymi. Nie używaj płynu do płukania.",
  "fabric-protect-freshness-extender": "Dodatek do prania, który pomaga przedłużyć świeżość odzieży technicznej. Stosuje się go zamiast klasycznego płynu do płukania.",
  "active-care-sportswear-wash": "Płyn do prania odzieży termoaktywnej i sportowej oraz mikrofibry.",
  "active-care-sportswear-sachet": "Porcja płynu do prania odzieży termoaktywnej i mikrofibry, wygodna na wyjazd.",
  "merino-care-wash": "Płyn do prania odzieży z wełny i delikatnych tkanin.",
  "jeans-care-liquid": "Płyn do prania odzieży jeansowej, w tym jeansu z włóknami Kevlar.",
  "jeans-care-sachet": "Porcja płynu Jeans Care do prania jeansu i odzieży z Kevlarem.",
  "textile-care-kit": "Zestaw produktów do prania i pielęgnacji odzieży tekstylnej.",
  "leather-care-kit": "Zestaw produktów do czyszczenia i pielęgnacji odzieży skórzanej.",
  "magic-gloves-cleaner": "Produkt do czyszczenia wnętrza rękawic, który pomaga neutralizować nieprzyjemne zapachy.",
  "motorcycle-detailing-set": "Kompletny zestaw do mycia, pielęgnacji i ochrony motocykla.",
  "power-powder-moto-wash": "Koncentrat do mycia motocykla i przygotowania aktywnej piany.",
  "power-powder-bug-killer": "Koncentrat do usuwania pozostałości owadów z motocykla.",
  "power-powder-wheelixir": "Koncentrat do czyszczenia felg i mocnych zabrudzeń.",
  "power-powder-shaker": "Butelka z regulowanym atomizerem do przygotowywania i aplikowania produktów Power Powder.",
  "motorcycle-ceramic-detailer": "Detailer do wykończenia i ochrony lakieru motocykla. Nadaje połysk i efekt hydrofobowy po myciu.",
  "wash-and-ride-cleaner": "Szybki środek do czyszczenia motocykla bez użycia wody.",
  "mud-breaker": "Środek do usuwania błota i zabrudzeń z motocykla.",
  "dirt-finisher": "Środek do czyszczenia motocykla i pielęgnacji powierzchni po jeździe.",
  "washing-booster-active-oxygen": "Dodatek do prania z aktywnym tlenem.",
  "premium-microfiber": "Miękka mikrofibra do pracy przy czyszczeniu i pielęgnacji.",
  "fiber-hand": "Rękawica z włókna do mycia motocykla.",
  "detailing-fiber": "Ściereczka z mikrofibry do prac detailingowych przy motocyklu.",
  "microfiber-cloths-roll": "Rolka zawierająca 20 odcinków ściereczek z mikrofibry.",
  "evolon-detailing-cloths": "Zestaw dwóch ściereczek Evolon do prac detailingowych.",
  "wheel-brush": "Szczotka do czyszczenia kół i trudno dostępnych miejsc przy feldze.",
  "motorcycle-detailing-soft-brush": "Miękka szczotka do delikatnego czyszczenia elementów motocykla.",
  "chain-brush": "Trójstronna szczotka do czyszczenia łańcucha motocyklowego.",
  "wooden-knee-sliders": "Drewniane slidery do kolan przeznaczone do jazdy na torze.",
  "need-speed-hoodie": "Bluza z kapturem z kolekcji Need Speed.",
};

function getProductInfoDescription(product: ProductChoice, language: AcademyLanguage) {
  const info = getGameCopy(PRODUCT_INFO_COPY, language);
  if (language === "pl" && PRODUCT_INFO_DETAILS_PL[product.id]) return PRODUCT_INFO_DETAILS_PL[product.id];
  if (product.id === "helmet-freshener-mint") return info.helmetRefresherDescription;
  if (product.id.startsWith("interior-refresher-") || product.id === "freshener-orange-spritz") return info.refresherDescription;
  if (product.id === "textile-washing-liquid") return info.textileWashDescription;
  if (product.id === "motorcycle-ceramic-detailer") return info.ceramicDetailerDescription;
  return info.categoryDescriptions[product.category];
}

const CHOICE_FEEDBACK_COPY: Record<GameLanguage, {
  bestProduct: string;
  acceptableProduct: string;
  acceptableSelection: string;
  wrongProduct: string;
  wrongSelection: string;
  correctAnswer: string;
  wrongAnswer: string;
}> = {
  pl: {
    bestProduct: "Najlepsze dopasowanie!",
    acceptableProduct: "Ten produkt pasuje, ale lepszy będzie: ",
    acceptableSelection: "Ten zestaw też pasuje, ale lepszy wybór to: ",
    wrongProduct: "Ten produkt nie odpowiada potrzebie klienta. Spróbuj inaczej.",
    wrongSelection: "Ten zestaw nie odpowiada całej potrzebie klienta. Zmień wybór.",
    correctAnswer: "Dobra odpowiedź!",
    wrongAnswer: "To nie ta odpowiedź. Spróbuj ponownie.",
  },
  en: {
    bestProduct: "Best match!",
    acceptableProduct: "This product works, but a better choice is: ",
    acceptableSelection: "This set also works, but the better choice is: ",
    wrongProduct: "This product does not meet the customer's need. Try another.",
    wrongSelection: "This set does not meet the customer's full need. Change your selection.",
    correctAnswer: "Correct answer!",
    wrongAnswer: "That is not the right answer. Try again.",
  },
  de: {
    bestProduct: "Beste Empfehlung!",
    acceptableProduct: "Das Produkt passt, aber besser geeignet ist: ",
    acceptableSelection: "Dieses Set passt auch, aber besser geeignet ist: ",
    wrongProduct: "Dieses Produkt passt nicht zum Bedarf des Kunden. Versuche ein anderes.",
    wrongSelection: "Dieses Set deckt den Bedarf des Kunden nicht vollständig ab. Ändere deine Auswahl.",
    correctAnswer: "Richtige Antwort!",
    wrongAnswer: "Das ist nicht die richtige Antwort. Versuch es noch einmal.",
  },
  cs: {
    bestProduct: "Nejlepší volba!",
    acceptableProduct: "Tento produkt se hodí, ale lepší volbou je: ",
    acceptableSelection: "Tato sada se také hodí, ale lepší volbou je: ",
    wrongProduct: "Tento produkt neodpovídá potřebě zákazníka. Vyberte jiný.",
    wrongSelection: "Tato sada neřeší celou potřebu zákazníka. Změňte výběr.",
    correctAnswer: "Správná odpověď!",
    wrongAnswer: "To není správná odpověď. Zkuste to znovu.",
  },
  fr: {
    bestProduct: "Meilleur choix !",
    acceptableProduct: "Ce produit convient, mais le meilleur choix est : ",
    acceptableSelection: "Ce kit convient aussi, mais le meilleur choix est : ",
    wrongProduct: "Ce produit ne répond pas au besoin du client. Essaie-en un autre.",
    wrongSelection: "Ce kit ne répond pas à tous les besoins du client. Modifie ta sélection.",
    correctAnswer: "Bonne réponse !",
    wrongAnswer: "Ce n'est pas la bonne réponse. Réessaie.",
  },
  it: {
    bestProduct: "La scelta migliore!",
    acceptableProduct: "Questo prodotto va bene, ma una scelta migliore è: ",
    acceptableSelection: "Anche questo set va bene, ma la scelta migliore è: ",
    wrongProduct: "Questo prodotto non risponde alle esigenze del cliente. Prova con un altro.",
    wrongSelection: "Questo set non risponde a tutte le esigenze del cliente. Modifica la selezione.",
    correctAnswer: "Risposta corretta!",
    wrongAnswer: "Non è la risposta giusta. Riprova.",
  },
};

type GameDifficulty = CustomerAdviceScenario["difficulty"];

function getRoundDuration(difficulty: GameDifficulty, contestantId: ContestantId) {
  return ROUND_SECONDS_BY_DIFFICULTY[difficulty]
    + (difficulty === "easy" && contestantId === "two" ? CHARACTER_TIME_BONUS_SECONDS : 0);
}

const ROUND_STAGE_COPY: Record<GameLanguage, Record<GameDifficulty, string>> = {
  pl: {
    easy: "Runda 1",
    medium: "Runda 2",
    hard: "Runda 3",
  },
  en: {
    easy: "Round 1",
    medium: "Round 2",
    hard: "Round 3",
  },
  de: {
    easy: "Runde 1",
    medium: "Runde 2",
    hard: "Runde 3",
  },
  cs: {
    easy: "Kolo 1",
    medium: "Kolo 2",
    hard: "Kolo 3",
  },
  fr: {
    easy: "Manche 1",
    medium: "Manche 2",
    hard: "Manche 3",
  },
  it: {
    easy: "Turno 1",
    medium: "Turno 2",
    hard: "Turno 3",
  },
};

type ProductChoice = {
  id: string;
  category: GameProductCategory;
  result: "best" | "acceptable" | "incorrect";
  name: string;
  image: string;
};

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }
  return shuffled;
}

function createScenarioDeck() {
  return ROUND_DIFFICULTY_PLAN.flatMap(({ difficulty, count }) =>
    shuffleItems(CUSTOMER_ADVICE_SCENARIOS.filter((scenario) => scenario.difficulty === difficulty)).slice(0, count),
  )
    .map((scenario) => {
      const availableOptionalQuestions = scenario.optionalQuestions ?? [];
      const selectedOptionalQuestion = availableOptionalQuestions.length > 0 && Math.random() < 0.72
        ? shuffleItems(availableOptionalQuestions)[0]
        : undefined;

      const turns: CustomerAdviceTurn[] = scenario.turns.flatMap((turn, turnIndex) => {
        const randomizedTurn: CustomerAdviceTurn = turn.kind === "product"
          ? { ...turn, productIds: shuffleItems(turn.productIds) }
          : { ...turn, answers: shuffleItems(turn.answers) };
        const optionalTurn = selectedOptionalQuestion?.afterTurnIndex === turnIndex
          ? { ...selectedOptionalQuestion.turn, answers: shuffleItems(selectedOptionalQuestion.turn.answers) }
          : undefined;

        return optionalTurn ? [randomizedTurn, optionalTurn] : [randomizedTurn];
      });

      return { ...scenario, turns };
    });
}

function sameProductSelection(selected: string[], expected: string[]) {
  return selected.length === expected.length && expected.every((productId) => selected.includes(productId));
}

function applyContestantPointsBonus(points: number, contestantId: ContestantId) {
  return contestantId === "one" ? Math.round(points * CHARACTER_POINTS_MULTIPLIER) : points;
}

type ContestantEntry = {
  id: ContestantId;
  image: string | null;
  label: string;
  perk: "points" | "time";
};

type CharacterBonusCopy = {
  pointsTitle: string;
  pointsDetail: string;
  timeTitle: string;
  timeDetail: string;
};

const CHARACTER_BONUS_COPY: Record<GameLanguage, CharacterBonusCopy> = {
  pl: { pointsTitle: "+10% punkt\u00f3w", pointsDetail: "za dobre odpowiedzi", timeTitle: "+20 sekund", timeDetail: "na start gry" },
  en: { pointsTitle: "+10% points", pointsDetail: "for correct answers", timeTitle: "+20 seconds", timeDetail: "at the start" },
  de: { pointsTitle: "+10% Punkte", pointsDetail: "f\u00fcr richtige Antworten", timeTitle: "+20 Sekunden", timeDetail: "zu Beginn" },
  cs: { pointsTitle: "+10% bod\u016f", pointsDetail: "za spr\u00e1vn\u00e9 odpov\u011bdi", timeTitle: "+20 sekund", timeDetail: "na za\u010d\u00e1tku hry" },
  fr: { pointsTitle: "+10% de points", pointsDetail: "pour les bonnes r\u00e9ponses", timeTitle: "+20 secondes", timeDetail: "au d\u00e9but" },
  it: { pointsTitle: "+10% punti", pointsDetail: "per le risposte corrette", timeTitle: "+20 secondi", timeDetail: "all’inizio" },
};

function ContestantPortrait({ contestant, label }: { contestant: ContestantEntry; label: string }) {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative aspect-[4/5] w-full">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[8%] bottom-[4%] z-0 h-[78%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.3)_0%,rgba(34,211,238,0.12)_42%,transparent_72%)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
        {contestant.image ? (
          <Image src={contestant.image} alt="" fill sizes="(max-width: 640px) 42vw, 416px" className="z-10 object-contain object-bottom drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)] transition-[filter,transform] duration-300 group-hover:-translate-y-1 group-hover:drop-shadow-[0_0_28px_rgba(34,211,238,0.58)]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-cyan-100/80">
            <RiMotorbikeLine className="size-[42%] drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]" aria-hidden="true" />
          </div>
        )}
      </div>
      <span className="relative z-20 mt-1.5 font-game text-base font-bold uppercase tracking-[0.16em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] sm:text-xl">
        {label}
      </span>
    </div>
  );
}

function ContestantBonusBadge({
  contestant,
  bonusCopy,
  side,
}: {
  contestant: ContestantEntry;
  bonusCopy: CharacterBonusCopy;
  side: "left" | "right";
}) {
  const hasPointsBonus = contestant.perk === "points";
  const bonusTitle = hasPointsBonus ? bonusCopy.pointsTitle : bonusCopy.timeTitle;
  const bonusDetail = hasPointsBonus ? bonusCopy.pointsDetail : bonusCopy.timeDetail;

  return (
    <div className={`pointer-events-none absolute top-[53%] z-30 flex w-[min(42vw,220px)] items-center gap-2 rounded-2xl border px-2.5 py-2 text-left shadow-[0_12px_30px_rgba(0,0,0,0.55)] backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-1 sm:top-[54%] sm:gap-3 sm:px-3.5 sm:py-3 ${side === "left" ? "left-[2%]" : "right-[2%]"} ${hasPointsBonus
      ? "border-amber-200/70 bg-gradient-to-r from-[#251707]/95 via-[#191b24]/95 to-[#101b2d]/90 shadow-amber-950/40"
      : "border-cyan-200/70 bg-gradient-to-r from-[#101b2d]/90 via-[#102332]/95 to-[#082436]/95 shadow-cyan-950/40"}`}>
      <span className={`relative grid size-10 shrink-0 place-items-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_18px_rgba(255,255,255,0.14)] sm:size-12 ${hasPointsBonus
        ? "border-amber-100/75 bg-gradient-to-br from-amber-100 via-amber-300 to-orange-500 text-[#38200a]"
        : "border-cyan-100/75 bg-gradient-to-br from-cyan-100 via-cyan-300 to-sky-500 text-[#05263c]"}`}>
        {hasPointsBonus
          ? <RiStarFill className="size-6 drop-shadow-sm transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 sm:size-7" aria-hidden="true" />
          : <RiTimer2Line className="size-6 drop-shadow-sm transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 sm:size-7" aria-hidden="true" />}
      </span>
      <span className="min-w-0">
        <span className={`block whitespace-nowrap font-game text-sm font-black uppercase tracking-wide sm:text-base ${hasPointsBonus ? "text-amber-100" : "text-cyan-100"}`}>
          {bonusTitle}
        </span>
        <span className="block text-[10px] font-semibold leading-tight text-white/80 sm:text-xs">
          {bonusDetail}
        </span>
      </span>
    </div>
  );
}

function ContestantStageFigure({ contestant, label }: { contestant: ContestantEntry; label: string }) {
  return (
    <div className="relative h-full w-full">
      {contestant.image ? (
        <div className="absolute inset-x-0 top-0 bottom-8">
          <Image src={contestant.image} alt="" fill sizes="(max-width: 640px) 30vw, 400px" className="object-contain object-bottom drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)]" />
        </div>
      ) : (
        <div className="absolute bottom-[14%] left-1/2 grid aspect-square w-[66%] -translate-x-1/2 place-items-center rounded-full border border-cyan-200/30 bg-[#061629]/75 text-cyan-100/80 shadow-[0_0_28px_rgba(34,211,238,0.15)]">
          <RiMotorbikeLine className="size-[45%] drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]" aria-hidden="true" />
        </div>
      )}
      <span className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-cyan-200/30 bg-[#061629]/85 px-3 py-1 text-center font-game text-[10px] font-bold uppercase tracking-[0.1em] text-white drop-shadow sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function ContestStartScreen({ copy, onStart }: { copy: ContestFlowCopy; onStart: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[1360px] px-3 pb-8 font-game sm:px-6 lg:px-8">
      <section className="relative isolate h-[min(78svh,800px)] min-h-[460px] overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[#061629] shadow-2xl shadow-black/40 sm:min-h-[560px]">
        <div className="game-screen-arrive relative h-full w-full">
        <Image src={`${CONTEST_ASSETS}/contest-start-background.png`} alt="" fill priority sizes="(max-width: 768px) 100vw, 1360px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#03101e]/85 via-[#03101e]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#03101e]/65 to-transparent" />
        <div className="absolute left-[7%] top-1/2 z-10 w-[min(640px,70%)] -translate-y-1/2 sm:left-[9%]">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200 sm:text-sm">{copy.titleEyebrow}</p>
          <h1 className="max-w-[620px] font-game text-5xl font-black uppercase leading-[0.95] tracking-[0.02em] text-white drop-shadow-[0_5px_18px_rgba(0,0,0,0.8)] sm:text-6xl lg:text-7xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-slate-100 drop-shadow-lg sm:text-lg">
            {copy.tagline}
          </p>
          <button
            type="button"
            onClick={onStart}
            aria-label={copy.start}
            className="mt-7 block w-[min(300px,70vw)] origin-left transition-transform duration-150 hover:scale-[1.035] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:w-[350px]"
          >
            <Image src={`${CONTEST_ASSETS}/button-start.png`} alt="" width={1000} height={400} className="game-start-button-glow h-auto w-full object-contain" />
          </button>
        </div>
        </div>
      </section>
    </div>
  );
}

function ContestantSelectionScreen({
  copy,
  language,
  contestants,
  isLeaving,
  onBack,
  onChoose,
}: {
  copy: ContestFlowCopy;
  language: AcademyLanguage;
  contestants: ContestantEntry[];
  isLeaving: boolean;
  onBack: () => void;
  onChoose: (contestantId: ContestantId) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1360px] px-3 pb-8 font-game sm:px-6 lg:px-8">
      <section className={`relative isolate h-[min(78svh,800px)] min-h-[460px] overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[#061629] shadow-2xl shadow-black/40 sm:min-h-[560px] ${isLeaving ? "pointer-events-none" : ""}`}>
        <div className="game-screen-arrive relative h-full w-full">
        <Image src={`${GAME_ASSETS}/shop-background-1.webp`} alt="" fill sizes="(max-width: 768px) 100vw, 1360px" className="object-cover" />
        <div className="absolute inset-0 bg-[#061629]/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#03101e]/75 via-transparent to-[#03101e]/75" />
        <button
          type="button"
          onClick={onBack}
          aria-label={copy.back}
          className="absolute left-3 top-3 z-30 grid size-14 place-items-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:left-5 sm:top-5 sm:size-[72px]"
        >
          <Image src={`${GAME_ASSETS}/arrow-left-button.webp`} alt="" width={100} height={100} className="size-full object-contain drop-shadow-lg" />
        </button>
        <div className="absolute inset-x-4 top-[9%] z-10 text-center sm:top-[10%]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200 sm:text-xs">{copy.titleEyebrow}</p>
          <h1 className="mt-2 font-game text-3xl font-black uppercase tracking-[0.02em] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] sm:text-5xl">
            {copy.chooseTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-white/85 drop-shadow sm:text-base">{copy.chooseHint}</p>
        </div>
        <div className="absolute inset-x-0 bottom-[2.5%] z-10 flex items-end justify-center gap-2 px-3 sm:bottom-[4%] sm:gap-4">
          {contestants.map((contestant, index) => (
            <button
              key={contestant.id}
              type="button"
              onClick={() => onChoose(contestant.id)}
              disabled={isLeaving}
              className="group relative w-[min(42vw,416px)] shrink-0 transition-transform duration-200 hover:scale-[1.035] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
      <div className={`relative ${isLeaving
                ? index === 0 ? "game-character-slide-left-out" : "game-character-slide-right-out"
                : index === 0 ? "game-character-slide-left-in" : "game-character-slide-right-in"}`}
              >
                <ContestantPortrait contestant={contestant} label={contestant.label} />
                <ContestantBonusBadge
                  contestant={contestant}
                  bonusCopy={getGameCopy(CHARACTER_BONUS_COPY, language)}
                  side={index === 0 ? "left" : "right"}
                />
              </div>
            </button>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}

function TypewriterText({
  text,
  characterDelay = 18,
  startDelay = 0,
  onStart,
}: {
  text: string;
  characterDelay?: number;
  startDelay?: number;
  onStart?: () => void;
}) {
  const [visibleCharacterCount, setVisibleCharacterCount] = useState(0);
  const startedTextRef = useRef<string | null>(null);
  const characters = Array.from(text);

  useEffect(() => {
    const textCharacters = Array.from(text);
    if (textCharacters.length === 0) return;

    setVisibleCharacterCount(0);
    let visibleCharacters = 0;
    let timeoutId: number | null = null;
    let startTimer: number | null = null;
    const beginText = () => {
      if (startedTextRef.current !== text) {
        startedTextRef.current = text;
        onStart?.();
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVisibleCharacterCount(textCharacters.length);
        return;
      }

      const revealNextCharacter = () => {
        visibleCharacters += 1;
        setVisibleCharacterCount(visibleCharacters);

        if (visibleCharacters >= textCharacters.length) return;

        const lastCharacter = textCharacters[visibleCharacters - 1];
        const pause = /[.!?]/.test(lastCharacter) ? 105 : /[,;:]/.test(lastCharacter) ? 55 : characterDelay;
        timeoutId = window.setTimeout(revealNextCharacter, pause);
      };

      timeoutId = window.setTimeout(revealNextCharacter, 180);
    };

    startTimer = window.setTimeout(beginText, startDelay);
    return () => {
      if (startTimer !== null) window.clearTimeout(startTimer);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [characterDelay, onStart, startDelay, text]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {characters.slice(0, visibleCharacterCount).join("")}
        {visibleCharacterCount < characters.length ? <span className="game-typewriter-caret" /> : null}
      </span>
    </>
  );
}

function ContestIntroScreen({
  copy,
  contestants,
  selectedContestantIndex,
  beat,
  isLeaving,
  onVoiceStart,
  onBack,
  onAdvance,
}: {
  copy: ContestFlowCopy;
  contestants: ContestantEntry[];
  selectedContestantIndex: number;
  beat: number;
  isLeaving: boolean;
  onVoiceStart: () => void;
  onBack: () => void;
  onAdvance: () => void;
}) {
  const replies = [copy.selectedReply, copy.rivalReply];

  return (
    <div className="mx-auto w-full max-w-[1360px] px-3 pb-8 font-game sm:px-6 lg:px-8">
      <section className={`relative isolate h-[min(78svh,800px)] min-h-[460px] overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[#061629] shadow-2xl shadow-black/40 sm:min-h-[560px] ${isLeaving ? "pointer-events-none" : ""}`}>
        <div className="game-screen-arrive relative h-full w-full">
        <Image src={`${GAME_ASSETS}/shop-background-1.webp`} alt="" fill sizes="(max-width: 768px) 100vw, 1360px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061629]/60 via-[#061629]/10 to-[#061629]/70" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-[40%] bg-gradient-to-t from-[#071523]/50 to-transparent" />
        <div className="absolute bottom-0 left-[-2%] z-30 h-[79%] w-[30%]">
          <Image src={`${CONTEST_ASSETS}/contest-boss-manager.png`} alt={copy.managerAlt} fill sizes="(max-width: 768px) 34vw, 400px" className="object-contain object-bottom drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)]" />
        </div>
        <div className="absolute bottom-[5%] left-[18%] z-[25] h-[36%] w-[32%] sm:bottom-[7%] sm:h-[40%] sm:w-[32%]">
          <div aria-hidden="true" className="pointer-events-none absolute -inset-[12%] z-20 mix-blend-screen">
            <span className="game-prize-glow absolute inset-[4%] rounded-full" />
            <span className="game-prize-ring absolute inset-[17%_2%_8%] rounded-[50%] border-2 border-cyan-100/85 shadow-[0_0_20px_rgba(34,211,238,0.85),inset_0_0_14px_rgba(34,211,238,0.25)]" />
            <span className="game-prize-ring game-prize-ring-delay absolute inset-[25%_10%_16%] rounded-[50%] border-2 border-amber-100/80 shadow-[0_0_22px_rgba(250,204,21,0.8)]" />
            <span className="game-prize-spark absolute left-[15%] top-[28%] size-2 rounded-full bg-cyan-50 shadow-[0_0_14px_5px_rgba(103,232,249,0.85)]" />
            <span className="game-prize-spark game-prize-spark-delay absolute right-[13%] top-[35%] size-1.5 rounded-full bg-amber-100 shadow-[0_0_12px_4px_rgba(253,224,71,0.8)]" />
          </div>
          <Image src={`${CONTEST_ASSETS}/contest-prize-motorcycle.png`} alt={copy.motorcycleAlt} fill sizes="(max-width: 768px) 50vw, 600px" className="z-10 object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)]" />
        </div>
        <div className="absolute bottom-0 right-0 z-20 flex h-[80%] w-[54%] items-end gap-2 sm:gap-3">
          {contestants.map((contestant, index) => {
            return (
              <div
                key={contestant.id}
                className={`h-full min-w-0 flex-1 transition-[filter,transform] duration-300 ${index === 0 ? "game-character-slide-left-in" : "game-character-slide-right-in"} ${isLeaving ? index === 0 ? "game-character-slide-left-out" : "game-character-slide-right-out" : ""}`}
              >
                <ContestantStageFigure contestant={contestant} label={contestant.label} />
              </div>
            );
          })}
        </div>
        <p className="absolute left-[12%] top-[4%] z-30 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-100 sm:left-[10%] sm:top-[5%] sm:text-xs">{copy.titleEyebrow}</p>
        <button
          type="button"
          onClick={onBack}
          aria-label={copy.back}
          className="absolute left-3 top-3 z-30 grid size-12 place-items-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:left-5 sm:top-4 sm:size-14"
        >
          <Image src={`${GAME_ASSETS}/arrow-left-button.webp`} alt="" width={100} height={100} className="size-full object-contain drop-shadow-lg" />
        </button>
        {beat === 0 ? (
          <div className="absolute left-[16%] right-[27%] top-[13%] z-30 max-w-[610px] rounded-[22px] bg-white px-4 py-3 text-slate-950 shadow-[0_14px_40px_rgba(3,12,23,0.35)] sm:left-[12%] sm:right-[28%] sm:top-[13%] sm:px-6 sm:py-5">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700 sm:text-xs">{copy.manager}</span>
            <p className="text-pretty text-sm font-semibold leading-snug sm:text-lg">
              <TypewriterText text={copy.bossIntro} characterDelay={24} onStart={onVoiceStart} />
            </p>
            <span aria-hidden="true" className="absolute -bottom-2 left-[10%] size-4 rotate-45 bg-white" />
          </div>
        ) : (
          <div className="absolute left-[46%] right-[2%] top-[15%] z-30 grid gap-2 sm:left-[46%] sm:right-[3%] sm:top-[16%] sm:grid-cols-2 sm:gap-3">
            {[0, 1].map((replyIndex) => (
              <div key={replyIndex} className="rounded-[20px] border border-white/70 bg-white/95 px-3 py-2.5 text-slate-950 shadow-[0_12px_34px_rgba(3,12,23,0.3)] sm:px-4 sm:py-3">
                <span className={`mb-1 block text-[9px] font-extrabold uppercase tracking-[0.15em] sm:text-[10px] ${replyIndex === selectedContestantIndex ? "text-cyan-700" : "text-slate-500"}`}>{contestants[replyIndex].label}</span>
                <p className="text-sm font-semibold leading-snug sm:text-lg">
                  <TypewriterText text={replies[replyIndex]} onStart={onVoiceStart} />
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="absolute right-[3%] top-[3%] z-40 sm:right-[4%] sm:top-[3%]">
          {beat === 0 ? (
            <button type="button" onClick={onAdvance} aria-label={copy.next} className="game-start-button-glow flex min-h-12 min-w-[132px] items-center justify-center gap-2 rounded-full border-2 border-cyan-50 bg-gradient-to-b from-[#a5f3fc] via-[#22d3ee] to-[#0284c7] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#06243b] shadow-[0_5px_0_#075985,0_10px_26px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.85)] transition-[transform,filter,box-shadow] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_#075985,0_5px_14px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 sm:min-h-[54px] sm:min-w-[154px] sm:px-5 sm:text-base">
              <span>{copy.next}</span>
              <RiArrowRightLine className="size-5 sm:size-6" aria-hidden="true" />
            </button>
          ) : (
          <button type="button" onClick={onAdvance} aria-label={copy.begin} className="block w-[min(210px,48vw)] origin-right transition-transform hover:scale-[1.035] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 sm:w-[240px]">
              <Image src={`${CONTEST_ASSETS}/button-start.png`} alt="" width={1000} height={400} className="game-start-button-glow h-auto w-full object-contain" />
            </button>
          )}
        </div>
        </div>
      </section>
    </div>
  );
}

function GameResultScreen({
  title,
  scoreLabel,
  points,
  pointsUnit,
  description,
  replayLabel,
  onReplay,
}: {
  title: string;
  scoreLabel: string;
  points: number;
  pointsUnit: string;
  description: string;
  replayLabel: string;
  onReplay: () => void;
}) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="customer-game-result-title" className="absolute inset-0 z-[70] grid place-items-center overflow-y-auto bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,.08),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(0,180,255,.16),transparent_20%),rgba(18,22,32,.78)] px-4 py-6 backdrop-blur-[2px] sm:px-8">
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[12%] left-[8%] h-4 w-28 -rotate-[10deg] rounded-full border-[3px] border-[#0759b0] bg-gradient-to-b from-[#42ddfa] to-[#1088dc] opacity-50 shadow-[0_8px_0_rgba(0,0,0,.25)] sm:w-36" />
      <span aria-hidden="true" className="pointer-events-none absolute right-[11%] top-[14%] size-16 rounded-full border-4 border-[#0759b0] bg-[radial-gradient(circle_at_30%_28%,#f7ffff_0_12%,#71edff_13%_42%,#0a7dd1_43%_100%)] opacity-70 shadow-[0_8px_0_rgba(0,0,0,.25)] sm:size-20" />
      <section className="relative w-full max-w-[680px] overflow-hidden rounded-[30px] border-[5px] border-[#0759b0] bg-gradient-to-b from-[#1ab7eb] via-[#0e89d6] to-[#0866b5] px-4 py-6 shadow-[0_18px_0_rgba(39,42,50,.48)] sm:rounded-[38px] sm:px-8 sm:py-9">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-2 h-8 rounded-full bg-gradient-to-b from-white/80 to-white/5 opacity-80 sm:inset-x-4 sm:top-2.5 sm:h-10" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:gap-5">
          <div className="w-full max-w-[420px] rounded-full border-[4px] border-[#0759b0] bg-gradient-to-b from-[#85f4ff] via-[#35d6fa] to-[#18b7ee] px-4 py-3 shadow-[0_8px_0_rgba(35,39,48,.34)] sm:px-7 sm:py-4">
            <h2 id="customer-game-result-title" className="font-game text-[clamp(30px,6vw,52px)] font-black italic leading-none tracking-tight text-white drop-shadow-[0_3px_0_rgba(6,89,174,.9)]">
              {title}
            </h2>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="font-game text-lg font-extrabold italic text-white drop-shadow-[0_2px_0_#0861af] sm:text-2xl">{scoreLabel}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
              <div aria-hidden="true" className="grid size-[70px] shrink-0 place-items-center rounded-full border-[4px] border-[#045bb6] bg-gradient-to-b from-[#60efff] via-[#1bc2e3] to-[#0c6bd6] shadow-[0_7px_0_rgba(30,35,43,.38)] sm:size-24 sm:border-[5px]">
                <RiStarFill className="size-10 text-[#eafffb] drop-shadow-[0_2px_2px_rgba(0,91,182,.8)] sm:size-14" />
              </div>
              <p className="font-game text-[clamp(54px,10vw,92px)] font-black italic leading-none tracking-[-0.06em] text-white drop-shadow-[0_5px_0_rgba(10,116,196,.45)]" style={{ WebkitTextStroke: "2px #0659ae", paintOrder: "stroke fill" }}>
                {points}<span className="ml-2 text-base not-italic tracking-normal sm:text-xl">{pointsUnit}</span>
              </p>
            </div>
            <p className="max-w-xl text-sm font-bold text-cyan-50 sm:text-base">{description}</p>
          </div>
          <button type="button" autoFocus onClick={onReplay} className="mt-1 min-h-14 rounded-full border-[4px] border-[#0759b0] bg-gradient-to-b from-[#88f5ff] via-[#40dbfb] to-[#1bc1ef] px-6 py-3 font-game text-xl font-black italic leading-none text-white shadow-[0_8px_0_rgba(31,36,44,.33)] drop-shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 sm:min-h-16 sm:px-9 sm:text-3xl">
            <span className="drop-shadow-[0_2px_0_#0860af]">{replayLabel}</span>
          </button>
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-2 h-3 rounded-full bg-[#004d8e]/30 sm:inset-x-4 sm:bottom-2.5 sm:h-4" />
      </section>
    </div>
  );
}

export function CustomerAdviceGame() {
  const pathname = usePathname();
  const isGameRoute = GAME_ROUTE_PATHS.has(pathname.replace(/\/+$/, "") || "/");
  const { language } = useAcademy();
  const copy = getGameCopy(GAME_COPY, language);
  const flowCopy = getGameCopy(CONTEST_FLOW_COPY, language);
  const [screen, setScreen] = useState<GameScreen>("start");
  const [introBeat, setIntroBeat] = useState(0);
  const [selectedContestantId, setSelectedContestantId] = useState<ContestantId>("one");
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS_BY_DIFFICULTY.easy);
  const [points, setPoints] = useState(0);
  const [scoreFeedback, setScoreFeedback] = useState<{ id: number; delta: number; message: string; tone: "best" | "alternative" | "incorrect" } | null>(null);
  const [saleFlight, setSaleFlight] = useState<ProductSaleFlight | null>(null);
  const [selectedProductInfo, setSelectedProductInfo] = useState<ProductChoice | null>(null);
  const [roundAnnouncement, setRoundAnnouncement] = useState<{ id: number; difficulty: GameDifficulty } | null>(null);
  const [roundState, setRoundState] = useState<"playing" | "complete" | "time-up">("playing");
  const [selectedChoice, setSelectedChoice] = useState<ProductChoice["id"] | null>(null);
  const [scenarioDeck, setScenarioDeck] = useState<CustomerAdviceScenario[]>([]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);
  const [choiceFeedback, setChoiceFeedback] = useState<"best-product" | "acceptable-product" | "correct-answer" | "incorrect" | null>(null);
  const [isResolvingChoice, setIsResolvingChoice] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | GameProductCategory>("all");
  const currentDifficulty = scenarioDeck[scenarioIndex]?.difficulty ?? "easy";
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const [backgroundFrame, setBackgroundFrame] = useState(0);
  const [soundtrackIndex, setSoundtrackIndex] = useState(0);
  const [customerIndex, setCustomerIndex] = useState(-1);
  const [customerLeaving, setCustomerLeaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const productRailRef = useRef<HTMLDivElement>(null);
  const customerFigureRef = useRef<HTMLDivElement>(null);
  const productImageRefs = useRef(new Map<string, HTMLSpanElement>());
  const saleFlightIdRef = useRef(0);
  const productInfoCloseRef = useRef<HTMLButtonElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const vocalSoundRef = useRef<HTMLAudioElement>(null);
  const vocalAudioContextRef = useRef<AudioContext | null>(null);
  const vocalQueueRef = useRef<number[]>([]);
  const vocalPlayingRef = useRef(false);
  const vocalPlaybackIdRef = useRef(0);
  const lastVocalClipIndexRef = useRef<number | null>(null);
  const mainButtonSoundRef = useRef<HTMLAudioElement>(null);
  const selectSoundRef = useRef<HTMLAudioElement>(null);
  const correctSoundRef = useRef<HTMLAudioElement>(null);
  const wrongSoundRef = useRef<HTMLAudioElement>(null);
  const gameEndSoundRef = useRef<HTMLAudioElement>(null);
  const timeNearEndSoundRef = useRef<HTMLAudioElement>(null);
  const lastNearEndTickRef = useRef<number | null>(null);
  const gameEndSoundPlayedRef = useRef(false);
  const screenTransitionTimerRef = useRef<number | null>(null);
  const customerTransitionTimerRef = useRef<number | null>(null);
  const turnAdvanceTimerRef = useRef<number | null>(null);
  const scoreFeedbackTimerRef = useRef<number | null>(null);
  const scoreFeedbackIdRef = useRef(0);
  const roundAnnouncementTimerRef = useRef<number | null>(null);
  const roundAnnouncementIdRef = useRef(0);

  const stopAllGameAudio = useCallback(() => {
    const audioElements = [
      musicRef.current,
      vocalSoundRef.current,
      mainButtonSoundRef.current,
      selectSoundRef.current,
      correctSoundRef.current,
      wrongSoundRef.current,
      gameEndSoundRef.current,
      timeNearEndSoundRef.current,
    ];

    for (const audio of audioElements) {
      if (!audio) continue;
      audio.pause();
      audio.currentTime = 0;
    }

    vocalQueueRef.current = [];
    vocalPlayingRef.current = false;
    vocalPlaybackIdRef.current += 1;
    if (vocalAudioContextRef.current?.state === "running") {
      void vocalAudioContextRef.current.suspend().catch(() => undefined);
    }
  }, []);

  useLayoutEffect(() => {
    if (!isGameRoute) {
      stopAllGameAudio();
      return;
    }

    return stopAllGameAudio;
  }, [isGameRoute, stopAllGameAudio]);

  const prepareVocalAudio = useCallback(() => {
    const audio = vocalSoundRef.current;
    if (!isGameRoute || !audio || typeof window === "undefined" || !window.AudioContext) return;

    try {
      let context = vocalAudioContextRef.current;
      if (!context) {
        context = new window.AudioContext();
        const source = context.createMediaElementSource(audio);
        const gain = context.createGain();
        gain.gain.value = 1.35;
        source.connect(gain);
        gain.connect(context.destination);
        vocalAudioContextRef.current = context;
      }

      if (context.state === "suspended") void context.resume().catch(() => undefined);
    } catch {
      // Keep normal HTML audio playback if Web Audio is unavailable.
    }
  }, [isGameRoute]);

  const playNextVocalLine = useCallback(() => {
    const audio = vocalSoundRef.current;
    const clipIndex = vocalQueueRef.current.shift();
    if (!isGameRoute || !audio || clipIndex === undefined || !soundEnabledRef.current) {
      vocalPlayingRef.current = false;
      return;
    }

    vocalPlayingRef.current = true;
    const playbackId = ++vocalPlaybackIdRef.current;
    prepareVocalAudio();
    audio.src = VOCAL_CLIPS[clipIndex];
    audio.currentTime = 0;
    void audio.play().catch(() => {
      if (vocalPlaybackIdRef.current !== playbackId) return;
      vocalPlayingRef.current = false;
      vocalQueueRef.current = [];
    });
  }, [isGameRoute, prepareVocalAudio]);

  const playVocalLine = useCallback((interruptCurrent = false) => {
    if (!isGameRoute || !soundEnabledRef.current) return;

    if (interruptCurrent) {
      vocalQueueRef.current = [];
      vocalPlaybackIdRef.current += 1;
      vocalSoundRef.current?.pause();
      if (vocalSoundRef.current) vocalSoundRef.current.currentTime = 0;
      vocalPlayingRef.current = false;
    }

    const availableClipIndexes = VOCAL_CLIPS.map((_, index) => index).filter(
      (index) => index !== lastVocalClipIndexRef.current,
    );
    const clipIndex = availableClipIndexes[Math.floor(Math.random() * availableClipIndexes.length)] ?? 0;
    lastVocalClipIndexRef.current = clipIndex;
    vocalQueueRef.current.push(clipIndex);
    if (!vocalPlayingRef.current) playNextVocalLine();
  }, [isGameRoute, playNextVocalLine]);
  const playCustomerVocalLine = useCallback(() => playVocalLine(true), [playVocalLine]);

  const resetGame = useCallback(() => {
    vocalQueueRef.current = [];
    vocalPlayingRef.current = false;
    vocalPlaybackIdRef.current += 1;
    if (vocalSoundRef.current) {
      vocalSoundRef.current.pause();
      vocalSoundRef.current.currentTime = 0;
    }
    if (screenTransitionTimerRef.current !== null) {
      window.clearTimeout(screenTransitionTimerRef.current);
      screenTransitionTimerRef.current = null;
    }
    if (customerTransitionTimerRef.current !== null) {
      window.clearTimeout(customerTransitionTimerRef.current);
      customerTransitionTimerRef.current = null;
    }
    if (turnAdvanceTimerRef.current !== null) {
      window.clearTimeout(turnAdvanceTimerRef.current);
      turnAdvanceTimerRef.current = null;
    }
    if (scoreFeedbackTimerRef.current !== null) {
      window.clearTimeout(scoreFeedbackTimerRef.current);
      scoreFeedbackTimerRef.current = null;
    }
    if (roundAnnouncementTimerRef.current !== null) {
      window.clearTimeout(roundAnnouncementTimerRef.current);
      roundAnnouncementTimerRef.current = null;
    }

    setScreen("start");
    setIntroBeat(0);
    setSelectedContestantId("one");
    setSecondsLeft(ROUND_SECONDS_BY_DIFFICULTY.easy);
    setPoints(0);
    setScoreFeedback(null);
    setSaleFlight(null);
    setSelectedProductInfo(null);
    setRoundAnnouncement(null);
    setRoundState("playing");
    setSelectedChoice(null);
    setSelectedProductIds([]);
    setScenarioDeck([]);
    setScenarioIndex(0);
    setTurnIndex(0);
    setChoiceFeedback(null);
    setIsResolvingChoice(false);
    setSelectedCategory("all");
    setSoundEnabled(true);
    setBackgroundFrame(0);
    setSoundtrackIndex(0);
    setCustomerIndex(-1);
    setCustomerLeaving(false);
    setIsLeaving(false);
  }, []);

  function transitionToScreen(nextScreen: GameScreen) {
    if (screenTransitionTimerRef.current !== null) {
      window.clearTimeout(screenTransitionTimerRef.current);
      screenTransitionTimerRef.current = null;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setScreen(nextScreen);
      setIsLeaving(false);
      return;
    }

    setIsLeaving(true);
    screenTransitionTimerRef.current = window.setTimeout(() => {
      screenTransitionTimerRef.current = null;
      setScreen(nextScreen);
      setIsLeaving(false);
    }, 280);
  }

  useEffect(() => {
    window.addEventListener("popstate", resetGame);
    return () => {
      window.removeEventListener("popstate", resetGame);
      if (screenTransitionTimerRef.current !== null) {
        window.clearTimeout(screenTransitionTimerRef.current);
      }
      if (customerTransitionTimerRef.current !== null) {
        window.clearTimeout(customerTransitionTimerRef.current);
      }
      if (turnAdvanceTimerRef.current !== null) {
        window.clearTimeout(turnAdvanceTimerRef.current);
      }
      if (scoreFeedbackTimerRef.current !== null) {
        window.clearTimeout(scoreFeedbackTimerRef.current);
      }
      if (roundAnnouncementTimerRef.current !== null) {
        window.clearTimeout(roundAnnouncementTimerRef.current);
      }
    };
  }, [resetGame]);

  useEffect(() => {
    if (!selectedProductInfo) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProductInfo(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    productInfoCloseRef.current?.focus();
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedProductInfo]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animation = window.setInterval(() => {
      setBackgroundFrame((current) => (current + 1) % BACKGROUND_FRAMES.length);
    }, 700);

    return () => window.clearInterval(animation);
  }, []);

  useEffect(() => {
    if (screen !== "game" || roundState !== "playing" || roundAnnouncement) return;

    let remaining = getRoundDuration(currentDifficulty, selectedContestantId);
    const timer = window.setInterval(() => {
      remaining = Math.max(remaining - 1, 0);
      setSecondsLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        if (customerTransitionTimerRef.current !== null) {
          window.clearTimeout(customerTransitionTimerRef.current);
          customerTransitionTimerRef.current = null;
          setCustomerLeaving(false);
        }
        if (turnAdvanceTimerRef.current !== null) {
          window.clearTimeout(turnAdvanceTimerRef.current);
          turnAdvanceTimerRef.current = null;
        }
        if (roundAnnouncementTimerRef.current !== null) {
          window.clearTimeout(roundAnnouncementTimerRef.current);
          roundAnnouncementTimerRef.current = null;
        }
        setRoundAnnouncement(null);
        setIsResolvingChoice(false);
        setRoundState("time-up");
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [currentDifficulty, roundAnnouncement, roundState, screen, selectedContestantId]);

  useEffect(() => {
    const isCountingDown = isGameRoute
      && screen === "game"
      && roundState === "playing"
      && secondsLeft > 0
      && secondsLeft <= 10
      && soundEnabled;

    if (!isCountingDown) {
      lastNearEndTickRef.current = null;
      const audio = timeNearEndSoundRef.current;
      audio?.pause();
      if (audio) audio.currentTime = 0;
      return;
    }

    if (lastNearEndTickRef.current === secondsLeft) return;
    lastNearEndTickRef.current = secondsLeft;
    playSound(timeNearEndSoundRef.current);
  }, [isGameRoute, roundState, screen, secondsLeft, soundEnabled]);

  useEffect(() => {
    if (roundState === "playing") {
      gameEndSoundPlayedRef.current = false;
      return;
    }
    if (!isGameRoute || screen !== "game" || gameEndSoundPlayedRef.current) return;
    gameEndSoundPlayedRef.current = true;
    const audio = gameEndSoundRef.current;
    if (soundEnabled && audio) {
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    }
  }, [isGameRoute, roundState, screen, soundEnabled]);

  useEffect(() => {
    if (screen !== "game" || roundState !== "playing") setSelectedProductInfo(null);
  }, [roundState, screen]);

  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;

    if (!isGameRoute || !soundEnabled) {
      music.pause();
      music.currentTime = 0;
      return;
    }

    music.volume = 0.26;
    void music.play().catch(() => undefined);
  }, [isGameRoute, soundEnabled, soundtrackIndex]);

  useEffect(() => {
    if (isGameRoute && soundEnabled) return;
    vocalQueueRef.current = [];
    vocalPlayingRef.current = false;
    vocalPlaybackIdRef.current += 1;
    const vocalAudio = vocalSoundRef.current;
    vocalAudio?.pause();
    if (vocalAudio) vocalAudio.currentTime = 0;
  }, [isGameRoute, soundEnabled]);

  const currentScenario = scenarioDeck[scenarioIndex];
  const currentTurn = currentScenario?.turns[turnIndex];
  const currentPrompt = currentTurn?.prompt[language] ?? currentTurn?.prompt.pl ?? "";
  const prioritizedProductIds = currentTurn?.kind === "product" ? currentTurn.productIds : [];
  const bestProductIds = currentTurn?.kind === "product" ? currentTurn.bestProductIds : [];
  const acceptableProductIds = currentTurn?.kind === "product" ? currentTurn.acceptableProductIds ?? [] : [];
  const acceptableProductSets = currentTurn?.kind === "product" ? currentTurn.acceptableProductSets ?? [] : [];
  const isMultipleProductTurn = currentTurn?.kind === "product" && currentTurn.selectionMode === "multiple";
  const orderedProducts = currentTurn?.kind === "product"
    ? [
        ...prioritizedProductIds.flatMap((productId) => GAME_PRODUCT_CATALOG.filter((product) => product.id === productId)),
        ...GAME_PRODUCT_CATALOG.filter((product) => !prioritizedProductIds.includes(product.id)),
      ]
    : [];
  const choices: ProductChoice[] = currentTurn?.kind === "product"
    ? orderedProducts.map((product) => ({
        ...product,
        result: bestProductIds.includes(product.id)
          ? "best" as const
          : acceptableProductIds.includes(product.id)
            ? "acceptable" as const
            : "incorrect" as const,
      }))
    : [];
  const categoryOptions: Array<{ id: "all" | GameProductCategory; label: string }> = [
    { id: "all", label: copy.allProducts },
    { id: "helmets", label: copy.categoryHelmets },
    { id: "textile-clothing", label: copy.categoryTextileClothing },
    { id: "leather-clothing", label: copy.categoryLeatherClothing },
    { id: "care", label: copy.categoryCare },
    { id: "accessories", label: copy.categoryAccessories },
  ];
  const categoryFilters = categoryOptions.filter(
    (category) => category.id === "all" || choices.some((choice) => choice.category === category.id),
  );
  const filteredChoices = selectedCategory === "all"
    ? choices
    : choices.filter((choice) => choice.category === selectedCategory);

  function showScoreFeedback(delta: number, message: string, tone: "best" | "alternative" | "incorrect" = delta > 0 ? "best" : "incorrect") {
    if (scoreFeedbackTimerRef.current !== null) {
      window.clearTimeout(scoreFeedbackTimerRef.current);
    }

    const id = scoreFeedbackIdRef.current + 1;
    scoreFeedbackIdRef.current = id;
    setScoreFeedback({ id, delta, message, tone });
    scoreFeedbackTimerRef.current = window.setTimeout(() => {
      scoreFeedbackTimerRef.current = null;
      setScoreFeedback((current) => current?.id === id ? null : current);
    }, 1050);
  }

  function finishSuccessfulProductTurn(pointsEarned: number, message: string, tone: "best" | "alternative") {
    showScoreFeedback(pointsEarned, message, tone);
    turnAdvanceTimerRef.current = window.setTimeout(() => {
      turnAdvanceTimerRef.current = null;
      advanceTurn();
    }, 420);
  }

  function startProductSale(productId: string, pointsEarned: number, message: string, tone: "best" | "alternative") {
    if (scoreFeedbackTimerRef.current !== null) {
      window.clearTimeout(scoreFeedbackTimerRef.current);
      scoreFeedbackTimerRef.current = null;
    }
    setScoreFeedback(null);
    setPoints((current) => current + pointsEarned);

    const product = GAME_PRODUCT_CATALOG.find((item) => item.id === productId);
    const imageFrame = productImageRefs.current.get(productId);
    const customer = customerFigureRef.current;
    if (!product || !imageFrame || !customer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishSuccessfulProductTurn(pointsEarned, message, tone);
      return;
    }

    const from = imageFrame.getBoundingClientRect();
    const to = customer.getBoundingClientRect();
    const size = Math.min(92, Math.max(60, from.width * 0.72));
    const startX = from.left + from.width / 2;
    const startY = from.top + from.height / 2;
    const targetX = to.left + to.width * 0.7;
    const targetY = to.top + to.height * (window.matchMedia("(min-width: 640px)").matches ? 0.37 : 0.45);

    setSaleFlight({
      id: ++saleFlightIdRef.current,
      image: product.image,
      left: startX - size / 2,
      top: startY - size / 2,
      size,
      deltaX: targetX - startX,
      deltaY: targetY - startY,
      pointsEarned,
      message,
      tone,
    });
  }

  function finishSaleFlight() {
    if (!saleFlight) return;
    setSaleFlight(null);
    if (roundState !== "playing") return;
    finishSuccessfulProductTurn(saleFlight.pointsEarned, saleFlight.message, saleFlight.tone);
  }

  function showRoundAnnouncement(difficulty: GameDifficulty) {
    if (roundAnnouncementTimerRef.current !== null) {
      window.clearTimeout(roundAnnouncementTimerRef.current);
    }
    if (scoreFeedbackTimerRef.current !== null) {
      window.clearTimeout(scoreFeedbackTimerRef.current);
      scoreFeedbackTimerRef.current = null;
    }

    setScoreFeedback(null);
    const id = roundAnnouncementIdRef.current + 1;
    roundAnnouncementIdRef.current = id;
    setRoundAnnouncement({ id, difficulty });
    roundAnnouncementTimerRef.current = window.setTimeout(() => {
      roundAnnouncementTimerRef.current = null;
      setRoundAnnouncement((current) => current?.id === id ? null : current);
    }, 1600);
  }

  function advanceTurn() {
    setSelectedChoice(null);
    setSelectedProductIds([]);
    setChoiceFeedback(null);
    setIsResolvingChoice(false);
    setSelectedCategory("all");
    productRailRef.current?.scrollTo({ left: 0 });

    if (!currentScenario) return;
    if (turnIndex < currentScenario.turns.length - 1) {
      setTurnIndex((current) => current + 1);
      return;
    }

    if (scenarioIndex >= scenarioDeck.length - 1) {
      setRoundState("complete");
      return;
    }

    const nextScenario = scenarioDeck[scenarioIndex + 1];
    const beginsNextRound = nextScenario?.difficulty !== currentScenario.difficulty;
    const nextCustomerIndex = (customerIndex + 1) % CUSTOMER_IMAGES.length;
    const showNextCustomer = () => {
      setScenarioIndex((current) => current + 1);
      setTurnIndex(0);
      setCustomerIndex(nextCustomerIndex);
      setCustomerLeaving(false);
      setIsResolvingChoice(false);
      if (beginsNextRound && nextScenario) {
        setSecondsLeft(getRoundDuration(nextScenario.difficulty, selectedContestantId));
        playSound(gameEndSoundRef.current);
        showRoundAnnouncement(nextScenario.difficulty);
      }
    };

    setIsResolvingChoice(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showNextCustomer();
    } else {
      setCustomerLeaving(true);
      customerTransitionTimerRef.current = window.setTimeout(() => {
        customerTransitionTimerRef.current = null;
        showNextCustomer();
      }, 340);
    }
  }

  function chooseProduct(choice: ProductChoice) {
    if (roundState !== "playing" || isResolvingChoice || customerLeaving || currentTurn?.kind !== "product") return;
    playSound(selectSoundRef.current);

    if (isGameRoute && soundEnabled && musicRef.current?.paused) {
      void musicRef.current.play().catch(() => undefined);
    }

    if (isMultipleProductTurn) {
      setChoiceFeedback(null);
      setSelectedProductIds((current) => current.includes(choice.id)
        ? current.filter((productId) => productId !== choice.id)
        : [...current, choice.id]);
      return;
    }

    setSelectedChoice(choice.id);
    if (choice.result === "incorrect") {
      setChoiceFeedback("incorrect");
      playSound(wrongSoundRef.current);
      setPoints((current) => Math.max(0, current - WRONG_CHOICE_PENALTY));
      showScoreFeedback(-WRONG_CHOICE_PENALTY, getGameCopy(CHOICE_FEEDBACK_COPY, language).wrongProduct);
      return;
    }

    const isBestMatch = choice.result === "best";
    setChoiceFeedback(isBestMatch ? "best-product" : "acceptable-product");
    setIsResolvingChoice(true);
    playSound(correctSoundRef.current);
    const bestProduct = GAME_PRODUCT_CATALOG.find((product) => bestProductIds.includes(product.id));
    const message = isBestMatch
      ? getGameCopy(CHOICE_FEEDBACK_COPY, language).bestProduct
      : `${getGameCopy(CHOICE_FEEDBACK_COPY, language).acceptableProduct}${bestProduct?.name ?? ""}`;
    const pointsEarned = applyContestantPointsBonus(
      isBestMatch ? 75 + Math.min(25, secondsLeft) : ALTERNATIVE_PRODUCT_POINTS,
      selectedContestantId,
    );
    startProductSale(choice.id, pointsEarned, message, isBestMatch ? "best" : "alternative");
  }

  function submitProductSelection() {
    if (roundState !== "playing" || isResolvingChoice || customerLeaving || currentTurn?.kind !== "product" || !isMultipleProductTurn || selectedProductIds.length === 0) return;
    const isBestMatch = sameProductSelection(selectedProductIds, bestProductIds);
    const isAcceptableSet = acceptableProductSets.some((set) => sameProductSelection(selectedProductIds, set));
    if (!isBestMatch && !isAcceptableSet) {
      setChoiceFeedback("incorrect");
      playSound(wrongSoundRef.current);
      setPoints((current) => Math.max(0, current - WRONG_CHOICE_PENALTY));
      showScoreFeedback(-WRONG_CHOICE_PENALTY, getGameCopy(CHOICE_FEEDBACK_COPY, language).wrongSelection);
      return;
    }

    setChoiceFeedback(isBestMatch ? "best-product" : "acceptable-product");
    setIsResolvingChoice(true);
    playSound(correctSoundRef.current);
    const bestProductNames = bestProductIds
      .map((productId) => GAME_PRODUCT_CATALOG.find((product) => product.id === productId)?.name)
      .filter((name): name is string => Boolean(name))
      .join(" + ");
    const message = isBestMatch
      ? getGameCopy(CHOICE_FEEDBACK_COPY, language).bestProduct
      : `${getGameCopy(CHOICE_FEEDBACK_COPY, language).acceptableSelection}${bestProductNames}`;
    const pointsEarned = applyContestantPointsBonus(
      isBestMatch ? 90 + Math.min(25, secondsLeft) : ALTERNATIVE_PRODUCT_POINTS,
      selectedContestantId,
    );
    const animatedProductId = selectedProductIds.find((productId) => productImageRefs.current.has(productId)) ?? selectedProductIds[0];
    startProductSale(animatedProductId, pointsEarned, message, isBestMatch ? "best" : "alternative");
  }

  function chooseAnswer(answerId: string, isCorrect: boolean) {
    if (roundState !== "playing" || isResolvingChoice || customerLeaving || currentTurn?.kind !== "answer") return;
    setSelectedChoice(answerId);
    setChoiceFeedback(isCorrect ? "correct-answer" : "incorrect");
    playSound(selectSoundRef.current);
    playSound(isCorrect ? correctSoundRef.current : wrongSoundRef.current);

    if (!isCorrect) {
      setPoints((current) => Math.max(0, current - WRONG_CHOICE_PENALTY));
      showScoreFeedback(-WRONG_CHOICE_PENALTY, getGameCopy(CHOICE_FEEDBACK_COPY, language).wrongAnswer);
      return;
    }

    setIsResolvingChoice(true);
    const pointsEarned = applyContestantPointsBonus(65 + Math.min(20, secondsLeft), selectedContestantId);
    setPoints((current) => current + pointsEarned);
    showScoreFeedback(pointsEarned, getGameCopy(CHOICE_FEEDBACK_COPY, language).correctAnswer);
    turnAdvanceTimerRef.current = window.setTimeout(() => {
      turnAdvanceTimerRef.current = null;
      advanceTurn();
    }, 560);
  }

  function playSound(audio: HTMLAudioElement | null) {
    if (!isGameRoute || !soundEnabled || !audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  function playNextSoundtrack() {
    if (!isGameRoute || !soundEnabledRef.current) return;
    setSoundtrackIndex((current) => (current + 1) % SOUNDTRACKS.length);
  }

  function startNewRound() {
    vocalQueueRef.current = [];
    vocalPlayingRef.current = false;
    vocalPlaybackIdRef.current += 1;
    vocalSoundRef.current?.pause();
    if (vocalSoundRef.current) vocalSoundRef.current.currentTime = 0;
    if (customerTransitionTimerRef.current !== null) {
      window.clearTimeout(customerTransitionTimerRef.current);
      customerTransitionTimerRef.current = null;
    }
    if (turnAdvanceTimerRef.current !== null) {
      window.clearTimeout(turnAdvanceTimerRef.current);
      turnAdvanceTimerRef.current = null;
    }
    if (scoreFeedbackTimerRef.current !== null) {
      window.clearTimeout(scoreFeedbackTimerRef.current);
      scoreFeedbackTimerRef.current = null;
    }
    setScoreFeedback(null);
    setSecondsLeft(getRoundDuration("easy", selectedContestantId));
    setPoints(0);
    setScenarioDeck(createScenarioDeck());
    setScenarioIndex(0);
    setTurnIndex(0);
    setSelectedChoice(null);
    setSelectedProductIds([]);
    setSelectedProductInfo(null);
    setChoiceFeedback(null);
    setIsResolvingChoice(false);
    setSelectedCategory("all");
    setRoundState("playing");
    setCustomerIndex(0);
    setCustomerLeaving(false);
    showRoundAnnouncement("easy");
  }

  function replayRound() {
    startNewRound();
  }

  function startCharacterSelection() {
    if (turnAdvanceTimerRef.current !== null) {
      window.clearTimeout(turnAdvanceTimerRef.current);
      turnAdvanceTimerRef.current = null;
    }
    setSecondsLeft(ROUND_SECONDS_BY_DIFFICULTY.easy);
    if (roundAnnouncementTimerRef.current !== null) {
      window.clearTimeout(roundAnnouncementTimerRef.current);
      roundAnnouncementTimerRef.current = null;
    }
    setSelectedChoice(null);
    setSelectedProductIds([]);
    setChoiceFeedback(null);
    setRoundAnnouncement(null);
    setIsResolvingChoice(false);
    setSelectedCategory("all");
    setRoundState("playing");
    setPoints(0);
    setScenarioDeck([]);
    setScenarioIndex(0);
    setTurnIndex(0);
    setSelectedContestantId("one");
    setCustomerIndex(-1);
    setCustomerLeaving(false);
    transitionToScreen("choose-character");
  }

  function chooseContestant(contestantId: ContestantId) {
    setSelectedContestantId(contestantId);
    setIntroBeat(0);
    transitionToScreen("intro");
  }

  function advanceIntro() {
    if (introBeat === 0) {
      setIntroBeat(1);
      return;
    }

    startNewRound();
    transitionToScreen("game");
  }

  function scrollProducts(direction: "back" | "forward") {
    productRailRef.current?.scrollBy({
      left: direction === "back" ? -300 : 300,
      behavior: "smooth",
    });
  }

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const currentLevel = currentScenario?.difficulty === "easy"
    ? 1
    : currentScenario?.difficulty === "medium"
      ? 2
      : 3;
  const levelProgress = scenarioDeck
    .slice(0, scenarioIndex + 1)
    .filter((scenario) => scenario.difficulty === currentDifficulty)
    .length;
  const isUrgent = secondsLeft <= 10 && roundState === "playing";
  const scoreFeedbackNumberClass = scoreFeedback?.tone === "alternative"
    ? "text-amber-200 [text-shadow:0_0_14px_rgba(251,191,36,0.95),0_0_30px_rgba(251,191,36,0.75)]"
    : scoreFeedback?.tone === "incorrect"
      ? "text-rose-300 [text-shadow:0_0_14px_rgba(251,113,133,0.95),0_0_30px_rgba(251,113,133,0.75)]"
      : "text-emerald-300 [text-shadow:0_0_14px_rgba(52,211,153,0.95),0_0_30px_rgba(52,211,153,0.75)]";
  const scoreFeedbackMessageClass = scoreFeedback?.tone === "alternative"
    ? "text-amber-100 [text-shadow:0_0_12px_rgba(251,191,36,0.9)]"
    : scoreFeedback?.tone === "incorrect"
      ? "text-rose-100 [text-shadow:0_0_12px_rgba(251,113,133,0.9)]"
      : "text-emerald-100 [text-shadow:0_0_12px_rgba(52,211,153,0.9)]";
  const isTimeUp = roundState === "time-up";
  const isComplete = roundState === "complete";
  const conversationCopy = getGameCopy(CONVERSATION_COPY, language);
  const shelfTitle = isComplete
    ? conversationCopy.completeTitle
    : isTimeUp
      ? copy.timeUpTitle
      : currentTurn?.kind === "answer"
        ? conversationCopy.answerPrompt
        : copy.shelfTitle;
  const customerImage = customerIndex < 0
    ? `${GAME_ASSETS}/customer-rider.webp`
    : CUSTOMER_IMAGES[customerIndex] ?? CUSTOMER_IMAGES[0];
  const soundLabels: Record<GameLanguage, [string, string]> = {
    pl: ["W\u0142\u0105cz d\u017awi\u0119k", "Wy\u0142\u0105cz d\u017awi\u0119k"],
    en: ["Turn sound on", "Turn sound off"],
    de: ["Ton einschalten", "Ton ausschalten"],
    cs: ["Zapnout zvuk", "Vypnout zvuk"],
    fr: ["Activer le son", "D\u00e9sactiver le son"],
    it: ["Attiva l’audio", "Disattiva l’audio"],
  };
  const soundLabel = getGameCopy(soundLabels, language)[soundEnabled ? 1 : 0];
  const audioElements = (
    <>
      <audio
        ref={musicRef}
        src={SOUNDTRACKS[soundtrackIndex]}
        onEnded={playNextSoundtrack}
        preload="none"
        className="hidden"
      />
      <audio ref={vocalSoundRef} onEnded={playNextVocalLine} preload="none" className="hidden" />
      <audio ref={mainButtonSoundRef} src={`${GAME_ASSETS}/audio/main-button-click.mp3`} preload="auto" className="hidden" />
      <audio ref={selectSoundRef} src={`${GAME_ASSETS}/audio/select.wav`} preload="none" className="hidden" />
      <audio ref={correctSoundRef} src={`${GAME_ASSETS}/audio/correct-louder.wav`} preload="none" className="hidden" />
      <audio ref={wrongSoundRef} src={`${GAME_ASSETS}/audio/try-again-louder.wav`} preload="none" className="hidden" />
      <audio ref={gameEndSoundRef} src={`${GAME_ASSETS}/audio/game-end.mp3`} preload="auto" className="hidden" />
      <audio ref={timeNearEndSoundRef} src={`${GAME_ASSETS}/audio/time-near-to-end.mp3`} preload="auto" className="hidden" />
    </>
  );
  const soundToggle = (
    <button
      type="button"
      onClick={() => setSoundEnabled((enabled) => !enabled)}
      aria-label={soundLabel}
      aria-pressed={soundEnabled}
      className="fixed right-3 top-28 z-[100] grid size-12 shrink-0 place-items-center rounded-full border border-cyan-200/35 bg-slate-950/80 p-0.5 shadow-lg backdrop-blur transition-transform duration-150 hover:scale-105 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:right-8 sm:top-32"
    >
      <span className="relative size-10">
        <Image src={`${GAME_ASSETS}/sound-${soundEnabled ? "on" : "off"}.webp`} alt="" fill sizes="40px" className="object-contain drop-shadow-lg" />
      </span>
    </button>
  );
  const contestants = [
    { ...CONTESTANTS[0], label: flowCopy.playerOne },
    { ...CONTESTANTS[1], label: flowCopy.playerTwo },
  ];
  const selectedContestantIndex = selectedContestantId === "one" ? 0 : 1;

  if (screen === "start") {
    return (
      <>
        {audioElements}
        {soundToggle}
        <ContestStartScreen
          copy={flowCopy}
          onStart={() => {
            prepareVocalAudio();
            playSound(mainButtonSoundRef.current);
            startCharacterSelection();
          }}
        />
      </>
    );
  }

  if (screen === "choose-character") {
    return (
      <>
        {audioElements}
        {soundToggle}
        <ContestantSelectionScreen
          copy={flowCopy}
          language={language}
          contestants={contestants}
          isLeaving={isLeaving}
          onBack={() => {
            playSound(mainButtonSoundRef.current);
            transitionToScreen("start");
          }}
          onChoose={(contestantId) => {
            playSound(mainButtonSoundRef.current);
            chooseContestant(contestantId);
          }}
        />
      </>
    );
  }

  if (screen === "intro") {
    return (
      <>
        {audioElements}
        {soundToggle}
        <ContestIntroScreen
          copy={flowCopy}
          contestants={contestants}
          selectedContestantIndex={selectedContestantIndex}
          beat={introBeat}
          isLeaving={isLeaving}
          onVoiceStart={playVocalLine}
          onBack={() => {
            playSound(mainButtonSoundRef.current);
            transitionToScreen("choose-character");
          }}
          onAdvance={() => {
            playSound(mainButtonSoundRef.current);
            advanceIntro();
          }}
        />
      </>
    );
  }

  return (
    <>
      {audioElements}
      {soundToggle}
      {selectedProductInfo && screen === "game" && roundState === "playing" ? (
        <div
          className="game-product-info-backdrop fixed inset-0 z-[140] grid place-items-center bg-[#020914]/80 px-4 py-6 backdrop-blur-sm"
          onClick={() => setSelectedProductInfo(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-product-info-title"
            className="game-product-info-card relative grid max-h-[min(82vh,620px)] w-full max-w-[760px] grid-cols-1 overflow-y-auto rounded-[24px] border border-cyan-200/50 bg-[linear-gradient(145deg,#102941_0%,#07182a_54%,#06101e_100%)] p-4 text-white shadow-[0_24px_90px_rgba(0,0,0,0.75),0_0_40px_rgba(34,211,238,0.18)] sm:grid-cols-[minmax(210px,0.8fr)_1.2fr] sm:gap-6 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={productInfoCloseRef}
              type="button"
              aria-label={getGameCopy(PRODUCT_INFO_COPY, language).close}
              onClick={() => setSelectedProductInfo(null)}
              className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full border border-white/20 bg-[#03101f]/80 text-white/85 transition-colors hover:border-cyan-200/70 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              <RiCloseLine className="size-6" aria-hidden="true" />
            </button>
            <div className="relative mx-auto my-2 aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_12px_34px_rgba(0,0,0,0.42)] sm:my-auto sm:max-w-none">
              <Image src={selectedProductInfo.image} alt={selectedProductInfo.name} fill sizes="(max-width: 640px) 75vw, 300px" className="object-contain p-5" />
            </div>
            <div className="flex min-w-0 flex-col justify-center px-1 pb-1 pt-2 sm:py-8 sm:pr-9">
              <span className="game-product-info-label mb-2 w-fit rounded-full border border-cyan-200/45 bg-cyan-300/10 px-3 py-1 font-game text-xs font-bold uppercase tracking-[0.13em] text-cyan-100">
                {getGameCopy(PRODUCT_INFO_COPY, language).category}: {selectedProductInfo.category === "helmets"
                  ? copy.categoryHelmets
                  : selectedProductInfo.category === "textile-clothing"
                    ? copy.categoryTextileClothing
                    : selectedProductInfo.category === "leather-clothing"
                      ? copy.categoryLeatherClothing
                      : selectedProductInfo.category === "care"
                        ? copy.categoryCare
                        : copy.categoryAccessories}
              </span>
              <h2 id="game-product-info-title" className="pr-8 font-game text-xl font-black leading-tight text-white sm:text-2xl">
                {selectedProductInfo.name}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-100 sm:text-base">
                {getProductInfoDescription(selectedProductInfo, language)}
              </p>
            </div>
          </section>
        </div>
      ) : null}
      {saleFlight ? (
        <div
          key={saleFlight.id}
          ref={(element) => {
            if (!element) return;
            element.style.setProperty("--sale-flight-x", `${saleFlight.deltaX}px`);
            element.style.setProperty("--sale-flight-y", `${saleFlight.deltaY}px`);
          }}
          aria-hidden="true"
          className="game-sale-flight pointer-events-none fixed z-[115]"
          style={{
            left: saleFlight.left,
            top: saleFlight.top,
            width: saleFlight.size,
            height: saleFlight.size,
            "--sale-flight-x": `${saleFlight.deltaX}px`,
            "--sale-flight-y": `${saleFlight.deltaY}px`,
          } as CSSProperties}
          onAnimationEnd={finishSaleFlight}
        >
          <span className="relative block size-full overflow-hidden rounded-2xl border border-cyan-100/90 bg-white p-1.5 shadow-[0_0_24px_rgba(34,211,238,0.8),0_8px_24px_rgba(0,0,0,0.55)]">
            <Image src={saleFlight.image} alt="" fill sizes="92px" className="object-contain p-1.5" />
          </span>
        </div>
      ) : null}
      {scoreFeedback && roundState === "playing" ? (
        <div key={scoreFeedback.id} role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-0 z-[120] grid place-items-center px-4">
          <div className="game-score-feedback flex flex-col items-center px-5 py-4 text-center font-game sm:px-8 sm:py-5">
            <span className={`text-5xl font-black italic leading-none tabular-nums drop-shadow-[0_3px_2px_rgba(0,0,0,0.9)] sm:text-7xl ${scoreFeedbackNumberClass}`}>
              {scoreFeedback.delta > 0 ? "+" : "-"}{Math.abs(scoreFeedback.delta)} <span className="text-xl not-italic sm:text-2xl">{copy.pointsUnit}</span>
            </span>
            <span className={`mt-0.5 text-sm font-extrabold uppercase tracking-[0.14em] sm:text-lg ${scoreFeedbackMessageClass}`}>
              {scoreFeedback.message}
            </span>
          </div>
        </div>
      ) : null}
      {roundAnnouncement && screen === "game" && roundState === "playing" ? (
        <div key={roundAnnouncement.id} role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-0 z-[130] grid place-items-center px-4">
          <div className="game-round-announcement w-full max-w-[420px] rounded-[24px] border border-cyan-200/60 bg-[#061629]/95 px-6 py-5 text-center font-game text-white shadow-[0_0_36px_rgba(34,211,238,0.3),0_20px_60px_rgba(0,0,0,0.6)] sm:px-8 sm:py-6">
            <h2 className="text-2xl font-black uppercase tracking-[0.12em] sm:text-3xl">{getGameCopy(ROUND_STAGE_COPY, language)[roundAnnouncement.difficulty]}</h2>
          </div>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-[1360px] px-3 pb-8 font-game sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden pb-[30px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-0 overflow-hidden rounded-t-[28px] bg-[#102238]">
        {BACKGROUND_FRAMES.map((frame, index) => (
          <Image
            key={frame}
            src={`${GAME_ASSETS}/shop-background-${frame}.webp`}
            alt=""
            fill
            loading="eager"
            sizes="(max-width: 1640px) 100vw, 1640px"
            className={`object-cover ${backgroundFrame === index ? "visible" : "invisible"}`}
          />
        ))}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#07182d]/45 via-[#07182d]/5 to-[#07182d]/50" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[min(40vh,590px)] min-h-[280px] sm:min-h-[300px] lg:aspect-auto lg:h-[min(40vh,590px)] lg:min-h-[300px]">
        <div className="absolute left-1/2 top-[76%] h-[108%] w-full -translate-x-1/2">
          <Image src={`${GAME_ASSETS}/checkout-counter-tall.webp`} alt="" fill sizes="1360px" className="object-fill object-bottom" />
        </div>
      </div>

      <section aria-label={copy.round} className="relative z-20 isolate h-[min(40vh,590px)] min-h-[280px] overflow-hidden rounded-t-[28px] border-x border-t border-b-0 border-border-button-default bg-transparent shadow-2xl shadow-black/30 sm:min-h-[300px] lg:aspect-auto lg:h-[min(40vh,590px)] lg:min-h-[300px]">
        <div className="absolute inset-x-3 top-3 z-30 flex items-center justify-between gap-1 sm:inset-x-5 sm:top-4 sm:gap-3">
          <div
            role="group"
            aria-label={`${copy.levelLabel} ${currentLevel}`}
            className="relative flex h-10 w-[clamp(112px,25vw,208px)] shrink-0 items-center rounded-full border-[3px] border-[#0571b6] bg-gradient-to-b from-[#61e7f6] via-[#16bce7] to-[#0877bd] pl-[36px] pr-1.5 shadow-[0_3px_0_#034879,0_6px_10px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.8)] sm:h-[52px] sm:w-[208px] sm:pl-[54px] sm:pr-3"
          >
            <RiStarFill className="absolute left-2 top-1/2 size-[21px] -translate-y-1/2 text-[#e8fdff] drop-shadow-[0_2px_2px_rgba(0,75,145,0.75)] sm:left-3 sm:size-8" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-white drop-shadow-[0_1px_1px_rgba(0,50,100,0.7)]">
              <span className="block truncate font-game text-[10px] font-bold leading-none sm:text-sm">{copy.levelLabel} {currentLevel}</span>
              <div className="mt-1 flex items-center gap-1">
                <div
                  role="progressbar"
                  aria-label={copy.levelProgressLabel}
                  aria-valuemin={0}
                  aria-valuemax={CUSTOMERS_PER_ROUND}
                  aria-valuenow={levelProgress}
                  className="grid h-[7px] min-w-0 flex-1 gap-[2px] overflow-hidden rounded-full border border-[#075a91] bg-[#064a7a] p-[1px] shadow-inner sm:h-[9px] sm:gap-[3px]"
                  style={{ gridTemplateColumns: `repeat(${CUSTOMERS_PER_ROUND}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: CUSTOMERS_PER_ROUND }, (_, index) => (
                    <span key={index} className={`rounded-full ${index < levelProgress ? "bg-gradient-to-b from-[#d4ffff] via-[#5ceaff] to-[#12bde9] shadow-[0_0_5px_rgba(116,245,255,0.8)]" : "bg-[#063b68]/80"}`} />
                  ))}
                </div>
                <span className="w-8 shrink-0 text-right font-game text-[9px] font-bold leading-none tabular-nums sm:w-9 sm:text-xs">{levelProgress}/{CUSTOMERS_PER_ROUND}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
            <div
              aria-label={`${copy.scoreLabel}: ${points} ${copy.pointsUnit}`}
              className="relative flex h-[42px] w-[clamp(80px,22vw,190px)] shrink-0 items-center rounded-full border-2 border-[#0878bd] bg-gradient-to-b from-[#78edfa] via-[#22c4ec] to-[#0876bb] pl-[35px] pr-1.5 text-white shadow-[0_3px_0_#034879,0_6px_10px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.85)] sm:h-[52px] sm:w-[190px] sm:pl-[48px] sm:pr-3"
            >
              <RiStarFill className="absolute left-2 top-1/2 size-[21px] -translate-y-1/2 text-[#fff5b7] drop-shadow-[0_2px_2px_rgba(0,75,145,0.75)] sm:left-3 sm:size-8" aria-hidden="true" />
              <span className="absolute left-[36px] right-1 truncate font-game text-[clamp(13px,2vw,24px)] font-bold italic leading-none tabular-nums drop-shadow-[0_2px_1px_rgba(0,55,100,0.75)] sm:left-[48px] sm:right-3 sm:text-2xl">
                {points}<span className="ml-0.5 text-[8px] not-italic sm:ml-1 sm:text-xs">{copy.pointsUnit}</span>
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute left-[36px] right-3 top-[3px] h-[2px] rounded-full bg-white/65 sm:left-[49px] sm:right-4 sm:top-1 sm:h-[3px]" />
            </div>
            <div
              aria-label={`${copy.timerLabel}: ${formattedTime}`}
              className={`relative flex h-[42px] w-[clamp(80px,22vw,190px)] shrink-0 items-center rounded-full border-2 pl-[35px] pr-1.5 text-white shadow-[0_3px_0_#034879,0_6px_10px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.85)] sm:h-[52px] sm:w-[190px] sm:pl-[48px] sm:pr-3 ${isUrgent ? "border-rose-200 bg-gradient-to-b from-[#ff9eac] via-[#f04c76] to-[#ac1d4d] shadow-[0_3px_0_#741637,0_6px_10px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.85)]" : "border-[#0878bd] bg-gradient-to-b from-[#78edfa] via-[#22c4ec] to-[#0876bb]"}`}
            >
              <RiTimer2Line className={`absolute left-2 top-1/2 size-[21px] -translate-y-1/2 drop-shadow-[0_2px_2px_rgba(0,75,145,0.75)] sm:left-3 sm:size-8 ${isUrgent ? "text-white" : "text-[#e8fdff]"}`} aria-hidden="true" />
              <span className="absolute left-[36px] right-1 truncate font-game text-[clamp(13px,2vw,24px)] font-bold italic leading-none tabular-nums drop-shadow-[0_2px_1px_rgba(0,55,100,0.75)] sm:left-[48px] sm:right-3 sm:text-2xl">
                {formattedTime}
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute left-[36px] right-3 top-[3px] h-[2px] rounded-full bg-white/65 sm:left-[49px] sm:right-4 sm:top-1 sm:h-[3px]" />
            </div>
          </div>
        </div>

        {!roundAnnouncement ? (
          <>
            <div
              key={customerIndex}
              ref={customerFigureRef}
              className={`absolute -bottom-[13%] left-[-9.5%] z-10 h-[108%] w-[70%] sm:bottom-[-65%] sm:left-[2%] sm:h-[150%] sm:w-[63%] lg:left-[6%] lg:w-[55.5%] ${customerLeaving ? "game-customer-slide-right-out" : "game-customer-slide-left-in"}`}
            >
              <Image
                src={customerImage}
                alt={copy.customerImageAlt}
                fill
                sizes="(max-width: 640px) 55vw, 480px"
                className="game-customer-zoom-depth object-contain object-bottom drop-shadow-[0_15px_20px_rgba(0,0,0,0.38)]"
              />
            </div>

            <div key={`${scenarioIndex}-${turnIndex}`} aria-live="polite" aria-atomic="true" className="game-speech-arrive game-speech-float absolute left-[5%] top-[27%] z-20 w-[90%] max-w-[420px] rounded-[24px] bg-white px-4 py-3 text-slate-950 shadow-[0_14px_40px_rgba(3,12,23,0.28)] sm:left-[45%] sm:top-[24%] sm:w-[42%] sm:px-6 sm:py-5">
              <p className="text-pretty text-sm font-semibold leading-snug sm:text-lg sm:leading-snug">
                <TypewriterText text={isComplete ? conversationCopy.completePrompt : currentPrompt} characterDelay={15} onStart={playCustomerVocalLine} />
              </p>
              <span aria-hidden="true" className="absolute -bottom-2 left-[25%] size-4 rotate-45 bg-white sm:-left-2 sm:bottom-8" />
            </div>
          </>
        ) : null}

      </section>

      <section aria-labelledby="customer-game-shelf-title" className="relative isolate z-40 mx-auto mt-0 h-[360px] w-[85%] translate-y-[19px] px-3 pb-6 pt-4 sm:h-[350px] sm:px-5 sm:pb-6 sm:pt-4 lg:h-[340px] lg:px-7">
        <Image
          src={`${GAME_ASSETS}/product-shelf-panel.webp`}
          alt=""
          fill
          sizes="(max-width: 1360px) 100vw, 1360px"
          className="pointer-events-none z-0 object-fill"
        />
        <div className="relative z-10 flex h-full flex-col">
        <div className="mb-2 flex justify-center sm:mb-2">
          <div className="w-full text-center">
            <h2 id="customer-game-shelf-title" className="translate-y-4 font-game text-[26px] font-bold uppercase tracking-[0.06em] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] sm:text-[31px]">{shelfTitle}</h2>
          </div>
        </div>

        {currentTurn?.kind === "product" && !isComplete && !isTimeUp ? (
          <>
            <div className="mt-5 flex items-center gap-0 sm:mt-6 sm:gap-0.5">
              <button
                type="button"
                onClick={() => scrollProducts("back")}
                aria-label={copy.arrowBack}
                className="relative z-10 grid size-20 shrink-0 place-items-center bg-transparent transition-transform duration-150 hover:scale-105 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:size-24"
              >
                <Image src={`${GAME_ASSETS}/arrow-left-button.webp`} alt="" width={100} height={100} className="size-18 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)] sm:size-22" />
              </button>

              <div
                ref={productRailRef}
                className="mx-auto flex min-w-0 flex-1 snap-x snap-mandatory justify-start gap-3 overflow-x-auto px-1 pb-1 sm:max-w-[1120px] sm:gap-4 sm:px-3"
                style={{ scrollbarWidth: "none" }}
              >
                {filteredChoices.map((choice) => {
                  const isChosen = selectedChoice === choice.id || selectedProductIds.includes(choice.id);
                  const isBestAnswer = isChosen && choiceFeedback === "best-product";
                  const isAcceptableAnswer = (selectedChoice === choice.id || selectedProductIds.includes(choice.id)) && choiceFeedback === "acceptable-product";
                  const isWrongAnswer = isChosen && choiceFeedback === "incorrect";
                  const isPendingSelection = isMultipleProductTurn && isChosen && choiceFeedback === null;

                  return (
                    <div
                      key={choice.id}
                      className={`group relative flex aspect-[4/5] w-[min(32vw,136px)] shrink-0 snap-start flex-col items-center overflow-hidden rounded-[16px] border p-1.5 text-center transition-[border-color,background-color,box-shadow,transform] duration-150 sm:w-[140px] sm:p-2 lg:w-[144px] ${isBestAnswer ? "border-emerald-300 bg-emerald-950/55 shadow-[0_0_0_1px_rgba(110,231,183,0.3),0_0_24px_rgba(16,185,129,0.15)]" : isAcceptableAnswer ? "border-amber-200 bg-amber-950/50 shadow-[0_0_18px_rgba(251,191,36,0.18)]" : isWrongAnswer ? "border-rose-300/80 bg-rose-950/35" : isPendingSelection ? "border-cyan-200 bg-cyan-950/55 shadow-[0_0_18px_rgba(34,211,238,0.2)]" : "border-white/15 bg-slate-950/20 hover:border-cyan-300/55 hover:bg-slate-950/35"}`}
                    >
                      <button
                        type="button"
                        aria-label={`${copy.selectProduct}: ${choice.name}`}
                        aria-pressed={isChosen}
                        disabled={roundState !== "playing" || isResolvingChoice}
                        onClick={() => chooseProduct(choice)}
                        className="flex min-h-0 w-full flex-1 flex-col items-center text-center transition-transform duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 disabled:cursor-default disabled:active:scale-100"
                      >
                        <span
                          ref={(element) => {
                            if (element) productImageRefs.current.set(choice.id, element);
                            else productImageRefs.current.delete(choice.id);
                          }}
                          className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-[15px] border border-white/10 bg-white"
                        >
                          <Image src={choice.image} alt="" fill sizes="190px" className="object-contain p-2" />
                        </span>
                        <span className="flex min-h-[42px] w-full shrink-0 items-center justify-center px-1 sm:min-h-[48px]">
                          <span className="line-clamp-2 text-xs font-semibold leading-snug text-white sm:text-sm">{choice.name}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`${getGameCopy(PRODUCT_INFO_COPY, language).title}: ${choice.name}`}
                        aria-haspopup="dialog"
                        disabled={roundState !== "playing" || isResolvingChoice}
                        onClick={() => {
                          playSound(selectSoundRef.current);
                          setSelectedProductInfo(choice);
                        }}
                        className="flex min-h-7 w-full shrink-0 items-center justify-center gap-1 rounded-lg font-game text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100 transition-colors hover:bg-cyan-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-default disabled:opacity-50 sm:min-h-7 sm:text-[11px]"
                      >
                        <RiInformationLine className="size-3.5" aria-hidden="true" />
                        {getGameCopy(PRODUCT_INFO_COPY, language).button}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollProducts("forward")}
                aria-label={copy.arrowForward}
                className="relative z-10 grid size-20 shrink-0 place-items-center bg-transparent transition-transform duration-150 hover:scale-105 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:size-24"
              >
                <Image src={`${GAME_ASSETS}/arrow-right-button.webp`} alt="" width={100} height={100} className="size-18 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)] sm:size-22" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 sm:mt-3">
              <div role="group" aria-label={copy.productCategories} className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
                {categoryFilters.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={roundState !== "playing" || isResolvingChoice}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        productRailRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                      }}
                      className={`min-h-8 rounded-full border px-3 py-1 font-game text-xs font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-default sm:text-sm ${isSelected ? "border-cyan-100 bg-cyan-300 text-[#06243c] shadow-[0_0_12px_rgba(34,211,238,0.35)]" : "border-white/25 bg-[#061a30]/55 text-white hover:border-cyan-200/70 hover:bg-cyan-400/15"}`}
                    >
                      {category.label}
                    </button>
                  );
                })}
                {isMultipleProductTurn ? (
                  <button
                    type="button"
                    aria-label={`${copy.confirmSelection}: ${selectedProductIds.length}`}
                    disabled={roundState !== "playing" || isResolvingChoice || selectedProductIds.length === 0}
                    onClick={submitProductSelection}
                    className="min-h-8 rounded-full border border-cyan-100 bg-cyan-300 px-3 py-1 font-game text-xs font-extrabold text-[#06243c] shadow-[0_0_12px_rgba(34,211,238,0.3)] transition-colors hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm"
                  >
                    {copy.confirmSelection} ({selectedProductIds.length})
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        {currentTurn?.kind === "answer" && !isComplete && !isTimeUp ? (
          <div role="group" aria-label={conversationCopy.answerPrompt} className="mx-auto mt-4 grid min-h-0 w-full flex-1 -translate-y-[22px] content-center max-w-[960px] grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-3 sm:gap-4">
            {currentTurn.answers.map((answer) => {
              const isChosen = selectedChoice === answer.id;
              const isCorrectAnswer = isChosen && choiceFeedback === "correct-answer";
              const isWrongAnswer = isChosen && choiceFeedback === "incorrect";
              return (
                <button
                  key={answer.id}
                  type="button"
                  aria-pressed={isChosen}
                  disabled={roundState !== "playing" || isResolvingChoice}
                  onClick={() => chooseAnswer(answer.id, answer.correct)}
                  className={`min-h-[82px] rounded-[15px] border px-3 py-2.5 text-center font-game text-sm font-semibold leading-snug text-white transition-[border-color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0 sm:min-h-[112px] sm:px-4 sm:py-3 sm:text-base ${isCorrectAnswer ? "border-emerald-300 bg-emerald-950/65 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : isWrongAnswer ? "border-rose-300/80 bg-rose-950/55" : "border-white/20 bg-[#071b30]/75 hover:border-cyan-200/70 hover:bg-[#0d2943]/90"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200`}
                >
                  {answer.label[language]}
                </button>
              );
            })}
          </div>
        ) : null}

        </div>
      </section>
      {isComplete || isTimeUp ? (
        <GameResultScreen
          title={isTimeUp ? copy.timeUpTitle : conversationCopy.completeTitle}
          scoreLabel={copy.scoreLabel}
          points={points}
          pointsUnit={copy.pointsUnit}
          description={isTimeUp ? copy.timeUpDescription : conversationCopy.completePrompt}
          replayLabel={copy.replay}
          onReplay={() => {
            playSound(mainButtonSoundRef.current);
            replayRound();
          }}
        />
      ) : null}
      </div>
      </div>
    </>
  );
}
