import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Green Biz Card",
  description: "Generate a contact QR code and order a premium metal business card.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
