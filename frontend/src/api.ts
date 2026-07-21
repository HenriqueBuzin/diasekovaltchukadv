import { message } from './messages';
import type { ContactPayload, ContactResponse, SiteConfig } from './types';

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message || message('apiFallback'));
  return data;
}

export async function loadSiteConfig(): Promise<SiteConfig> {
  return readJson<SiteConfig>(await fetch('/api/site-config'));
}

export async function sendContact(payload: Partial<ContactPayload>): Promise<ContactResponse> {
  return readJson<ContactResponse>(
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  );
}
