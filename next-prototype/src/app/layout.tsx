import type { Metadata } from "next";
import Script from "next/script";
import { Bebas_Neue, Inter, Rajdhani } from "next/font/google";
import { AcademyProvider } from "@/components/academy-provider";
import "leaflet/dist/leaflet.css";
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

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Xzone Academy — wiedza dla sprzedawców",
  description: "Poznaj produkty Xzone i pewniej doradzaj motocyklistom.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`${inter.variable} ${bebas.variable} ${rajdhani.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background-full font-sans text-text-primary">
        <AcademyProvider>{children}</AcademyProvider>
        <Script id="academy-theme-bootstrap" strategy="beforeInteractive">
          {`const path = location.pathname; const adminPanel = path.startsWith("/admin") && !path.startsWith("/admin/user-preview"); const tradeFairKiosk = path === "/targi" || path.startsWith("/targi/"); let savedTheme = "light"; try { savedTheme = localStorage.getItem("boardui:theme") === "dark" ? "dark" : "light"; } catch {} document.documentElement.classList.toggle("dark", adminPanel ? savedTheme === "dark" : !tradeFairKiosk);`}
        </Script>
      </body>
    </html>
  );
}
