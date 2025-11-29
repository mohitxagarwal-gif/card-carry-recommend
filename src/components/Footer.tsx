import { Lock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-hairline bg-canvas mt-20">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="text-2xl font-heading font-bold text-ink">
              card & carry.
            </h3>
            <p className="text-sm font-body text-subtle text-center md:text-left">
              smart credit card recommendations for india
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <a 
              href="#" 
              className="text-sm font-body text-subtle hover:text-ink transition-colors duration-150 focus-ring rounded px-2 py-1"
            >
              privacy
            </a>
            <a 
              href="#" 
              className="text-sm font-body text-subtle hover:text-ink transition-colors duration-150 focus-ring rounded px-2 py-1"
            >
              terms
            </a>
            <a 
              href="#" 
              className="text-sm font-body text-subtle hover:text-ink transition-colors duration-150 focus-ring rounded px-2 py-1"
            >
              contact
            </a>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="mt-12 pt-8 border-t border-hairline space-y-4">
          <div className="max-w-4xl mx-auto space-y-3 text-xs text-subtle text-center">
            <p className="font-body">
              <strong className="text-ink font-semibold">direct links:</strong> all "apply" buttons link directly 
              to the bank's official application page. we don't earn commissions or fees from applications.
            </p>
            <p className="font-body">
              <strong className="text-ink font-semibold">education note:</strong> our picks are based on your inputs. 
              always verify terms, fees, and eligibility with the issuer before applying.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="inline-flex items-center gap-2 glass-surface glass-highlight rounded-pill px-4 py-2 group cursor-pointer gloss-band">
                <Lock className="h-4 w-4 text-primary" />
                <p className="privacy-chip text-ink">
                  we never store card numbers or passwords
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-hairline text-center">
          <p className="text-xs font-body text-subtle">
            © 2025 card & carry. all rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
