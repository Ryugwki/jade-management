import React from "react";
import "../styles/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { LoadingProvider } from "../contexts/LoadingContext";
import { FeedbackProvider } from "../contexts/FeedbackContext";
import { AppShell } from "../components/AppShell";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app-sans",
});

export const metadata = {
  title: "Jade Management",
  description: "A modern Jade management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans`}>
        <AuthProvider>
          <LanguageProvider>
            <LoadingProvider>
              <FeedbackProvider>
                <AppShell>{children}</AppShell>
              </FeedbackProvider>
            </LoadingProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
