import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from 'next/font/google';

// Load Poppins font - a modern, geometric sans-serif with a distinctive look
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "Synthetica - AI Synthetic Data Generator",
  description: "Generate synthetic data with AI for your development needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
