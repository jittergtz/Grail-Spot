import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter an email");
    if (!isSupabaseConfigured) {
      toast.error("Auth is not configured. Contact admin or set VITE_SUPABASE_* env vars.");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        console.error(error);
        toast.error("Failed to send magic link");
        return;
      }
      toast.success("Magic link sent — check your email");
      setEmail("");
      // Optionally navigate back
      // navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex">
      <div className="hidden md:block w-1/2 h-screen">
        <img src="/Auth.png" alt="Auth image" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 w-full md:w-1/2 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold">Welcome to <span style={{ fontStyle: "italic", fontWeight: 500, fontFamily: "'Source Serif 4', serif" }}>Grail</span> Spot</h1>
            <p className="text-muted-foreground">Sign in to manage your wishlist</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
             
              />
            </div>

            <div className="flex items-center justify-between">
              <Button  type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send magic link"}
              </Button>
              <Link to="/" className="text-sm text-muted-foreground">
                Back
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;


