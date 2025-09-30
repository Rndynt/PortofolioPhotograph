import { motion } from "framer-motion";
import { Linkedin, Instagram, Mail } from "lucide-react";

export default function SocialMediaSection() {
  const socialLinks = [
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "https://www.linkedin.com/in/yourprofile",
      testId: "social-linkedin"
    },
    {
      name: "Instagram",
      icon: Instagram,
      href: "https://www.instagram.com/yourprofile",
      testId: "social-instagram"
    },
    {
      name: "Email",
      icon: Mail,
      href: "mailto:hello@example.com",
      testId: "social-email"
    }
  ];

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="px-8 md:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-sm font-light tracking-[0.3em] text-gray-400 mb-8 uppercase" data-testid="social-title">
              Connect
            </h3>
            
            <div className="flex justify-center items-center gap-8 md:gap-12">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative"
                  data-testid={social.testId}
                  aria-label={social.name}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 transition-all duration-300 group-hover:border-black group-hover:bg-black">
                      <social.icon className="w-5 h-5 text-gray-600 transition-colors duration-300 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-light tracking-wider text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {social.name}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
