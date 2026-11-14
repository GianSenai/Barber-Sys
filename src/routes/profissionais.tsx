import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BarbersSection, PageHeader } from "@/components/site/sections";

export const Route = createFileRoute("/profissionais")({
  head: () => ({
    meta: [
      { title: "Nossos barbeiros — Barber Sys" },
      { name: "description", content: "Conheça a equipe de barbeiros e suas especialidades." },
      { property: "og:title", content: "Nossos barbeiros — Barber Sys" },
      { property: "og:description", content: "Conheça a equipe e agende com seu barbeiro preferido." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHeader eyebrow="Equipe" title="Nossos barbeiros" text="Escolha quem vai cuidar do seu visual." />
      <BarbersSection title={false} />
    </SiteLayout>
  ),
});
