
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInDemoAdmin } from "@/lib/barbearia/demo-auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBusy(true);

    const success = signInDemoAdmin(email, password);

    if (!success) {
      toast.error("E-mail ou senha incorretos.");
      setBusy(false);
      return;
    }

    toast.success("Login realizado com sucesso!");

    navigate({ to: "/admin" });
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Barber Sys</h1>
          <p className="text-sm text-muted-foreground">
            Entre na sua conta para continuar.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@barbersys.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="mb-2 font-semibold">Acesso de demonstração</p>
          <p>
            <strong>E-mail:</strong> admin@barbersys.com
          </p>
          <p>
            <strong>Senha:</strong> BarberSys@2026!
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Acesso local. Não é necessário conectar um banco de dados.
          </p>
        </div>
      </div>
    </main>
  );
}
