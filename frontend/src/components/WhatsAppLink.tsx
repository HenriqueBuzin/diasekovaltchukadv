import type { MouseEvent, PropsWithChildren } from 'react';

import { openWhatsApp } from '../analytics';

interface WhatsAppLinkProps {
  number: string;
  className?: string;
  label?: string;
}

export function WhatsAppLink({ number, className, children, label }: PropsWithChildren<WhatsAppLinkProps>) {
  const href = `https://wa.me/${number}`;
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openWhatsApp(href);
  };

  return (
    <a className={className} href={href} aria-label={label} onClick={handleClick}>
      {children}
    </a>
  );
}
