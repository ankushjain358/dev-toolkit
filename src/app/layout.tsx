import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import "@aws-amplify/ui-react/styles.css";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplifyClientSide";
import QueryProvider from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dev Toolkit Blog",
  description: "A modern blog platform built with Next.js and AWS Amplify",
  icons: {
    icon: "/favicon.png", // Path to your favicon in the public directory
    // You can also add other icons like apple-touch-icon, etc.
    // apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
      </body>
    </html>
  );
}
