import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useSiteContent } from "@/hooks/useSiteContent";

interface SiteContent {
  content: any;
}

const FAQSection = () => {
  const { siteContent } = useSiteContent("faq");

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
    <section id="faqs" className="container mx-auto px-6 lg:px-12 py-24 md:py-32 bg-card/30 scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground text-center mb-12 leading-tight">
          {content.title}
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {content.items.map((item: any, index: number) => (
            <AccordionItem key={`item-${index + 1}`} value={`item-${index + 1}`} className="bg-background/60 rounded-lg border border-border/30 px-6">
              <AccordionTrigger className="text-left font-sans text-base md:text-lg hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="font-sans text-muted-foreground leading-relaxed">
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
