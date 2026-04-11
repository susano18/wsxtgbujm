import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SmartAtt | World-Class Attendance System",
  description: "Advanced face recognition attendance system with real-time analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className={`${inter.variable} ${outfit.variable} font-inter min-h-screen bg-background`}>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'glass dark:text-white',
              duration: 4000,
            }} 
          />
        </AuthProvider>
      </body>
    </html>
  );
}
