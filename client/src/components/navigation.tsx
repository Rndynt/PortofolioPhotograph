import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm">
      <nav className="px-8 md:px-12 py-6">
        <div className="flex justify-between items-center">
          <div className="text-xl font-light tracking-wide text-black" data-testid="logo">
            AC
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-12 items-center">
            <button
              onClick={() => scrollToSection("portfolio")}
              className="text-black font-light hover:opacity-70 transition-opacity text-sm tracking-wide"
              data-testid="nav-portfolio"
            >
              WORK
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-black font-light hover:opacity-70 transition-opacity text-sm tracking-wide"
              data-testid="nav-about"
            >
              ABOUT
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-black font-light hover:opacity-70 transition-opacity text-sm tracking-wide"
              data-testid="nav-contact"
            >
              CONTACT
            </button>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:opacity-70 transition-opacity"
              data-testid="nav-whatsapp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-black"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-200">
            <div className="px-8 py-6 space-y-6">
              <button
                onClick={() => scrollToSection("portfolio")}
                className="block text-black font-light hover:opacity-70 transition-opacity w-full text-left text-sm tracking-wide"
                data-testid="mobile-nav-portfolio"
              >
                WORK
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="block text-black font-light hover:opacity-70 transition-opacity w-full text-left text-sm tracking-wide"
                data-testid="mobile-nav-about"
              >
                ABOUT
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="block text-black font-light hover:opacity-70 transition-opacity w-full text-left text-sm tracking-wide"
                data-testid="mobile-nav-contact"
              >
                CONTACT
              </button>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-black font-light hover:opacity-70 transition-opacity w-full text-left text-sm tracking-wide"
                data-testid="mobile-nav-whatsapp"
              >
                WHATSAPP
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
