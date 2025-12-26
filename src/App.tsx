
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => {
  // FORCE CORRECT ID (Migration Fix)
  const TARGET_ID = "f7418784-3317-48e5-8be2-c6945877e019";
  const currentId = localStorage.getItem('schedule_installation_id');
  if (currentId !== TARGET_ID) {
    console.warn(`⚠️ ID incorreto (${currentId}) detectado. Corrigindo para ${TARGET_ID}...`);
    localStorage.setItem('schedule_installation_id', TARGET_ID);
    // localStorage.setItem('scheduleData', ...? No, let old data persist or be ignored)
    // If we change ID, we might want to reload to ensure hooks pick it up fresh?
    // Hooks read on mount. Ideally we do this before provider render.
    // This component body runs before providers.
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner
          toastOptions={{
            classNames: {
              error: 'bg-red-600 text-white border-red-700 font-medium shadow-lg',
              success: 'bg-green-600 text-white border-green-700 font-medium shadow-lg',
              warning: 'bg-orange-500 text-white border-orange-600 font-medium shadow-lg',
              info: 'bg-blue-600 text-white border-blue-700 font-medium shadow-lg',
              toast: 'bg-white text-black border-gray-200 shadow-lg', // Default
            },
          }}
        />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
