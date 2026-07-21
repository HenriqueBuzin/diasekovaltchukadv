export function openWhatsApp(url: string): void {
  let opened = false;
  const openOnce = () => {
    if (opened) return;
    opened = true;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: 'AW-17913181584/LZUECPCB-pocEJDr1d1C',
      value: 1.0,
      currency: 'BRL',
      event_callback: openOnce
    });
  } else {
    openOnce();
  }
  window.setTimeout(openOnce, 800);
}

export function fireContactConversion(): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', {
    send_to: 'AW-17913181584/aE3cCKLPmY4cEJDr1d1C',
    value: 2.0,
    currency: 'BRL'
  });
}
