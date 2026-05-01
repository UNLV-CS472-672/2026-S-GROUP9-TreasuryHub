import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TreasuryHub",
    template: "%s | TreasuryHub",
  },
  description: "Financial management for student organizations",
  icons: {
    icon: "/assets/LOGO_OFFICIAL_THUB.png",
  },
};

// Inline script that runs before React hydrates. Reads the saved theme
// preference from localStorage and applies the .dark class on <html> if
// needed. This prevents a "flash of unstyled content" (FOUC) where the
// page shows in the default theme for one frame before the toggle kicks
// in. Has to be inline; loading a separate script would still cause a
// flash. dangerouslySetInnerHTML is the standard pattern for this.
const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('treasuryhub-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');

    var root = document.documentElement;
    root.classList.remove('light', 'dark', 'lightbright');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'lightbright') {
      root.classList.add('lightbright');
    } else {
      root.classList.add('light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}