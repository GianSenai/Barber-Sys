import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ContactSection, PageHeader } from "@/components/site/sections";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato e endereço — Barbearia Premium" },
      { name: "description", content: "Endereço, horário de funcionamento, telefone e WhatsApp da barbearia." },
      { property: "og:title", content: "Contato — Barbearia Premium" },
      { property: "og:description", content: "Endereço, horários e WhatsApp." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHeader eyebrow="Contato" title="Fale com a gente" />
      <ContactSection />
    </SiteLayout>
  ),
});
