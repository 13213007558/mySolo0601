import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { CheeseWheel, CellarPosition, YeastBatch } from '../types/index';
import { consume as consumeCtx } from '@lit-labs/context';
import { cheeseContext, type CheeseContextType } from '../context/cheese-context';
import { authContext, type AuthContextType } from '../context/auth-context';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '../components/cheese/cheese-wheel-card.js';
import '../components/cheese/cheese-info-panel.js';
import { cellarPositions, yeastBatches } from '../utils/mock-data';

@customElement('cheese-management-page')
export class CheeseManagementPage extends LitElement {
  @consumeCtx({ context: cheeseContext })
  cheeseCtx!: CheeseContextType;

  @consumeCtx({ context: authContext })
  authCtx!: AuthContextType;

  @state()
  private searchQuery = '';

  @state()
  private filterStatus = '';

  @state()
  private filterCellarPosition = '';

  @state()
  private filterYeastBatch = '';

  @state()
  private drawerOpen = false;

  @state()
  private selectedWheel: CheeseWheel | null = null;

  @state()
  private selectedIds: Set<string> = new Set();

  static override styles = css`
    :host {
      display: block;
      padding: 24px;
      font-family: var(--sans, system-ui, sans-serif);
      color: var(--text, #4A3728);
      background: #FFF8F0;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: #4A3728;
      margin: 0 0 8px 0;
      font-family: var(--heading, system-ui);
    }

    .page-subtitle {
      font-size: 14px;
      color: #8B7355;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filter-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 24px;
      padding: 16px 20px;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #E8D5C4;
      box-shadow: 0 2px 8px rgba(74, 55, 40, 0.06);
    }

    .filter-bar sl-input,
    .filter-bar sl-select {
      flex: 1;
      min-width: 180px;
    }

    sl-input::part(base),
    sl-select::part(base) {
      border-radius: 8px;
    }

    sl-button::part(base) {
      border-radius: 8px;
      font-weight: 500;
    }

    sl-button[variant="primary"]::part(base) {
      background: linear-gradient(135deg, #D4A574 0%, #8B5A2B 100%);
      border-color: #8B5A2B;
    }

    sl-button[variant="primary"]::part(base):hover {
      background: linear-gradient(135deg, #C49464 0%, #7B4A1B 100%);
    }

    .batch-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #FDF8F3 0%, #F5E6D3 100%);
      border-radius: 10px;
      border: 1px solid #E8D5BC;
    }

    .batch-info {
      font-size: 14px;
      color: #4A3728;
      font-weight: 500;
    }

    .batch-actions {
      display: flex;
      gap: 8px;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .card-wrapper {
      position: relative;
    }

    .card-checkbox {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10;
    }

    .empty-state {
      grid-column: 1 / -1;
      padding: 80px 40px;
      text-align: center;
      background: #fff;
      border-radius: 12px;
      border: 2px dashed #E8D5C4;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      opacity: 0.4;
      color: #D4A574;
    }

    .empty-text {
      font-size: 16px;
      color: #8B7355;
    }

    sl-drawer::part(panel) {
      background: #FFF8F0;
    }

    sl-drawer::part(header) {
      background: linear-gradient(135deg, #F5DEB3 0%, #D4A574 50%, #8B5A2B 100%);
      color: #4A3728;
      font-size: 18px;
      font-weight: 600;
    }

    sl-drawer::part(body) {
      padding: 0;
    }
  `;

  private get mappedCellarPositions(): CellarPosition[] {
    return cellarPositions.map(p => ({
      id: p.id,
      positionCode: p.code,
      zone: p.row,
      shelf: String(p.shelf),
      ambientTemp: 12,
    }));
  }

  private get mappedYeastBatches(): YeastBatch[] {
    return yeastBatches.map(b => ({
      id: b.id,
      batchNumber: b.batchNumber,
      strain: b.strain,
      productionDate: b.productionDate,
      supplier: '',
    }));
  }

  private get filteredWheels(): CheeseWheel[] {
    return this.cheeseCtx.cheeseWheels.filter(wheel => {
      const matchesSearch = this.searchQuery === '' ||
        wheel.wheelNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        wheel.cellarPositionId.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = this.filterStatus === '' || wheel.status === this.filterStatus;
      const matchesCellar = this.filterCellarPosition === '' || wheel.cellarPositionId === this.filterCellarPosition;
      const matchesYeast = this.filterYeastBatch === '' || wheel.yeastBatchId === this.filterYeastBatch;
      return matchesSearch && matchesStatus && matchesCellar && matchesYeast;
    });
  }

  private handleWheelSelected(event: CustomEvent) {
    const { wheel } = event.detail;
    this.selectedWheel = wheel;
    this.cheeseCtx.selectCheeseWheel(wheel.id);
    this.drawerOpen = true;
  }

  private handleSelectionToggle(wheelId: string, checked: boolean) {
    const newSelected = new Set(this.selectedIds);
    if (checked) {
      newSelected.add(wheelId);
    } else {
      newSelected.delete(wheelId);
    }
    this.selectedIds = newSelected;
  }

  private handleSelectAll() {
    if (this.selectedIds.size === this.filteredWheels.length) {
      this.selectedIds = new Set();
    } else {
      this.selectedIds = new Set(this.filteredWheels.map(w => w.id));
    }
  }

