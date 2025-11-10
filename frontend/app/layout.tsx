import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Smart Contract Security Validator",
    description:
        "Upload or paste Solidity smart contracts and get instant security feedback."
};

type RootLayoutProps = {
    children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
                {children}
            </body>
        </html>
    );
}

