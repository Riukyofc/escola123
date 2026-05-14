import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#0f2347",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://portal-edithnair.vercel.app"),
  title: "U.E. Professora Edith Nair Furtado da Silva — Portal Escolar",
  description:
    "Portal oficial da Unidade Escolar Professora Edith Nair Furtado da Silva. Acesse avisos, informações institucionais e o sistema escolar.",
  keywords: [
    "escola",
    "portal escolar",
    "Edith Nair",
    "Viana",
    "Maranhão",
    "educação",
    "notas",
    "frequência",
  ],
  authors: [{ name: "SEMED Viana" }],
  openGraph: {
    title: "U.E. Professora Edith Nair — Portal Escolar",
    description:
      "Acesse notas, frequência, avisos e muito mais no portal oficial da escola.",
    images: ["/img/educational_hero_banner.png"],
    type: "website",
    locale: "pt_BR",
  },
  icons: {
    icon: "/img/favicon.png",
    apple: "/img/favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Portal Escolar" />
        <link rel="apple-touch-icon" href="/img/favicon.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
