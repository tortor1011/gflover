import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "💌 มีบางอย่างอยากบอก",
  description: "สำหรับคนพิเศษ 🩷",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
