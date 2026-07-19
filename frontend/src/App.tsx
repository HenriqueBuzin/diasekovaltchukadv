import { useEffect, useState } from 'react';

import { loadSiteConfig } from './api';
import { ContactSection } from './components/ContactSection';
import { Navigation } from './components/Navigation';
import { About, Hero, Practice, Process, Team } from './components/StaticSections';
import { WhatsAppLink } from './components/WhatsAppLink';
import type { SiteConfig } from './types';

interface SiteConfigProps {
  config: SiteConfig;
}

function StructuredData({ config }: SiteConfigProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.siteSchema = 'true';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LegalService',
      name: 'Dias Kovaltchuk Advogadas Associadas',
      alternateName: 'Dias & Kovaltchuk Advogadas',
      description:
        'Advocacia com atendimento online em direito criminal, civil, família, saúde, consumidor, trabalhista e previdenciário.',
      url: 'https://diasekovaltchukadv.com/',
      image: 'https://diasekovaltchukadv.com/images/logo.png',
      logo: 'https://diasekovaltchukadv.com/images/logo.png',
      telephone: `+${config.whatsLinkNumber}`,
      email: config.contactEmail,
      priceRange: '$$',
      areaServed: [
        { '@type': 'Country', name: 'Brasil' },
        { '@type': 'State', name: 'Santa Catarina' }
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Florianópolis',
        addressRegion: 'SC',
        addressCountry: 'BR'
      },
      founder: [
        { '@type': 'Person', name: 'Larissa de Souza Dias', jobTitle: 'Advogada', identifier: 'OAB/SC 62.170' },
        { '@type': 'Person', name: 'Vitória Igarçaba Kovaltchuk', jobTitle: 'Advogada', identifier: 'OAB/SC 67.779' }
      ],
      sameAs: [config.socialFacebook, config.socialInstagram]
    });
    document.head.append(script);
    return () => script.remove();
  }, [config]);
  return null;
}

export function Site({ config }: SiteConfigProps) {
  return (
    <>
      <StructuredData config={config} />
      <Navigation whatsLinkNumber={config.whatsLinkNumber} />
      <main>
        <Hero whatsLinkNumber={config.whatsLinkNumber} />
        <About />
        <Practice />
        <Process />
        <Team />
        <ContactSection config={config} />
      </main>
      <WhatsAppLink number={config.whatsLinkNumber} className="floating-whatsapp wa-track" label="Falar no WhatsApp">
        <i className="bi bi-whatsapp" />
      </WhatsAppLink>
    </>
  );
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSiteConfig()
      .then(setConfig)
      .catch((reason: unknown) => setError((reason as Error).message));
  }, []);

  if (error)
    return (
      <main className="app-status" role="alert">
        {error}
      </main>
    );
  if (!config) return <main className="app-status">Carregando...</main>;
  return <Site config={config} />;
}
