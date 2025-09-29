import img8024 from '@assets/IMG_8024_1759174260300.jpeg';

export default function HeroSection() {
  const scrollToPortfolio = () => {
    document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Full screen image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${img8024})`
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      {/* Minimal overlay content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-12">
        {/* Top left title */}
        <div className="text-white">
          <h1 className="text-4xl md:text-6xl font-light tracking-wide mb-2" data-testid="hero-title">
            ALEX CHEN
          </h1>
          <p className="text-lg md:text-xl font-light opacity-90" data-testid="hero-subtitle">
            PHOTOGRAPHER
          </p>
        </div>
        
        {/* Bottom right navigation */}
        <div className="self-end text-white">
          <button
            onClick={scrollToPortfolio}
            className="text-lg md:text-xl font-light hover:opacity-70 transition-opacity"
            data-testid="button-view-portfolio"
          >
            VIEW WORK →
          </button>
        </div>
      </div>
    </section>
  );
}
