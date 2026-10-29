export type TradeFairCatalogCategory =
  | "helmet"
  | "fresheners"
  | "leather"
  | "textile"
  | "accessories"
  | "motorcycle"
  | "off-road";

export type TradeFairProductVideo = {
  src: string;
  title: string;
};

export const TRADE_FAIR_PRODUCT_CATEGORIES: Record<string, TradeFairCatalogCategory | TradeFairCatalogCategory[]> = {
  "interior-refresher-man": "fresheners",
  "interior-refresher-woman": "fresheners",
  "interior-refresher-neptun": "fresheners",
  "helmet-freshener-mint": ["helmet", "fresheners"],
  "helmet-interior-care": "helmet",
  "helmet-cleaning-gel": "helmet",
  "helmet-detailer": "helmet",
  "helmet-cleaning-gel-mini": "helmet",
  "helmet-detailer-mini": "helmet",
  "helmet-care-kit": "helmet",
  "helmet-care-trip-kit": "helmet",
  "helmet-cleaning-trip-kit": "helmet",
  "helmet-interior-care-sachet": "helmet",
  "freshener-orange-spritz": "fresheners",

  "leather-care-balm": "leather",
  "leather-cleaner": "leather",
  "leather-cleaning-brush": ["leather", "accessories"],
  "leather-care-kit": "leather",

  "zip-service-agent": ["leather", "accessories"],
  "textile-washing-liquid": "textile",
  "fabric-protect-freshness-extender": "textile",
  "active-care-sportswear-wash": "textile",
  "merino-care-wash": "textile",
  "jeans-care-liquid": "textile",
  "textile-care-kit": "textile",
  "active-care-sportswear-sachet": "textile",
  "washing-booster-active-oxygen": "textile",
  "jeans-care-sachet": "textile",

  "magic-gloves-cleaner": "leather",
  "premium-microfiber": ["accessories", "motorcycle", "off-road"],
  "evolon-detailing-cloths": ["accessories", "motorcycle"],
  "wooden-knee-sliders": "accessories",
  "need-speed-hoodie": "accessories",

  "motorcycle-detailing-set": "motorcycle",
  "power-powder-moto-wash": ["motorcycle", "off-road"],
  "fiber-hand": ["motorcycle", "accessories", "off-road"],
  "power-powder-bug-killer": ["motorcycle", "off-road"],
  "power-powder-wheelixir": ["motorcycle", "off-road"],
  "motorcycle-ceramic-detailer": "motorcycle",
  "detailing-fiber": ["motorcycle", "accessories", "off-road"],
  "wheel-brush": ["motorcycle", "accessories", "off-road"],
  "power-powder-shaker": ["motorcycle", "accessories", "off-road"],
  "wash-and-ride-cleaner": "motorcycle",
  "microfiber-cloths-roll": ["motorcycle", "accessories", "off-road"],
  "motorcycle-detailing-soft-brush": ["motorcycle", "accessories", "off-road"],
  "chain-brush": ["motorcycle", "accessories", "off-road"],

  "mud-breaker": ["off-road", "motorcycle"],
  "dirt-finisher": ["off-road", "motorcycle"],
  "offroad-set": ["off-road", "motorcycle"],
};

