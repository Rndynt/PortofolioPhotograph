import { motion } from "framer-motion";

export default function AboutSection() {
  const experience = [
    {
      title: "National Geographic Contributor",
      period: "2020 - Present"
    },
    {
      title: "Freelance Photographer", 
      period: "2015 - Present"
    },
    {
      title: "Studio Assistant",
      period: "2013 - 2015"
    }
  ];

  const skills = [
    "Portrait Photography",
    "Landscape Photography", 
    "Wedding Photography",
    "Photo Editing",
    "Studio Lighting",
    "Digital Retouching"
  ];

  return (
    <section id="about" className="py-20 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                alt="Alex Chen - Photographer"
                className="w-full rounded-lg shadow-xl"
                data-testid="about-photo"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-4xl md:text-5xl font-light mb-6 text-card-foreground" data-testid="about-title">
                About Alex
              </h2>
              
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed" data-testid="about-bio">
                <p>
                  With over a decade of experience capturing life's most precious moments, I am passionate about 
                  telling stories through the lens. My journey began in the bustling streets of New York, where I 
                  developed my eye for finding beauty in the everyday.
                </p>
                <p>
                  I specialize in portrait photography, landscape work, and urban exploration. Each photograph is 
                  a collaboration between myself and my subjects, creating authentic moments that will be treasured 
                  for generations to come.
                </p>
                <p>
                  When I'm not behind the camera, you can find me exploring new locations, experimenting with different 
                  lighting techniques, or mentoring aspiring photographers in my community workshops.
                </p>
              </div>
              
              <div className="mt-8 space-y-4">
                <h3 className="text-2xl font-medium text-card-foreground" data-testid="experience-title">Experience</h3>
                <div className="space-y-3">
                  {experience.map((exp, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      data-testid={`experience-${index}`}
                    >
                      <h4 className="font-medium text-card-foreground">{exp.title}</h4>
                      <p className="text-muted-foreground">{exp.period}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-2xl font-medium text-card-foreground mb-4" data-testid="skills-title">Skills</h3>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, index) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm"
                      data-testid={`skill-${index}`}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
