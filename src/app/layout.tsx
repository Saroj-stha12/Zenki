import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "zenki",
  description: "server-backed snippet manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
