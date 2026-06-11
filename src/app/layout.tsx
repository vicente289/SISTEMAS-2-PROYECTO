import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoMarket Bolivia SRL",
  description:
    "Prototipo academico B2C para comercio electronico de productos organicos bolivianos con IA e Industria 4.0.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
