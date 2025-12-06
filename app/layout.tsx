// app/layout.tsx
import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import AppShell from "./AppShell";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dashboard แพทย์แผนไทย รพ.สระโบสถ์",
  description: "Dashboard แสดงผลรายได้แพทย์แผนไทย รพ.สระโบสถ์",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={prompt.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}