import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader, ServicesSection } from "@/components/site/sections";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços e preços — Barbearia Premium" },
      { name: "description", content: "Corte tradicional, degradê, infantil, barba e sobrancelha. Confira preços e duração." },
      { property: "og:title", content: "Serviços e preços — Barbearia Premium" },
      { property: "og:description", content: "Confira preços e duração de cada atendimento." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHeader eyebrow="Serviços" title="Serviços e preços" text="Escolha o atendimento ideal e agende direto pelo site." />
      <ServicesSection title={false} />
    </SiteLayout>
  ),
});
