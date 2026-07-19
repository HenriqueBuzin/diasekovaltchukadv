import { type MouseEvent, useState } from 'react';

import { WhatsAppLink } from './WhatsAppLink';

const links = [
  ['#about', 'Escritório'],
  ['#acting', 'Atuação'],
  ['#team', 'Advogadas'],
  ['#contact', 'Contato']
] as const;

interface NavigationProps {
  whatsLinkNumber: string;
}

export function Navigation({ whatsLinkNumber }: NavigationProps) {
  const [open, setOpen] = useState(false);

  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector<HTMLElement>(event.currentTarget.hash);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top topbar" id="home" aria-label="Navegação principal">
      <div className="container-fluid nav-shell">
        <a className="navbar-brand" href="#home" aria-label="Dias e Kovaltchuk Advogadas" onClick={navigate}>
          <img
            src="/images/logo.png"
            alt="Dias & Kovaltchuk Advogadas Associadas"
            width="580"
            height="565"
            decoding="async"
          />
          <span>Dias & Kovaltchuk</span>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarSupportedContent"
          aria-expanded={open}
          aria-label="Abrir menu"
          onClick={() => setOpen((visible) => !visible)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse${open ? ' show' : ''}`} id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            {links.map(([href, label]) => (
              <li className="nav-item" key={href}>
                <a className="nav-link" href={href} onClick={navigate}>
                  {label}
                </a>
              </li>
            ))}
            <li className="nav-item">
              <WhatsAppLink number={whatsLinkNumber} className="nav-button wa-track">
                <i className="bi bi-whatsapp" />
                Falar com o escritório
              </WhatsAppLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
