import type { Metadata } from "next";
import { Literata, Onest } from "next/font/google";
import "./globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: "Ilya ♥ Aigul",
  description: "Наш день — живая фотостена / Our day — live photo wall",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${literata.variable} ${onest.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