  private handleBatchExport() {
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { page: 'report-export', wheelIds: Array.from(this.selectedIds) },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleAddWheel() {
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { page: 'probe-guide' },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleCellarPositionChanged(event: CustomEvent) {
    if (this.selectedWheel) {
      this.cheeseCtx.bindCheeseWheel(
        this.selectedWheel.id,
        event.detail.positionId,
        this.selectedWheel.yeastBatchId
      );
    }
  }

  private handleYeastBatchChanged(event: CustomEvent) {
    if (this.selectedWheel) {
      this.cheeseCtx.bindCheeseWheel(
        this.selectedWheel.id,
        this.selectedWheel.cellarPositionId,
        event.detail.batchId
      );
    }
  }

  private handleStartMeasurement(event: CustomEvent) {
    this.drawerOpen = false;
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { page: 'temperature-monitor', wheel: event.detail.wheel },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleExportReport(event: CustomEvent) {
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { page: 'report-export', wheelIds: [event.detail.wheel.id] },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const filtered = this.filteredWheels;
    const allSelected = filtered.length > 0 && this.selectedIds.size === filtered.length;

    return html`
      <div class="page-header">
        <div>
          <h1 class="page-title">奶酪轮管理</h1>
          <p class="page-subtitle">管理所有奶酪轮的熟成状态、窖位和酵母批次信息</p>
        </div>
        <div class="header-actions">
          <sl-button variant="primary" @click=${this.handleAddWheel}>
            <svg slot="prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            新增奶酪轮
          </sl-button>
        </div>
      </div>

      <div class="filter-bar">
        <sl-input
          placeholder="搜索奶酪轮编号或窖位..."
          value=${this.searchQuery}
          @sl-input=${(e: CustomEvent) => this.searchQuery = (e.target as HTMLInputElement).value}
          clearable
        >
          <svg slot="prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </sl-input>

        <sl-select
          placeholder="按状态筛选"
          value=${this.filterStatus}
          @sl-change=${(e: Event) => this.filterStatus = (e.target as HTMLSelectElement).value}
          clearable
        >
          <sl-option value="maturing">成熟中</sl-option>
          <sl-option value="ready">已就绪</sl-option>
          <sl-option value="shipped">已发货</sl-option>
          <sl-option value="interrupted">已中断</sl-option>
        </sl-select>

        <sl-select
          placeholder="按窖位筛选"
          value=${this.filterCellarPosition}
          @sl-change=${(e: Event) => this.filterCellarPosition = (e.target as HTMLSelectElement).value}
          clearable
        >
          ${this.mappedCellarPositions.map(p => html`
            <sl-option value=${p.id}>${p.positionCode} - ${p.zone}区${p.shelf}层</sl-option>
          `)}
        </sl-select>

        <sl-select
          placeholder="按酵母批次筛选"
          value=${this.filterYeastBatch}
          @sl-change=${(e: Event) => this.filterYeastBatch = (e.target as HTMLSelectElement).value}
          clearable
        >
          ${this.mappedYeastBatches.map(b => html`
            <sl-option value=${b.id}>${b.batchNumber}</sl-option>
          `)}
        </sl-select>
      </div>

      ${this.selectedIds.size > 0 ? html`
        <div class="batch-bar">
          <span class="batch-info">已选择 ${this.selectedIds.size} 个奶酪轮</span>
          <div class="batch-actions">
            <sl-button size="small" variant="default" @click=${this.handleSelectAll}>
              ${allSelected ? '取消全选' : '全选'}
            </sl-button>
            <sl-button size="small" variant="primary" @click=${this.handleBatchExport}>
              <svg slot="prefix" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              批量导出报告
            </sl-button>
          </div>
        </div>
      ` : ''}

      <div class="card-grid">
        ${filtered.length === 0
          ? html`
            <div class="empty-state">
              <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p class="empty-text">没有找到匹配的奶酪轮</p>
            </div>
          `
          : filtered.map(wheel => html`
            <div class="card-wrapper">
              <sl-checkbox
                class="card-checkbox"
                ?checked=${this.selectedIds.has(wheel.id)}
                @sl-change=${(e: CustomEvent) => this.handleSelectionToggle(wheel.id, (e.target as HTMLInputElement).checked)}
              ></sl-checkbox>
              <cheese-wheel-card
                .wheel=${wheel}
                ?is-selected=${this.selectedWheel?.id === wheel.id}
                @wheel-selected=${this.handleWheelSelected}
              ></cheese-wheel-card>
            </div>
          `)
        }
      </div>

      <sl-drawer
        label="奶酪轮详情"
        ?open=${this.drawerOpen}
        @sl-after-hide=${() => this.drawerOpen = false}
        placement="end"
      >
        <cheese-info-panel
          .wheel=${this.selectedWheel}
          .cellarPositions=${this.mappedCellarPositions}
          .yeastBatches=${this.mappedYeastBatches}
          @cellar-position-changed=${this.handleCellarPositionChanged}
          @yeast-batch-changed=${this.handleYeastBatchChanged}
          @start-measurement=${this.handleStartMeasurement}
          @export-report=${this.handleExportReport}
        ></cheese-info-panel>
      </sl-drawer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cheese-management-page': CheeseManagementPage;
  }
}
