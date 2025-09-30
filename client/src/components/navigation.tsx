import { useState } from "react";
import { Menu, X, Waves, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm">
      <nav className="px-8 md:px-12 py-6">
        <div className="flex justify-between items-center">
          <div className="text-xl font-mono font-medium tracking-[-0.3em] text-black" data-testid="logo">
            FZ<span className="text-gray-400"> L</span>
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
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Waves className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-200"
              style={{ overflow: "hidden" }}
            >
              <motion.div 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="px-8 py-6 space-y-6"
              >
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
