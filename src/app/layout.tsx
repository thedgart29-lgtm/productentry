import { Metadata } from "next";
import ClientWrapper from "@/components/ClientWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Factory Hub | Pen Production",
  description: "Industrial Core Suite - Professional ERP & Accounting Solution",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen pro-layout">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
