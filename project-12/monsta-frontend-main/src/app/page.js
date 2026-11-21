import HeroSlider from './components/HeroSlider';
import BannerSection from './components/BannerSection';
import ProductTabs from './components/ProductTabs';
import TrendingBanner from './components/TrendingBanner'; 
import BestsellingProducts from './components/BestsellingProducts';
import ShippingArea from './components/ShippingArea';
import Testimonials from './components/Testimonials';
import Newsletter from './components/Newsletter';

export default function Home() {
  return (
    <>
      <HeroSlider />
      <BannerSection />
      <ProductTabs />
      <TrendingBanner /> 
      <BestsellingProducts />
      <ShippingArea />
      <Testimonials />
      <Newsletter />
    </>
  );
}