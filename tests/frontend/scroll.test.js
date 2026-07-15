import { afterEach, describe, expect, it, vi } from 'vitest';

async function initialize(markup) {
  document.body.innerHTML = markup;
  if (!window.DKNavigation) await import('../../src/static/js/scroll.js');
  window.DKNavigation.initNavigation();
}

afterEach(() => {
  delete window.bootstrap;
  document.body.innerHTML = '';
});

describe('smooth navigation', () => {
  it('ignores links whose target does not exist', async () => {
    await initialize('<div class="nav-item"><a href="#missing">Missing</a></div>');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.querySelector('a').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('scrolls to an existing target without a menu', async () => {
    await initialize('<div class="nav-item"><a href="#target">Target</a></div><section id="target"></section>');
    const scrollIntoView = vi.fn();
    document.querySelector('#target').scrollIntoView = scrollIntoView;
    document.querySelector('a').click();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('does not collapse a menu that is already closed', async () => {
    const hide = vi.fn();
    window.bootstrap = { Collapse: { getOrCreateInstance: vi.fn(() => ({ hide })) } };
    await initialize(`
      <div class="nav-item"><a href="#target">Target</a></div>
      <div id="navbarSupportedContent"></div><section id="target"></section>`);
    document.querySelector('#target').scrollIntoView = vi.fn();
    document.querySelector('a').click();
    expect(hide).not.toHaveBeenCalled();
  });

  it('keeps an open menu when Bootstrap is unavailable', async () => {
    await initialize(`
      <div class="nav-item"><a href="#target">Target</a></div>
      <div id="navbarSupportedContent" class="show"></div><section id="target"></section>`);
    document.querySelector('#target').scrollIntoView = vi.fn();
    expect(() => document.querySelector('a').click()).not.toThrow();
  });

  it('closes an open Bootstrap menu', async () => {
    const hide = vi.fn();
    const getOrCreateInstance = vi.fn(() => ({ hide }));
    window.bootstrap = { Collapse: { getOrCreateInstance } };
    await initialize(`
      <div class="nav-item"><a href="#target">Target</a></div>
      <div id="navbarSupportedContent" class="show"></div><section id="target"></section>`);
    document.querySelector('#target').scrollIntoView = vi.fn();
    document.querySelector('a').click();
    expect(getOrCreateInstance).toHaveBeenCalledWith(document.querySelector('#navbarSupportedContent'));
    expect(hide).toHaveBeenCalledOnce();
  });
});
