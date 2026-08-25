import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/src/styles/shell.css";
import "@/src/styles/plp.css";
import "@/src/styles/pdp.css";
import "@/src/styles/pages.css";
import "@/src/styles/motion.css";
import { AuthProvider } from "@/src/components/AuthProvider";
import { Navbar } from "@/src/components/Navbar";
import { ThemeProvider } from "@/src/components/ThemeProvider";
import { ToastProvider } from "@/src/components/ToastProvider";

export const metadata: Metadata = {
  title: "Thrift & Co. — Secondhand Marketplace",
  description:
    "Pre-loved, carefully selected secondhand goods — each with its own character and history.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const themeInit = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className="main-content fade-up">{children}</main>
              <footer className="site-footer fade-up">
                <div className="container">
                  🛍️ Thrift<span style={{ color: "var(--accent)" }}>&</span>Co. — give things a
                  second life.
                </div>
              </footer>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