// Recommended retail prices from Seweryn's EICMA catalogue; prices are in EUR.
// Products absent from that source intentionally have no price entry.
export const TRADE_FAIR_PRODUCT_PRICES_EUR: Record<string, number> = {
  "interior-refresher-man": 14.9,
  "leather-care-balm": 12.9,
  "leather-cleaner": 10.9,
  "leather-cleaning-brush": 5.9,
  "interior-refresher-woman": 14.9,
  "interior-refresher-neptun": 14.9,
  "helmet-freshener-mint": 9.9,
  "helmet-interior-care": 13.9,
  "helmet-cleaning-gel": 12.9,
  "helmet-detailer": 13.9,
  "helmet-cleaning-gel-mini": 7.9,
  "helmet-detailer-mini": 7.9,
  "helmet-care-kit": 27.9,
  "helmet-care-trip-kit": 23.9,
  "helmet-cleaning-trip-kit": 15.9,
  "zip-service-agent": 6.9,
  "textile-washing-liquid": 16.9,
  "fabric-protect-freshness-extender": 14.9,
  "active-care-sportswear-wash": 11.9,
  "merino-care-wash": 11.9,
  "jeans-care-liquid": 11.9,
  "washing-booster-active-oxygen": 1.5,
  "textile-care-kit": 29.9,
  "leather-care-kit": 34.9,
  "helmet-interior-care-sachet": 3.5,
  "magic-gloves-cleaner": 7.5,
  "premium-microfiber": 6.9,
  "evolon-detailing-cloths": 2.25,
  "motorcycle-detailing-set": 54.9,
  "power-powder-moto-wash": 11.9,
  "fiber-hand": 11.9,
  "active-care-sportswear-sachet": 3.5,
  "power-powder-bug-killer": 13.9,
  "power-powder-wheelixir": 13.9,
  "motorcycle-ceramic-detailer": 18.9,
  "detailing-fiber": 9.9,
  "wheel-brush": 6.9,
  "power-powder-shaker": 2.5,
  "freshener-orange-spritz": 14.9,
  "wash-and-ride-cleaner": 11.9,
  "microfiber-cloths-roll": 9.9,
  "mud-breaker": 11.9,
  "dirt-finisher": 11.9,
  "offroad-set": 29,
  "jeans-care-sachet": 3.5,
  "motorcycle-detailing-soft-brush": 4.9,
  "chain-brush": 2.5,
};

// Product videos uploaded to the public CS-Cart EICMAzap/FILMY directory.
const csCartVideo = (fileName: string, title: string): TradeFairProductVideo => ({
  src: 'https://robertozon.com/images/EICMAzap/FILMY/' + fileName,
  title,
});

