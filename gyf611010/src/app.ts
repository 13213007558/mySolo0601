import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ContextProvider } from '@lit-labs/context';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import '@shoelace-style/shoelace/dist/themes/light.css';
import {
  cheeseContext,
  cheeseContextDefaultValue,
  type CheeseContextType,
} from './context/cheese-context.js';
import {
  temperatureContext,
  temperatureContextDefaultValue,
} from './context/temperature-context.js';
import {
  authContext,
  authContextDefaultValue,
} from './context/auth-context.js';
import { parseHashRoute, updateHash, type NavigateEventDetail } from './router.js';
import { themeStyles } from './theme.js';
import type { CheeseWheel } from './types/index.js';

setBasePath('/node_modules/@shoelace-style/shoelace/dist');

import './pages/dashboard-page.js';
import './pages/probe-guide-page.js';
import './pages/temperature-monitor-page.js';
import './pages/cheese-management-page.js';
import './pages/comparison-page.js';
import './pages/report-export-page.js';
import './pages/security-page.js';

import './components/cheese/cheese-wheel-card.js';
import './components/cheese/cheese-info-panel.js';
import './components/common/status-badge.js';
import './components/common/countdown-timer.js';
import './components/common/data-interruption-marker.js';
import './components/comparison/multi-line-chart.js';
import './components/comparison/similarity-score.js';
import './components/probe-guide/cheese-wheel-cross-section.js';
import './components/probe-guide/depth-indicator.js';
import './components/probe-guide/probe-guide-step.js';
import './components/temperature/realtime-chart.js';
import './components/temperature/target-range-band.js';
import './components/temperature/temperature-gauge.js';

type ViewType =
  | 'dashboard'
  | 'probe-guide'
  | 'temperature-monitor'
  | 'cheese-management'
  | 'comparison'
  | 'report-export'
  | 'security';

@customElement('cheese-app')
export class CheeseApp extends LitElement {
  @property({ type: String })
  selectedCheeseId: string | null = null;

  @state()
  private currentView: ViewType = 'dashboard';

  private cheeseProvider!: ContextProvider<typeof cheeseContext>;

