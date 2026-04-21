import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cache } from "react";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import "@aws-amplify/ui-react/styles.css";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplifyClientSide";
import QueryProvider from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteSettings } from "@/services/common.service";
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const getCachedSiteSettings = cache(getSiteSettings);

export const revalidate = 3600; // Revalidate shared layout data every hour

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSiteSettings();
  return {
    title: settings.metaTitle,
    description: settings.metaDescription,
    keywords: settings.keywords || undefined,
    icons: {
      icon: "/favicon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getCachedSiteSettings();
  const gaId = settings.googleAnalyticsId;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConfigureAmplifyClientSide />
          <QueryProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 2000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>

        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
