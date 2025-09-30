import image1 from '@assets/stock_images/professional_portrai_4a5b38db.jpg';
import image2 from '@assets/stock_images/professional_portrai_428c14cd.jpg';
import image3 from '@assets/stock_images/professional_portrai_e32a0d08.jpg';
import image4 from '@assets/stock_images/professional_portrai_e583df9a.jpg';
import image5 from '@assets/stock_images/professional_portrai_2cee816f.jpg';
import image6 from '@assets/stock_images/professional_portrai_e2fa21d0.jpg';
import image7 from '@assets/stock_images/professional_portrai_03ca58cd.jpg';
import image8 from '@assets/stock_images/professional_portrai_83a4099f.jpg';

export default function HeroSection() {
  return (
    <section id="home" className="bg-neutral-100 pt-20 sm:pt-0 py-6 sm:py-8 md:py-12">
      <div className="w-full bg-white px-6 sm:px-8 md:px-12 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_1.5fr] gap-6 sm:gap-8 md:gap-12">
          {/* Left Content */}
          <div className="flex flex-col justify-center min-w-0">
            <p className="font-sans text-xs sm:text-sm md:text-base text-gray-600 mb-1 leading-tight" data-testid="hero-subheading">
              We are experienced
            </p>
            <h1 className="font-serif text-xl sm:text-2xl md:text-4xl font-bold leading-tight" style={{ fontFamily: 'Georgia, serif' }} data-testid="hero-heading">
              Story Framer
            </h1>
          </div>

          {/* Right Gallery - Mobile: 3 cols (5 images), Desktop: 4 cols (8 images) */}
          <div 
            className="grid grid-cols-8 sm:grid-cols-4 grid-rows-[repeat(5,100px)] sm:grid-rows-[repeat(4,110px)] md:grid-rows-[repeat(4,120px)] gap-[8px] sm:gap-[10px] overflow-hidden min-w-0"
            data-testid="hero-gallery"
          >
            {/* Image 1 - Mobile: col-[1/2] row-[2/4], Desktop: col-[1/2] row-[1/4] (3 rows tall, top-left) */}
            <img 
              src={image1} 
              alt="Professional photography portrait" 
              className="col-[1/5] row-[4/6] rounded-t-lg sm:col-[1/2] sm:row-[1/4] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-1"
            />
            
            {/* Image 2 - Mobile: col-[2/3] row-[1/2], Desktop: col-[1/2] row-[4/5] (1 row, bottom-left) */}
            <img 
              src={image2} 
              alt="Professional photography portrait" 
              className="col-[5/9] row-[5/6] rounded-t-lg sm:col-[1/2] sm:row-[4/5] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-2"
            />
            
            {/* Image 3 - Mobile: col-[2/3] row-[2/3], Desktop: col-[2/3] row-[1/3] (2 rows, top) */}
            <img 
              src={image3} 
              alt="Professional photography portrait" 
              className="col-[1/5] row-[3/4] rounded-t-lg sm:col-[2/3] sm:row-[1/3] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-3"
            />
            
            {/* Image 4 - Mobile: col-[2/3] row-[3/4], Desktop: col-[2/3] row-[3/5] (2 rows, bottom) */}
            <img 
              src={image4} 
              alt="Professional photography portrait" 
              className="col-[5/9] row-[3/5] rounded-t-lg sm:col-[2/3] sm:row-[3/5] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-4"
            />
            
            {/* Image 5 - Mobile: col-[3/4] row-[1/3], Desktop: col-[3/4] row-[1/2] (1 row, top) */}
            <img 
              src={image5} 
              alt="Professional photography portrait" 
              className="col-[1/5] row-[2/3] rounded-t-lg sm:col-[3/4] sm:row-[1/2] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-5"
            />
            
            {/* Image 6 - Desktop only: col-[3/4] row-[2/5] (3 rows tall, bottom) */}
            <img 
              src={image6} 
              alt="Professional photography portrait" 
              className="col-[5/9] row-[1/3] rounded-t-lg sm:col-[3/4] sm:row-[2/5] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-6"
            />
            
            {/* Image 7 - Desktop only: col-[4/5] row-[1/2] (1 row, top-right) */}
            <img 
              src={image7} 
              alt="Professional photography portrait" 
              className="hidden sm:block sm:col-[4/5] sm:row-[1/2] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-7"
            />
            
            {/* Image 8 - Desktop only: col-[4/5] row-[2/5] (3 rows tall, bottom-right) */}
            <img 
              src={image8} 
              alt="Professional photography portrait" 
              className="hidden sm:block sm:col-[4/5] sm:row-[2/5] w-full h-full object-cover"
              loading="lazy"
              data-testid="hero-image-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
