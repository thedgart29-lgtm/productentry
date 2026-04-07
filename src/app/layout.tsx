"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { cn } from "@/lib/utils";
import "./globals.css";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn && pathname !== "/login") {
      setAuthorized(false);
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <title>Factory Hub | Pen Production</title>
      <body className={cn("bg-slate-50 min-h-screen", !isLoginPage && "pro-layout")}>
        <AuthGuard>
          {!isLoginPage && <Sidebar />}
          <div className={cn("main-container overflow-hidden", isLoginPage && "block w-full h-screen")}>
            {!isLoginPage && <TopHeader />}
            <main className={cn(
              "overflow-y-auto border-slate-100 min-h-screen",
              !isLoginPage ? "bg-slate-50 px-2 py-4 border-t" : "bg-slate-900 p-0 border-none w-full h-full flex items-center justify-center"
            )}>
                {children}
            </main>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}
