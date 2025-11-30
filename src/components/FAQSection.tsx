import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface SiteContent {
  content: any;
}

const FAQSection = () => {
  const { siteContent } = useSiteContent("faq");
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });

  const content = (siteContent as SiteContent | null)?.content || {
    title: "frequently asked questions",
    items: [
      {
        question: "will checking cards affect my credit score?",
        answer: "no. viewing matches or comparisons here doesn't impact your score."
      },
      {
        question: "how do you rank cards?",
        answer: "we weigh fees against real benefits for your profile: rewards, lounges, forex, co-brands, and issuer rules. clear math, no fluff."
      },
      {
        question: "do benefits change?",
        answer: "yes. issuers update perks. we track notable changes and add disclaimers where it matters."
      },
      {
        question: "what fees matter most?",
        answer: "annual fee, forex markup, cash withdrawal fees, and joining/renewal extras. we show the total impact, not just the headline."
      }
    ]
  };

  return (
    <section ref={ref} id="faqs" className="container mx-auto px-6 lg:px-12 py-12 md:py-16 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <h2 className={`text-2xl md:text-3xl font-heading font-bold text-foreground text-center mb-8 leading-tight transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {content.title}
        </h2>

        <Accordion type="single" collapsible className="space-y-2">
          {content.items.map((item: any, index: number) => (
            <AccordionItem 
              key={`item-${index + 1}`} 
              value={`item-${index + 1}`} 
              className={`bg-background/60 rounded-lg border border-border/30 px-5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: isVisible ? `${index * 80 + 200}ms` : '0ms' }}
            >
              <AccordionTrigger className="text-left font-sans text-sm md:text-base hover:no-underline py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
