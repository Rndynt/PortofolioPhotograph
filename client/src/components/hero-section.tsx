import image1 from '@assets/stock_images/professional_portrai_4a5b38db.jpg';
import image2 from '@assets/stock_images/professional_portrai_428c14cd.jpg';
import image3 from '@assets/stock_images/professional_portrai_e32a0d08.jpg';
import image4 from '@assets/stock_images/professional_portrai_e583df9a.jpg';
import image5 from '@assets/stock_images/professional_portrai_2cee816f.jpg';
import image6 from '@assets/stock_images/professional_portrai_e2fa21d0.jpg';

export default function HeroSection() {
  return (
    <section id="home" className="bg-neutral-100 py-8 sm:py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_1.5fr] gap-6 sm:gap-8 md:gap-12">
          {/* Left Content */}
          <div className="flex flex-col justify-center min-w-0">
            <p className="font-sans text-sm sm:text-base md:text-xl text-gray-600 mb-2" data-testid="hero-subheading">
              We are experienced
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold leading-tight" style={{ fontFamily: 'Georgia, serif' }} data-testid="hero-heading">
              Photographers
            </h1>
          </div>

          {/* Right Gallery (Staircase Layout) */}
          <div 
            className="grid grid-cols-3 grid-rows-[repeat(3,96px)] sm:grid-rows-[repeat(3,120px)] md:grid-rows-[repeat(3,140px)] gap-[8px] sm:gap-[10px] overflow-hidden rounded-xl min-w-0"
            data-testid="hero-gallery"
          >
            <img 
              src={image1} 
              alt="Professional photography portrait" 
              className="col-[1/2] row-[2/4] rounded-l-xl w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-1"
            />
            <img 
              src={image2} 
              alt="Professional photography portrait" 
              className="col-[2/3] row-[1/2] rounded-tl-xl w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-2"
            />
            <img 
              src={image3} 
              alt="Professional photography portrait" 
              className="col-[2/3] row-[2/3] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-3"
            />
            <img 
              src={image4} 
              alt="Professional photography portrait" 
              className="col-[2/3] row-[3/4] rounded-bl-xl w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-4"
            />
            <img 
              src={image5} 
              alt="Professional photography portrait" 
              className="col-[3/4] row-[1/3] rounded-tr-xl w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-5"
            />
            <img 
              src={image6} 
              alt="Professional photography portrait" 
              className="col-[3/4] row-[3/4] rounded-br-xl w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-6"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
