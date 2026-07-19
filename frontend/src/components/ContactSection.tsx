import { formatPhoneDisplay } from '../phone';
import type { SiteConfig } from '../types';
import { ContactForm } from './ContactForm';
import { WhatsAppLink } from './WhatsAppLink';

interface ContactSectionProps {
  config: SiteConfig;
}

export function ContactSection({ config }: ContactSectionProps) {
  return (
    <section className="contact-section" id="contact">
      <div className="container contact-layout">
        <div className="contact-panel">
          <span className="kicker">Contato</span>
          <h2>Pronta para entender seu caso?</h2>
          <p>
            Fale com a Dias & Kovaltchuk e receba uma orientação inicial sobre riscos, urgências e caminhos possíveis.
          </p>
          <div className="contact-methods">
            <a href={`mailto:${config.contactEmail}`}>
              <i className="bi bi-envelope" /> {config.contactEmail}
            </a>
            <WhatsAppLink number={config.whatsLinkNumber} className="wa-track">
              <i className="bi bi-whatsapp" /> <span className="phone">{formatPhoneDisplay(config.whatsNumber)}</span>
            </WhatsAppLink>
          </div>
          <div className="social-row">
            <a href={config.socialFacebook} target="_blank" rel="noopener" aria-label="Facebook">
              <i className="bi bi-facebook" />
            </a>
            <a href={config.socialInstagram} target="_blank" rel="noopener" aria-label="Instagram">
              <i className="bi bi-instagram" />
            </a>
            <WhatsAppLink number={config.whatsLinkNumber} className="wa-track" label="WhatsApp">
              <i className="bi bi-whatsapp" />
            </WhatsAppLink>
          </div>
        </div>
        <ContactForm config={config} />
      </div>
    </section>
  );
}
