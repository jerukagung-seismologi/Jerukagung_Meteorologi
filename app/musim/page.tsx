"use client";

import { useTheme } from "next-themes";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import SeasonalPredictionMap from "@/components/graphics/SeasonalPredictionMap";

function MusimContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return <SeasonalPredictionMap isDarkMode={isDark} />;
}

export default function MusimPage() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="weather-theme-preference">
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="w-full h-[calc(100vh-81px)] sm:h-[calc(100vh-122px)] min-h-[540px]">
          <MusimContent />
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
