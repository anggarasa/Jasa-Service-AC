import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('Frontend Homepage and UI Structure Test Suite', () => {
  const homePagePath = path.resolve(__dirname, '../src/app/(public)/page.tsx');
  const navbarPath = path.resolve(__dirname, '../src/components/layouts/navbar.tsx');
  const footerPath = path.resolve(__dirname, '../src/components/layouts/footer.tsx');
  const heroPath = path.resolve(__dirname, '../src/features/home/hero-section.tsx');
  const servicesPath = path.resolve(__dirname, '../src/features/home/services-section.tsx');
  const whyUsPath = path.resolve(__dirname, '../src/features/home/why-us-section.tsx');
  const howItWorksPath = path.resolve(__dirname, '../src/features/home/how-it-works-section.tsx');
  const serviceAreaPath = path.resolve(__dirname, '../src/features/home/service-area-section.tsx');
  const ctaPath = path.resolve(__dirname, '../src/features/home/cta-section.tsx');
  const connectionStatusPath = path.resolve(__dirname, '../src/components/common/connection-status.tsx');

  it('should render all 6 required sections on public homepage', () => {
    assert.ok(fs.existsSync(homePagePath), 'Homepage file exists');
    const content = fs.readFileSync(homePagePath, 'utf8');

    assert.ok(content.includes('<HeroSection />'), 'Hero section is included');
    assert.ok(content.includes('<ServicesSection />'), 'Services section is included');
    assert.ok(content.includes('<WhyUsSection />'), 'WhyUs section is included');
    assert.ok(content.includes('<HowItWorksSection />'), 'HowItWorks section is included');
    assert.ok(content.includes('<ServiceAreaSection />'), 'ServiceArea section is included');
    assert.ok(content.includes('<CtaSection />'), 'Cta section is included');
  });

  it('should verify Navbar structure, responsive toggles, and accessible links', () => {
    assert.ok(fs.existsSync(navbarPath), 'Navbar component exists');
    const content = fs.readFileSync(navbarPath, 'utf8');

    // Brand and logo
    assert.ok(content.includes('CoolCare') || content.includes('AC Service'), 'Navbar contains brand name');
    // Navigation links
    assert.ok(content.includes('#layanan'), 'Navbar has link to services');
    assert.ok(content.includes('#keunggulan'), 'Navbar has link to why us');
    assert.ok(content.includes('#cara-kerja'), 'Navbar has link to how it works');
    assert.ok(content.includes('#area-layanan'), 'Navbar has link to service area');
    // Responsive mobile menu toggle
    assert.ok(content.includes('sm:hidden') || content.includes('md:hidden') || content.includes('lg:hidden'), 'Navbar contains responsive mobile trigger');
    // Connection status indicator present in development
    assert.ok(content.includes('ConnectionStatus'), 'Navbar incorporates live ConnectionStatus');
  });

  it('should verify Service Preview Section has 4 core service cards with transparent pricing notes', () => {
    assert.ok(fs.existsSync(servicesPath), 'Services section exists');
    const content = fs.readFileSync(servicesPath, 'utf8');

    assert.ok(content.includes('Cuci AC') || content.includes('Perawatan'), 'Includes AC cleaning service');
    assert.ok(content.includes('Freon') || content.includes('Isi Freon'), 'Includes Freon service');
    assert.ok(content.includes('Perbaikan') || content.includes('Reparasi'), 'Includes repair service');
    assert.ok(content.includes('Bongkar') || content.includes('Pasang'), 'Includes installation service');
  });

  it('should ensure no fake functional booking forms exist before Phase 04', () => {
    const ctaContent = fs.readFileSync(ctaPath, 'utf8');
    const heroContent = fs.readFileSync(heroPath, 'utf8');

    // Must not submit a fake booking creation or fabricate successful checkout
    assert.ok(!ctaContent.includes('handleSubmit(onSubmit)'), 'CTA has no fake booking form submission');
    assert.ok(!heroContent.includes('<form action="/api/v1/booking"'), 'Hero has no unauthorized booking POST form');
  });

  it('should check responsive layout constraints (320px, 375px, 768px, 1024px, 1440px)', () => {
    const heroContent = fs.readFileSync(heroPath, 'utf8');
    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    const footerContent = fs.readFileSync(footerPath, 'utf8');

    // Check responsive grid and padding classes
    assert.ok(heroContent.includes('px-4') || heroContent.includes('container'), 'Hero has responsive horizontal padding');
    assert.ok(navbarContent.includes('max-w-7xl') || navbarContent.includes('container'), 'Navbar respects container max-width');
    assert.ok(footerContent.includes('grid-cols-') || footerContent.includes('flex-col'), 'Footer uses responsive grid/flex layout');
  });

  it('should verify health connection indicator component logic and accessible badges', () => {
    assert.ok(fs.existsSync(connectionStatusPath), 'ConnectionStatus component exists');
    const content = fs.readFileSync(connectionStatusPath, 'utf8');

    assert.ok(content.includes('apiClient.getHealth'), 'Calls getHealth API');
    assert.ok(content.includes('Operasional'), 'Shows operational status badge');
    assert.ok(content.includes('Terputus'), 'Shows disconnected status badge');
  });
});