export const TRADE_FAIR_PRODUCT_VIDEOS: Record<string, TradeFairProductVideo[]> = {
  'interior-refresher-man': [
    csCartVideo('IONS_MEN.mp4', 'Interior Refresher with Silver Ions - Man'),
  ],
  'interior-refresher-woman': [
    csCartVideo('IONS_WOMEN.mp4', 'Interior Refresher with Silver Ions - Woman'),
  ],
  'interior-refresher-neptun': [
    csCartVideo('IONS_NEPTUN.mp4', 'Interior Refresher with Silver Ions - Neptun'),
  ],
  'freshener-orange-spritz': [
    csCartVideo('IONS_SPRITZ.mp4', 'Interior Refresher with Silver Ions - Orange Spritz'),
  ],
  'helmet-freshener-mint': [
    csCartVideo('HELMET_FRESHENER.mp4', 'Helmet Freshener with Silver Ions'),
  ],
  'helmet-interior-care': [
    csCartVideo('HELMETINTERIOR_ANG.mp4', 'Helmet Interior Care - English version'),
  ],
  'helmet-cleaning-gel': [
    csCartVideo('BIG_GEL.mp4', 'Helmet Cleaning Gel - 250 ml'),
  ],
  'helmet-detailer': [
    csCartVideo('BIG_DETAILER.mp4', 'Helmet Detailer - 250 ml'),
  ],
  'helmet-cleaning-gel-mini': [
    csCartVideo('SMALL_GEL.mp4', 'Helmet Cleaning Gel - 30 ml'),
  ],
  'helmet-care-kit': [
    csCartVideo('GIGAZESTAW.mp4', 'Helmet Care Kit GIGA'),
  ],
  'helmet-care-trip-kit': [
    csCartVideo('YELLOWBOX.mp4', 'Helmet Care Kit Trip Version'),
  ],
  'leather-care-balm': [
    csCartVideo('LEATHER_MILK.mp4', 'Leather Care - hydrate and protect'),
  ],
  'leather-cleaner': [
    csCartVideo('LEATHER_CLEANER.mp4', 'Leather Cleaner'),
  ],
  'leather-cleaning-brush': [
    csCartVideo('CLEANING_BRUSH.mp4', 'Leather Cleaning Brush'),
  ],
  'leather-care-kit': [
    csCartVideo('LEATHER_CARE_KIT.mp4', 'Leather Care Kit'),
  ],
  'zip-service-agent': [
    csCartVideo('ZIP_AGENT.mp4', 'Zip Service Agent'),
  ],
  'textile-care-kit': [
    csCartVideo('TEXTILE_CARE_KIT.mp4', 'Textile Care Kit'),
  ],
  'fabric-protect-freshness-extender': [
    csCartVideo('fabric_protect.mp4', 'Fabric Protect'),
  ],
  'active-care-sportswear-wash': [
    csCartVideo('ACTIVE_CARE_BOTTLE.mp4', 'Active Care - bottle'),
  ],
  'active-care-sportswear-sachet': [
    csCartVideo('ACTIVE_CARE_SACHET_ANG.mp4', 'Active Care - sachet'),
  ],
  'jeans-care-liquid': [
    csCartVideo('JEANS_CARE_BOTTLE.mp4', 'Jeans Care - bottle'),
  ],
  'jeans-care-sachet': [
    csCartVideo('JEANS_CARE_SACHET_ANG.mp4', 'Jeans Care - sachet'),
  ],
  'washing-booster-active-oxygen': [
    csCartVideo('oxygen_boost.mp4', 'Washing Booster with Active Oxygen'),
  ],
  'magic-gloves-cleaner': [
    csCartVideo('MAGICAL_GLOVES.mp4', 'Magical Gloves: cleaning motorcycle gloves'),
  ],
  'premium-microfiber': [
    csCartVideo('MICROFIBER_850GSM.mp4', 'Premium Microfiber 850 GSM'),
  ],
  'evolon-detailing-cloths': [
    csCartVideo('EVOLON.mp4', 'Evolon Detailing Cloths'),
  ],
  'motorcycle-detailing-soft-brush': [
    csCartVideo('DETAIL_BRUSH.mp4', 'Motorcycle Detailing Brush'),
  ],
  'power-powder-moto-wash': [
    csCartVideo('POWER_POWDER.mp4', 'Power Powder Moto Wash'),
  ],
  'fiber-hand': [
    csCartVideo('GLOVE_FIBER.mp4', 'Fiber Hand'),
  ],
  'power-powder-bug-killer': [
    csCartVideo('BUG_KILLER.mp4', 'Power Powder Bug Killer'),
  ],
  'power-powder-wheelixir': [
    csCartVideo('WHEELIXIR_ANG.mp4', 'Power Powder Wheelixir'),
  ],
  'motorcycle-ceramic-detailer': [
    csCartVideo('CERAMIC_DETAILER.mp4', 'Motorcycle Ceramic Detailer'),
  ],
  'wheel-brush': [
    csCartVideo('WHEEL_BRUSH.mp4', 'Wheel Brush'),
  ],
  'chain-brush': [
    csCartVideo('CHAIN_BRUSH.mp4', 'Chain Brush'),
  ],
  'wash-and-ride-cleaner': [
    csCartVideo('WASH-N-RIDE-ANG.mp4', 'Wash&Ride - Quick Motorcycle Cleaner'),
  ],
  'dirt-finisher': [
    csCartVideo('DIRT_FINISH.mp4', 'Dirt Finisher'),
  ],
  'mud-breaker': [
    csCartVideo('MUD_BREAKER.mp4', 'Mud Breaker'),
  ],
  'offroad-set': [
    csCartVideo('OFFROAD%20SET.mp4', 'Offroad Set'),
  ],
};
