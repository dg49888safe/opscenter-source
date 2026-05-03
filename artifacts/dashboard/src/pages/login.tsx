import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ username, password });
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error?.message || "Invalid credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background grid elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-muted/50 border-b border-border px-6 py-4 flex items-center gap-3">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm tracking-wider text-muted-foreground">AUTH_SYSTEM_V2.1</span>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2 text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Secure Login</h1>
              <p className="text-sm text-muted-foreground font-mono">Enter operator credentials</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="font-mono bg-background/50 focus:bg-background border-border focus:border-primary transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono bg-background/50 focus:bg-background border-border focus:border-primary transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full font-mono uppercase tracking-widest group"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <span className="flex items-center">
                  <Lock className="w-4 h-4 mr-2 group-hover:hidden" />
                  <Lock className="w-4 h-4 mr-2 hidden group-hover:block text-primary-foreground" />
                  Authorize Access
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
