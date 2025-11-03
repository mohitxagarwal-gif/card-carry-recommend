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
        answer: "no. we don't pull your credit file. our recommendations are based on your spending patterns and preferences, not your credit history. only when you apply for a card through the issuer's website will there be a credit inquiry."
      },
      {
        question: "how do you rank cards?",
        answer: "we analyze your spending patterns and match them with each card's benefits. cards are scored based on how well their rewards, perks, and fees align with your actual usage. you can also sort by different criteria like annual fee, welcome bonus, or popularity to find what matters most to you."
      },
      {
        question: "do benefits change?",
        answer: "yes. banks can modify card benefits, fees, and terms at any time. we strive to keep our database up-to-date and surface notable changes in each card's detail page. however, always verify the current terms and conditions on the issuer's official website before applying."
      },
      {
        question: "what fees matter?",
        answer: "the main fees to consider are: annual/joining fee (can often be waived with spending), forex markup (for international transactions), cash withdrawal charges (avoid using credit cards for cash), and late payment fees (always pay on time). we highlight these key fees in our comparisons."
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
