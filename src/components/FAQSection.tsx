import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

const FAQSection = () => {
  return (
    <section id="faqs" className="container mx-auto px-6 lg:px-12 py-24 md:py-32 bg-card/30 scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground text-center mb-12 leading-tight">
          frequently asked questions
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1" className="bg-background/60 rounded-lg border border-border/30 px-6">
            <AccordionTrigger className="text-left font-sans text-base md:text-lg hover:no-underline">
              will checking cards affect my credit score?
            </AccordionTrigger>
            <AccordionContent className="font-sans text-muted-foreground leading-relaxed">
              no. we don't pull your credit file. our recommendations are based on your spending patterns and preferences, not your credit history. only when you apply for a card through the issuer's website will there be a credit inquiry.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="bg-background/60 rounded-lg border border-border/30 px-6">
            <AccordionTrigger className="text-left font-sans text-base md:text-lg hover:no-underline">
              how do you rank cards?
            </AccordionTrigger>
            <AccordionContent className="font-sans text-muted-foreground leading-relaxed">
              we analyze your spending patterns and match them with each card's benefits. cards are scored based on how well their rewards, perks, and fees align with your actual usage. you can also sort by different criteria like annual fee, welcome bonus, or popularity to find what matters most to you.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="bg-background/60 rounded-lg border border-border/30 px-6">
            <AccordionTrigger className="text-left font-sans text-base md:text-lg hover:no-underline">
              do benefits change?
            </AccordionTrigger>
            <AccordionContent className="font-sans text-muted-foreground leading-relaxed">
              yes. banks can modify card benefits, fees, and terms at any time. we strive to keep our database up-to-date and surface notable changes in each card's detail page. however, always verify the current terms and conditions on the issuer's official website before applying.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="bg-background/60 rounded-lg border border-border/30 px-6">
            <AccordionTrigger className="text-left font-sans text-base md:text-lg hover:no-underline">
              what fees matter?
            </AccordionTrigger>
            <AccordionContent className="font-sans text-muted-foreground leading-relaxed">
              the main fees to consider are: <strong>annual/joining fee</strong> (can often be waived with spending), <strong>forex markup</strong> (for international transactions), <strong>cash withdrawal charges</strong> (avoid using credit cards for cash), and <strong>late payment fees</strong> (always pay on time). we highlight these key fees in our comparisons.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
