// app/layout.tsx
import "./globals.css";
import { Toaster } from "react-hot-toast";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI Avatars",
  description: "AI Avatar generator with Next.js, Supabase and Replicate",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}

