import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { About, BarbersSection, ContactSection, Hero, HowItWorks, ServicesSection, Testimonials } from "@/components/site/sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia Premium — Agende seu corte online" },
      { name: "description", content: "Corte, barba e cuidado com hora marcada. Veja serviços, preços e agende online em segundos." },
      { property: "og:title", content: "Barbearia Premium — Agende seu corte online" },
      { property: "og:description", content: "Corte, barba e cuidado com hora marcada. Agende online em segundos." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <About />
      <ServicesSection />
      <HowItWorks />
      <BarbersSection />
      <Testimonials />
      <ContactSection />
    </SiteLayout>
  );
}
