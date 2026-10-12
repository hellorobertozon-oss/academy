import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { AcademyProvider } from "@/components/academy-provider";
import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Xzone Academy — wiedza dla sprzedawców",
  description: "Poznaj produkty Xzone i pewniej doradzaj motocyklistom.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`${inter.variable} ${bebas.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background-full font-sans text-text-primary">
        <AcademyProvider>{children}</AcademyProvider>
      </body>
    </html>
  );
}
