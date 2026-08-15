import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;

  return {
    title: "FlickPick — Movie Night, Solved",
    description: "Swipe through movies with friends and instantly discover the pick everyone loves.",
    icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
    openGraph: {
      title: "FlickPick — Stop scrolling. Start watching.",
      description: "The collaborative movie matcher for indecisive friend groups.",
      type: "website",
      images: [{ url: image, width: 1731, height: 909, alt: "FlickPick — Stop scrolling. Start watching." }],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
