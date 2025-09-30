import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

export default function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      subject: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/contact", formData);
      
      toast({
        title: "Message sent successfully!",
        description: "Thank you for your message. I will get back to you soon.",
      });
      
      setFormData({
        name: "",
        email: "",
        subject: "General Inquiry",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    { icon: "fab fa-instagram", href: "#", testId: "social-instagram" },
    { icon: "fab fa-facebook", href: "#", testId: "social-facebook" },
    { icon: "fab fa-twitter", href: "#", testId: "social-twitter" },
    { icon: "fab fa-linkedin", href: "#", testId: "social-linkedin" }
  ];

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="px-8 md:px-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-light mb-8 text-black tracking-wide" data-testid="contact-title">
            CONTACT
          </h2>
          <p className="text-gray-700 mb-12" data-testid="contact-subtitle">
            Available for assignments worldwide. Let's create something beautiful together.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                <div>
                  <Label htmlFor="name" className="block text-sm font-light text-black mb-2">
                    NAME *
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder=""
                    className="w-full border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus:border-black focus:ring-0"
                    data-testid="input-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="block text-sm font-light text-black mb-2">
                    EMAIL *
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder=""
                    className="w-full border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus:border-black focus:ring-0"
                    data-testid="input-email"
                  />
                </div>
                
                
                <div>
                  <Label htmlFor="message" className="block text-sm font-light text-black mb-2">
                    MESSAGE *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    placeholder=""
                    className="w-full border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus:border-black focus:ring-0 resize-none"
                    data-testid="textarea-message"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="bg-black text-white py-3 px-8 hover:bg-gray-800 transition-colors duration-200 font-light text-sm tracking-wide"
                  disabled={isSubmitting}
                  data-testid="button-submit-contact"
                >
                  {isSubmitting ? "SENDING..." : "SEND"}
                </Button>
              </form>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <div className="space-y-4 text-gray-700">
                  <div data-testid="contact-email">
                    fzl@moment.com
                  </div>
                  <div data-testid="contact-phone">
                    +1 (555) 123-4567
                  </div>
                  <div data-testid="contact-location">
                    Banda Aceh, ID
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
