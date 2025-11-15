import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "./components/theme-provider";

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
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const stored = localStorage.getItem('theme');
                                    const theme = stored || 'system';
                                    let resolved = 'dark';
                                    
                                    if (theme === 'system') {
                                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                        resolved = prefersDark ? 'dark' : 'light';
                                    } else {
                                        resolved = theme;
                                    }
                                    
                                    if (resolved === 'dark') {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                } catch (e) {
                                    // Fallback to dark if there's an error
                                    document.documentElement.classList.add('dark');
                                }
                            })();
                        `,
                    }}
                />
            </head>
            <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}

