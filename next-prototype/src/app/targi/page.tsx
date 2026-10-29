import type { Metadata } from "next";
import { TradeFairCatalog } from "@/components/pages/trade-fair-catalog";

export const metadata: Metadata = {
  title: "Produkty Xzone | Xzone Academy",
  description: "Poznaj produkty Xzone do pielęgnacji kasku, odzieży i motocykla.",
};

export default function TradeFairPage() {
  return <TradeFairCatalog />;
}
