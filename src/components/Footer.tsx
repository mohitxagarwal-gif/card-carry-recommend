import { CreditCard } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 mt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Card & Carry</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © 2025 C&C. Smart credit card recommendations for India.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
