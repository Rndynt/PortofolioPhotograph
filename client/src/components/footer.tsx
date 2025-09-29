export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-2xl font-bold text-primary mb-2" data-testid="footer-logo">
              Alex Chen
            </div>
            <p className="text-muted-foreground" data-testid="footer-tagline">
              Professional Photographer
            </p>
          </div>
          
          <div className="flex space-x-6">
            <button
              onClick={() => scrollToSection("home")}
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid="footer-nav-home"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("portfolio")}
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid="footer-nav-portfolio"
            >
              Portfolio
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid="footer-nav-about"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid="footer-nav-contact"
            >
              Contact
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
          <p data-testid="footer-copyright">
            &copy; {currentYear} Alex Chen Photography. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
