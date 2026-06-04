import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iris — Your personal AI executive assistant",
  description:
    "Iris texts you what you need before you need it. Reminders, tasks, calendar briefs — via SMS or web.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
