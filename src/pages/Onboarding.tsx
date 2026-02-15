import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Onboarding = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    // Check if already onboarded
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", session.user.id)
      .single();
      
    if (profile?.has_completed_onboarding) {
        navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
        toast.error("Please enter a username");
        return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Check if username is taken
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .neq("id", user.id) // Don't count self if updating
        .single();

      if (existingUser) {
        toast.error("Username is already taken");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
            username: username.trim(),
            has_completed_onboarding: true 
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated!");
      // Force a hard reload to ensure all auth states are updated
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl shadow-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Grail Spot</h1>
          <p className="text-muted-foreground mt-2">
            Please choose a username to join the conversation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. designguru99"
              className="rounded-lg"
              minLength={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-full"
            disabled={loading}
          >
            {loading ? "Setting up..." : "Complete Setup"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
