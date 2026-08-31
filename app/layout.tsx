import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Can I Trust This Seller?",
  description: "Before you send the money, investigate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
