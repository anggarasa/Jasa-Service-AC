import { HeroSection } from '@/features/home/hero-section';
import { ServicesSection } from '@/features/home/services-section';
import { WhyUsSection } from '@/features/home/why-us-section';
import { HowItWorksSection } from '@/features/home/how-it-works-section';
import { ServiceAreaSection } from '@/features/home/service-area-section';
import { CtaSection } from '@/features/home/cta-section';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <WhyUsSection />
      <HowItWorksSection />
      <ServiceAreaSection />
      <CtaSection />
    </>
  );
}
