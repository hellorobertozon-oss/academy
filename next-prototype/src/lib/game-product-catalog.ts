export type GameProductCategory = "helmets" | "textile-clothing" | "leather-clothing" | "care" | "accessories";

export type GameProduct = {
  id: string;
  name: string;
  category: GameProductCategory;
  image: string;
};

// Product names and 500px packshots sourced from https://xzone24.com/shop/.
export const GAME_PRODUCT_CATALOG: GameProduct[] = [
  {
    id: "interior-refresher-man",
    name: "Xzone® Interior Refresher with Silver Ions Man 100ml",
    category: "helmets",
    image: "/assets/xzone-products/Refresher_Man_01.webp",
  },
  {
    id: "leather-care-balm",
    name: "Xzone® Leather Care Hydrate&Protect Balm 100ml",
    category: "leather-clothing",
    image: "/assets/xzone-products/Leather_Maintenace_Milk_01.webp",
  },
  {
    id: "leather-cleaner",
    name: "Xzone® Leather Cleaner 150ml",
    category: "leather-clothing",
    image: "/assets/xzone-products/Leather_Cleaner_01.webp",
  },
  {
    id: "leather-cleaning-brush",
    name: "Xzone® Leather Cleaning Brush",
    category: "leather-clothing",
    image: "/assets/xzone-products/Xzone_brush_01_u7t9-o5.webp",
  },
  {
    id: "interior-refresher-woman",
    name: "Xzone® Interior Refresher with Silver Ions Woman 100ml",
    category: "helmets",
    image: "/assets/xzone-products/Refresher_Woman_01.webp",
  },
  {
    id: "interior-refresher-neptun",
    name: "Xzone® Interior Refresher with Silver Ions Neptun 100ml",
    category: "helmets",
    image: "/assets/xzone-products/Refresher_Neptun_01.webp",
  },
  {
    id: "helmet-freshener-mint",
    name: "Xzone® Helmet Freshener with Silver Ions Mint 50ml",
    category: "helmets",
    image: "/assets/xzone-products/Refresher_Mint_01.webp",
  },
  {
    id: "helmet-interior-care",
    name: "Xzone® Helmet Interior Care 300ml",
    category: "helmets",
    image: "/assets/xzone-products/Helmet_Care_01.webp",
  },
  {
    id: "helmet-cleaning-gel",
    name: "Xzone® Helmet Cleaning Gel 250ml",
    category: "helmets",
    image: "/assets/xzone-products/Helmet_Cleaning_Gel_01.webp",
  },
  {
    id: "helmet-detailer",
    name: "Xzone® Helmet Detailer 250ml",
    category: "helmets",
    image: "/assets/xzone-products/detailer_for_helmet_01.webp",
  },
  {
    id: "helmet-cleaning-gel-mini",
    name: "Xzone® Helmet Cleaning Gel Mini 30ml",
    category: "helmets",
    image: "/assets/xzone-products/Helmet_Cleaning_Gel_mini_01.webp",
  },
  {
    id: "helmet-detailer-mini",
    name: "Xzone® Helmet Detailer Mini 30ml",
    category: "helmets",
    image: "/assets/xzone-products/Helmet_Detailer_mini_01.webp",
  },
  {
    id: "helmet-care-kit",
    name: "Xzone® Helmet Care Kit",
    category: "helmets",
    image: "/assets/xzone-products/Helmet_Care_Kit_Giga_01.webp",
  },
  {
    id: "helmet-care-trip-kit",
    name: "Xzone® Helmet Care Trip Kit",
    category: "helmets",
    image: "/assets/xzone-products/Helmet_Care_Kit_Trip_Version_01.webp",
  },
  {
    id: "helmet-cleaning-trip-kit",
    name: "Xzone® Helmet Cleaning Trip Kit",
    category: "helmets",
    image: "/assets/xzone-products/Helmet_Cleaning_Gel_mini_01_ynd9-kv.webp",
  },
  {
    id: "zip-service-agent",
    name: "Xzone® Zip Service Agent 10ml",
    category: "textile-clothing",
    image: "/assets/xzone-products/Zip_Service_02_tu3b-c5.webp",
  },
  {
    id: "textile-washing-liquid",
    name: "Xzone® Textile Washing Liquid 300ml",
    category: "textile-clothing",
    image: "/assets/xzone-products/Textile_Care_01_ni9z-qr.webp",
  },
  {
    id: "fabric-protect-freshness-extender",
    name: "Xzone® Fabric Protect Freshness Extender 300ml",
    category: "textile-clothing",
    image: "/assets/xzone-products/Fabric_Protect_01_x3vz-aq.webp",
  },
  {
    id: "active-care-sportswear-wash",
    name: "Xzone® Active Care Thermo&Sportswear Wash 300ml",
    category: "textile-clothing",
    image: "/assets/xzone-products/Active_Care_01_j23n-f8.webp",
  },
  {
    id: "merino-care-wash",
    name: "Xzone® Merino Care Wool&Delicate Fabric Wash 300ml",
    category: "textile-clothing",
    image: "/assets/xzone-products/Merino_Care_01_1oek-pu.webp",
  },
  {
    id: "jeans-care-liquid",
    name: "Xzone® Jeans Care Liquid for Washing Denim Clothing",
    category: "textile-clothing",
    image: "/assets/xzone-products/Jeans_Care_01_edcx-17.webp",
  },
  {
    id: "textile-care-kit",
    name: "Xzone® Textile Care Kit",
    category: "textile-clothing",
    image: "/assets/xzone-products/Textile_Care_Kit_01.webp",
  },
  {
    id: "leather-care-kit",
    name: "Xzone® Leather Care Kit",
    category: "leather-clothing",
    image: "/assets/xzone-products/Xzone_Leather_Care_Kit_01.webp",
  },
  {
    id: "helmet-interior-care-sachet",
    name: "Xzone® Helmet Interior Care Sachet 40ml",
    category: "helmets",
    image: "/assets/xzone-products/Helmet_care_sachet_01_izlo-rg.webp",
  },
  {
    id: "magic-gloves-cleaner",
    name: "Xzone® Magic Gloves-Product for Cleaning Gloves Interior",
    category: "textile-clothing",
    image: "/assets/xzone-products/Magical_Gloves_02.webp",
  },
  {
    id: "premium-microfiber",
    name: "Xzone® Premium Microfiber",
    category: "accessories",
    image: "/assets/xzone-products/mikrofibra_bezszwowa_01_v2_wd1q-p8.webp",
  },
  {
    id: "motorcycle-detailing-set",
    name: "XzoneRide® Motorcycle Detailing Set",
    category: "care",
    image: "/assets/xzone-products/detailing_set_01.webp",
  },
  {
    id: "power-powder-moto-wash",
    name: "XzoneRide® Power Powder-Moto Wash",
    category: "care",
    image: "/assets/xzone-products/Power_powder_moto_wash_04_o92s-0b.webp",
  },
  {
    id: "fiber-hand",
    name: "XzoneRide® Fiber Hand",
    category: "accessories",
    image: "/assets/xzone-products/fiber_hand_01_bmw1-g3.webp",
  },
  {
    id: "active-care-sportswear-sachet",
    name: "Xzone® Active Care Thermo&Sportswear Wash Sachet 40ml",
    category: "textile-clothing",
    image: "/assets/xzone-products/Active_care_sachet_01_zu63-ee.webp",
  },
  {
    id: "power-powder-bug-killer",
    name: "XzoneRide® Power Powder-Bug Killer",
    category: "care",
    image: "/assets/xzone-products/Power_powder_miniaturka_copy.webp",
  },
  {
    id: "power-powder-wheelixir",
    name: "XzoneRide® Power Powder-Wheelixir",
    category: "care",
    image: "/assets/xzone-products/power_powder_wheelixir_04_4pe3-e5.webp",
  },
  {
    id: "motorcycle-ceramic-detailer",
    name: "XzoneRide® Motorcycle Ceramic Detailer 500ml",
    category: "care",
    image: "/assets/xzone-products/ceramic_detailer_01_ap12-zo.webp",
  },
  {
    id: "detailing-fiber",
    name: "XzoneRide® Detailing Fiber",
    category: "accessories",
    image: "/assets/xzone-products/detailing_fiber_01_kpdl-0x.webp",
  },
  {
    id: "wheel-brush",
    name: "Wheel Brush",
    category: "accessories",
    image: "/assets/xzone-products/Detailing_Wheel_Brush_01.webp",
  },
  {
    id: "power-powder-shaker",
    name: "XzoneRide® Shaker for Power Powder",
    category: "accessories",
    image: "/assets/xzone-products/shaker_01.webp",
  },
  {
    id: "freshener-orange-spritz",
    name: "Xzone® Freshener with Silver Ions – Orange Spritz",
    category: "helmets",
    image: "/assets/xzone-products/Refresher_Orange_01.webp",
  },
  {
    id: "wash-and-ride-cleaner",
    name: "Wash&Ride - Quick Motorcycle Cleaner",
    category: "care",
    image: "/assets/xzone-products/wash___ride_01_s03z-tj.webp",
  },
  {
    id: "microfiber-cloths-roll",
    name: "Xzone® Microfiber Cleaning Cloths on a Roll (20 pcs)",
    category: "accessories",
    image: "/assets/xzone-products/mikrofibra_na_rolce_01_qown-ln.webp",
  },
  {
    id: "mud-breaker",
    name: "Xzone® Mud Breaker - Removes Mud and Grime",
    category: "care",
    image: "/assets/xzone-products/Mud_Breaker01_48go-kv_p41a-4o.jpeg",
  },
  {
    id: "dirt-finisher",
    name: "Xzone® Dirt Finisher – cleans and protects",
    category: "care",
    image: "/assets/xzone-products/Dirt_Finisher01_15a7-b5.jpeg",
  },
  {
    id: "evolon-detailing-cloths",
    name: "Set of 2 Evolon® Detailing Cloths",
    category: "accessories",
    image: "/assets/xzone-products/Evolon_01.webp",
  },
  {
    id: "washing-booster-active-oxygen",
    name: "Washing booster with active oxygen",
    category: "textile-clothing",
    image: "/assets/xzone-products/Booster_01.webp",
  },
  {
    id: "jeans-care-sachet",
    name: "Jeans Care - jeans & Kevlar wash 40ml sachet",
    category: "textile-clothing",
    image: "/assets/xzone-products/Jeans_care_sashet_01_rpxt-xr.webp",
  },
  {
    id: "motorcycle-detailing-soft-brush",
    name: "XzoneRide® Motorcycle Detailing Soft Brush",
    category: "accessories",
    image: "/assets/xzone-products/Soft_brush_01_nd9c-y7.webp",
  },
  {
    id: "chain-brush",
    name: "XzoneRide® Chain Brush",
    category: "accessories",
    image: "/assets/xzone-products/Chain_Brush_01_csrj-0s.webp",
  },
  {
    id: "wooden-knee-sliders",
    name: "Wooden Knee Sliders",
    category: "accessories",
    image: "/assets/xzone-products/sliders_thumbnail.webp",
  },
  {
    id: "need-speed-hoodie",
    name: "Need Speed Hoodie",
    category: "textile-clothing",
    image: "/assets/xzone-products/bluza_kaptur_przod_popr-scaled.jpg",
  },
];
