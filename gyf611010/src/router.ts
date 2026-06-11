export interface NavigateEventDetail {
  view: string;
  cheeseId?: string;
}

export function createNavigateEvent(
  view: string,
  cheeseId?: string
): CustomEvent<NavigateEventDetail> {
  return new CustomEvent<NavigateEventDetail>('navigate', {
    detail: { view, cheeseId },
    bubbles: true,
    composed: true,
  });
}

export function parseHashRoute(): { view: string; cheeseId?: string } {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) {
    return { view: 'dashboard' };
  }

  const parts = hash.split('/');
  const view = parts[0] || 'dashboard';
  const cheeseId = parts[1] || undefined;

  return { view, cheeseId };
}

export function updateHash(view: string, cheeseId?: string): void {
  let hash = `#/${view}`;
  if (cheeseId) {
    hash += `/${cheeseId}`;
  }
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}
