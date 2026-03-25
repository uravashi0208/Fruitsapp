// ============================================================
// HOME PAGE — dynamic sliders from admin API
// ============================================================
import React from 'react';
import { HeroSlider } from '../components/ui/HeroSlider';
import { FeaturesSection } from '../components/ui/FeaturesSection';
import { CategoriesSection } from '../components/ui/CategoriesSection';
import { FeaturedProducts } from '../components/ui/FeaturedProducts';
import { DealOfTheDay } from '../components/ui/DealOfTheDay';
import { TestimonialsSection } from '../components/ui/TestimonialsSection';
import { PartnersSection } from '../components/ui/PartnersSection';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { useSliders } from '../hooks/useApi';

const HomePage: React.FC = () => {
  const { data: sliders, loading } = useSliders();

  return (
    <main>
      <HeroSlider
        slides={sliders ?? []}
        loading={loading}
      />
      <FeaturesSection />
      <CategoriesSection />
      <FeaturedProducts count={8} />
      <DealOfTheDay />
      <TestimonialsSection count={3} />
      <PartnersSection count={5} />
      <NewsletterSection />
    </main>
  );
};

export default HomePage;
