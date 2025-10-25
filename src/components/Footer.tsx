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
        
        <div className="mt-12 pt-8 border-t border-border/30 text-center">
          <p className="text-xs font-sans text-muted-foreground">
            © 2025 card & carry. all rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
