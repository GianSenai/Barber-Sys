import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isDemoAdminSession } from "@/lib/barbearia/demo-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  
  beforeLoad: async () => {
    // Libera o administrador de demonstração.
    if (isDemoAdminSession()) return;

    // Mantém a verificação antiga do Supabase.
    try {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        throw redirect({ to: "/auth" });
      }
    } catch {
      throw redirect({ to: "/auth" });
    }
  },

  component: () => <Outlet />,
});
