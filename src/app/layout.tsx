import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Poppins } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Extremle",
  description:
    "A daily guessing game for the Geometry Dash extreme demon community. Six guesses to name the mystery level from the Pointercrate top 150 demonlist.",
  icons: {
    icon: "/extremlelogo-removebg.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        <div className="decor-squares decor-squares-left" aria-hidden="true" />
        <div className="decor-squares decor-squares-right" aria-hidden="true" />
        <Navbar />
        <main className="flex-1 flex flex-col pt-14">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
