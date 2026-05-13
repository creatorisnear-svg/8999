import { useState } from "react";
import { TrendingUp, Lock, Loader2 } from "lucide-react";
import { useAuthLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const login = useAuthLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    login.mutate(
      { data: { password } },
      {
        onSuccess: () => onSuccess(),
        onError: () =>
          toast({ title: "Wrong password", variant: "destructive" }),
      },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">TikTok Drop</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Enter your password to continue
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-9"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                data-testid="input-password"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={login.isPending || !password}
            data-testid="button-login"
          >
            {login.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
