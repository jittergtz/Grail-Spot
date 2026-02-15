import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ItemDetail from "./pages/ItemDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import Onboarding from "./pages/Onboarding";
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);
  const hasCheckedRef = useRef(false);

  // Keep the ref in sync with current path
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  // Subscribe to auth changes ONCE — no location dependency
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only act on actual sign-in, not token refreshes etc.
      if (event !== "SIGNED_IN") return;
      if (!session) return;

      // Don't redirect if already on onboarding or auth
      const currentPath = pathnameRef.current;
      if (currentPath === "/onboarding" || currentPath === "/auth") return;

      // Only check once per session to avoid repeated redirects
      if (hasCheckedRef.current) return;
      hasCheckedRef.current = true;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("has_completed_onboarding")
          .eq("id", session.user.id)
          .single();

        if (error && error.code === "PGRST116") {
          // No profile row exists — create one (insert, NOT upsert, to avoid overwriting)
          await supabase.from("profiles").insert({
            id: session.user.id,
            has_completed_onboarding: false,
          });
          navigate("/onboarding");
          return;
        }

        if (profile && !profile.has_completed_onboarding) {
          navigate("/onboarding");
        }
      } catch (err) {
        console.error("AuthWrapper error:", err);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthWrapper>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