  static override styles = css`
    ${unsafeCSS(themeStyles)}

    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg);
      font-family: var(--font-body);
      color: var(--text);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();

    this.cheeseProvider = new ContextProvider(this, {
      context: cheeseContext,
      initialValue: this.createCheeseContextValue(),
    });

    new ContextProvider(this, {
      context: temperatureContext,
      initialValue: temperatureContextDefaultValue,
    });

    new ContextProvider(this, {
      context: authContext,
      initialValue: authContextDefaultValue,
    });

    const route = parseHashRoute();
    this.currentView = this.normalizeView(route.view);
    if (route.cheeseId) {
      this.selectedCheeseId = route.cheeseId;
      this.cheeseProvider.setValue(
        this.createCheeseContextValue(route.cheeseId)
      );
    }

    window.addEventListener('hashchange', this.handleHashChange);
    this.addEventListener('navigate', this.handleNavigate as EventListener);
    this.addEventListener(
      'select-cheese',
      this.handleSelectCheese as EventListener
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this.handleHashChange);
    this.removeEventListener('navigate', this.handleNavigate as EventListener);
    this.removeEventListener(
      'select-cheese',
      this.handleSelectCheese as EventListener
    );
  }

  private createCheeseContextValue(
    selectedId?: string
  ): CheeseContextType {
    const selected = selectedId
      ? cheeseContextDefaultValue.cheeseWheels.find(
          (w: CheeseWheel) => w.id === selectedId
        ) || null
      : null;

    return {
      ...cheeseContextDefaultValue,
      selectedCheeseWheel: selected,
      selectCheeseWheel: (wheelId: string | null) => {
        const wheel = wheelId
          ? cheeseContextDefaultValue.cheeseWheels.find(
              (w: CheeseWheel) => w.id === wheelId
            ) || null
          : null;
        this.cheeseProvider.setValue({
          ...this.cheeseProvider.value!,
          selectedCheeseWheel: wheel,
        });
        if (wheelId) {
          this.selectedCheeseId = wheelId;
        }
      },
      updateTemperature: (
        wheelId: string,
        temperature: number,
        probeDepth: number
      ) => {
        const wheels = this.cheeseProvider.value!.cheeseWheels.map(
          (w: CheeseWheel) => {
            if (w.id === wheelId) {
              const newPoint = {
                timestamp: new Date(),
                temperature,
                probeDepth,
                status: 'valid' as const,
              };
              return {
                ...w,
                temperatureHistory: [...w.temperatureHistory, newPoint],
              };
            }
            return w;
          }
        );
        this.cheeseProvider.setValue({
          ...this.cheeseProvider.value!,
          cheeseWheels: wheels,
        });
      },
      bindCheeseWheel: (
        wheelId: string,
        cellarPositionId: string,
        yeastBatchId: string
      ) => {
        const wheels = this.cheeseProvider.value!.cheeseWheels.map(
          (w: CheeseWheel) => {
            if (w.id === wheelId) {
              return {
                ...w,
                cellarPositionId,
                yeastBatchId,
              };
            }
            return w;
          }
        );
        this.cheeseProvider.setValue({
          ...this.cheeseProvider.value!,
          cheeseWheels: wheels,
        });
      },
    };
  }

  private normalizeView(view: string): ViewType {
    const validViews: ViewType[] = [
      'dashboard',
      'probe-guide',
      'temperature-monitor',
      'cheese-management',
      'comparison',
      'report-export',
      'security',
    ];
    if (validViews.includes(view as ViewType)) {
      return view as ViewType;
    }
    const viewMap: Record<string, ViewType> = {
      report: 'report-export',
      settings: 'security',
    };
    return viewMap[view] || 'dashboard';
  }

  private handleHashChange = (): void => {
    const route = parseHashRoute();
    this.currentView = this.normalizeView(route.view);
    if (route.cheeseId) {
      this.selectedCheeseId = route.cheeseId;
      this.cheeseProvider.setValue(
        this.createCheeseContextValue(route.cheeseId)
      );
    }
  };

  private handleNavigate = (e: CustomEvent<NavigateEventDetail>): void => {
    e.stopPropagation();
    const view = this.normalizeView(e.detail.view);
    const cheeseId = e.detail.cheeseId;
    this.currentView = view;
    if (cheeseId) {
      this.selectedCheeseId = cheeseId;
      this.cheeseProvider.setValue(this.createCheeseContextValue(cheeseId));
    }
    updateHash(view, cheeseId);
  };

  private handleSelectCheese = (
    e: CustomEvent<{ cheeseId: string; wheel?: CheeseWheel }>
  ): void => {
    e.stopPropagation();
    const cheeseId = e.detail.cheeseId;
    this.selectedCheeseId = cheeseId;
    this.cheeseProvider.setValue(this.createCheeseContextValue(cheeseId));
  };

  private renderView() {
    switch (this.currentView) {
      case 'dashboard':
        return html`<dashboard-page></dashboard-page>`;
      case 'probe-guide':
        return html`<probe-guide-page></probe-guide-page>`;
      case 'temperature-monitor':
        return html`<temperature-monitor-page></temperature-monitor-page>`;
      case 'cheese-management':
        return html`<cheese-management-page></cheese-management-page>`;
      case 'comparison':
        return html`<comparison-page></comparison-page>`;
      case 'report-export':
        return html`<report-export-page></report-export-page>`;
      case 'security':
        return html`<security-page></security-page>`;
      default:
        return html`<dashboard-page></dashboard-page>`;
    }
  }

  override render() {
    return html` ${this.renderView()} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cheese-app': CheeseApp;
  }
}
