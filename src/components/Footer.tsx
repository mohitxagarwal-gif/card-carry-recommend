const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-background/50 mt-20">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="text-2xl font-playfair italic font-medium text-foreground">
              card & carry.
            </h3>
            <p className="text-sm font-sans text-muted-foreground text-center md:text-left">
              smart credit card recommendations for india
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <a 
              href="#" 
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              privacy
            </a>
            <a 
              href="#" 
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              terms
            </a>
            <a 
              href="#" 
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              contact
            </a>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="mt-12 pt-8 border-t border-border/30 space-y-4">
          <div className="max-w-4xl mx-auto space-y-3 text-xs text-muted-foreground text-center">
            <p>
              <strong className="text-foreground">Affiliate Disclosure:</strong> Some links on this site may be affiliate links. 
              We may earn a commission when you apply through these links, at no additional cost to you. 
              This helps us keep Card & Carry free and continuously improve our recommendations.
            </p>
            <p>
              <strong className="text-foreground">Educational Purpose:</strong> All information provided is for educational purposes only. 
              Card & Carry provides recommendations based on spending patterns, but we encourage you to verify all terms, 
              conditions, fees, and eligibility criteria directly with card issuers before applying.
            </p>
            <p>
              <strong className="text-foreground">Privacy Commitment:</strong> We never store your account numbers, passwords, 
              or any sensitive financial credentials. Your uploaded statements are processed securely and used solely to 
              generate personalized recommendations.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border/30 text-center">
          <p className="text-xs font-sans text-muted-foreground">
            © 2025 card & carry. all rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
