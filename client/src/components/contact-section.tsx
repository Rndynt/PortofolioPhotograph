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
    subject: "",
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
        subject: "",
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
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-light mb-4"
              data-testid="contact-title"
            >
              Get In Touch
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-muted-foreground"
              data-testid="contact-subtitle"
            >
              Ready to capture your special moments? Let's discuss your project.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Your full name"
                    className="w-full"
                    data-testid="input-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                    className="w-full"
                    data-testid="input-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject
                  </Label>
                  <Select value={formData.subject} onValueChange={handleSelectChange} required>
                    <SelectTrigger className="w-full" data-testid="select-subject">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait Session</SelectItem>
                      <SelectItem value="wedding">Wedding Photography</SelectItem>
                      <SelectItem value="event">Event Photography</SelectItem>
                      <SelectItem value="commercial">Commercial Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    required
                    placeholder="Tell me about your project..."
                    className="w-full resize-none"
                    data-testid="textarea-message"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-md hover:bg-primary/90 transition-colors duration-200 font-medium"
                  disabled={isSubmitting}
                  data-testid="button-submit-contact"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </motion.div>
            
            {/* Contact Information */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-medium mb-6" data-testid="contact-info-title">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4" data-testid="contact-email">
                    <Mail className="text-primary text-xl w-6" />
                    <span className="text-foreground">alex@alexchenphoto.com</span>
                  </div>
                  <div className="flex items-center space-x-4" data-testid="contact-phone">
                    <Phone className="text-primary text-xl w-6" />
                    <span className="text-foreground">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center space-x-4" data-testid="contact-location">
                    <MapPin className="text-primary text-xl w-6" />
                    <span className="text-foreground">New York, NY</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-medium mb-6" data-testid="social-title">Follow My Work</h3>
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className="bg-muted hover:bg-primary text-muted-foreground hover:text-primary-foreground p-3 rounded-lg transition-colors duration-200"
                      data-testid={social.testId}
                    >
                      <i className={`${social.icon} text-xl`}></i>
                    </a>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-medium mb-6" data-testid="studio-hours-title">Studio Hours</h3>
                <div className="space-y-2 text-muted-foreground" data-testid="studio-hours">
                  <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                  <p>Saturday: 10:00 AM - 5:00 PM</p>
                  <p>Sunday: By appointment only</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
