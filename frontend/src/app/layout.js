import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Global Youth Opportunities Portal",
  description: "Explore scholarships, volunteering, internships, change-making, and competing opportunities worldwide. Designed to empower youth mobility and global discovery.",
};

export default function RootLayout({ children, drawer }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full dark`}
    >
      <body className="min-h-full flex flex-col bg-abyss text-gray-100 selection:bg-signal selection:text-abyss">
        {children}
        {drawer}
      </body>
    </html>
  );
}
