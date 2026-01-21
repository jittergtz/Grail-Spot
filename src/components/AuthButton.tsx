import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const AuthButton = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted) setUser(session?.user ?? null);
    }
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        if (listener && (listener as any).subscription && typeof (listener as any).subscription.unsubscribe === "function") {
          (listener as any).subscription.unsubscribe();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const handleNavigateToAuth = () => navigate("/auth");

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return <Button className="rounded-full" onClick={handleNavigateToAuth}>Log in</Button>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm truncate max-w-[160px]">{user.email}</span>
      <Button className="rounded-full" variant="ghost" onClick={signOut}>
        Log out
      </Button>
    </div>
  );
};


