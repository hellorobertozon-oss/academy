import type { Metadata } from "next";
import { TradeFairShowcase } from "@/components/pages/trade-fair-showcase";
import { TRADE_FAIR_PRODUCTS } from "@/lib/trade-fair-products";

export const metadata: Metadata = {
  title: "Xzone products | Xzone Academy",
  description: "Explore the Xzone product collection in English and Italian.",
};

export default function TradeFairPage() {
  return <TradeFairShowcase products={TRADE_FAIR_PRODUCTS} />;
}
