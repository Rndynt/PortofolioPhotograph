import img8023 from '@assets/stock_images/professional_busines_4bcc34fe.jpg';

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="px-8 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-light mb-8 text-black tracking-wide" data-testid="about-title">
              Fzl
              <p className="mt-1 text-sm text-muted">Chief Moment Officer
              </p>
            </h2>
            
            <div className="space-y-6 text-gray-700 leading-relaxed" data-testid="about-bio">
              <p>
                I am a photographer based in Aceh, specializing in portrait, lifestyle photography, and graduation moments. 
                My work focuses on capturing authentic moments and genuine emotions.
              </p>
              <p>
                With over 8 years of experience, I have worked with various clients including peoples and brands. I believe in creating images that tell stories and connect with viewers 
                on an emotional level.
              </p>
            </div>
          </div>
          
          <div>
            <img
              src={img8023}
              alt="Fzl - Chief Moment Officer "
              className="w-full object-cover"
              data-testid="about-photo"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
