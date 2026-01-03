import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import "@aws-amplify/ui-react/styles.css";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplifyClientSide";
import QueryProvider from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dev Toolkit - Productivity Platform for Developers",
  description:
    "A comprehensive productivity platform for developers. Manage your blogs, bookmarks, notes, and projects all in one place.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      </body>
    </html>
  );
}
