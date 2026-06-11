import { Component, Prop, State, h, Method, Event, EventEmitter, Watch } from '@stencil/core';
import { buildFIEXml } from '../../utils/helpers';

const ENDPOINT_CACHE_KEY = 'fencing_assoc_endpoint_v1';

@Component({
  tag: 'xml-exporter',
  styleUrl: 'xml-exporter.css',
  shadow: true,
})
export class XmlExporter {
  @Prop() boutState: any = null;
  @Prop() associationEndpoint: string = '';
  @Prop() autoUpload: boolean = false;
  @Event() exportComplete: EventEmitter<{ xml: string; uploaded: boolean }>;
  @Event() uploadFailed: EventEmitter<{ error: string }>;

  @State() isUploading: boolean = false;
  @State() lastUploadOk: boolean | null = null;
  @State() lastError: string = '';
  @State() localEndpoint: string = '';
  @State() showConfig: boolean = false;

  componentWillLoad() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(ENDPOINT_CACHE_KEY);
      if (saved) {
        this.localEndpoint = saved;
        if (!this.associationEndpoint) {
          this.associationEndpoint = saved;
        }
      }
    }
    if (this.associationEndpoint) {
      this.localEndpoint = this.associationEndpoint;
    }
  }

  @Watch('associationEndpoint')
  onEndpointPropChange(val: string) {
    if (val && val !== this.localEndpoint) {
      this.localEndpoint = val;
    }
  }

  private get effectiveEndpoint(): string {
    return this.associationEndpoint || this.localEndpoint || '';
  }

  private saveEndpoint() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ENDPOINT_CACHE_KEY, this.localEndpoint);
    }
    this.associationEndpoint = this.localEndpoint;
    this.showConfig = false;
  }

  @Method()
  async buildXml(): Promise<string> {
    return buildFIEXml(this.boutState);
  }

  @Method()
  async download() {
    const xml = await this.buildXml();
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const id = this.boutState?.config?.id || 'bout';
    a.download = `fencing-bout-${id}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.exportComplete.emit({ xml, uploaded: false });
    return xml;
  }

  @Method()
  async uploadToAssociation(): Promise<boolean> {
    const xml = await this.buildXml();
    const endpoint = this.effectiveEndpoint;
    if (!endpoint) {
      this.lastError = '未配置协会系统上传地址';
      this.lastUploadOk = false;
      this.uploadFailed.emit({ error: this.lastError });
      return false;
    }
    this.isUploading = true;
    this.lastError = '';
    this.lastUploadOk = null;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml;charset=utf-8' },
        body: xml,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.lastUploadOk = true;
      this.exportComplete.emit({ xml, uploaded: true });
      return true;
    } catch (e: any) {
      this.lastError = e.message || '上传失败';
      this.lastUploadOk = false;
      this.uploadFailed.emit({ error: this.lastError });
      return false;
    } finally {
      this.isUploading = false;
    }
  }

  @Method()
  async exportAndUpload(): Promise<{ xml: string; uploaded: boolean }> {
    const xml = await this.download();
    let uploaded = false;
    try {
      uploaded = await this.uploadToAssociation();
    } catch {
      uploaded = false;
    }
    return { xml, uploaded };
  }

  @Method()
  async getEffectiveEndpoint(): Promise<string> {
    return this.effectiveEndpoint;
  }

  render() {
    const endpoint = this.effectiveEndpoint;
    return (
      <div class="xe-root">
        <div class="xe-head">
          <div class="xe-title">FIE XML 对接</div>
          <button class="xe-config-btn" onClick={() => { this.showConfig = !this.showConfig; }}>
            {this.showConfig ? '收起' : '配置'}
          </button>
        </div>

        {this.showConfig && (
          <div class="xe-config">
            <label>
              协会系统上传地址
              <input
                type="text"
                value={this.localEndpoint}
                onInput={(e: any) => { this.localEndpoint = e.target.value; }}
                placeholder="https://association.example/api/fie-bout"
              />
            </label>
            <button class="btn-flat btn-primary xe-save" onClick={() => this.saveEndpoint()}>保存</button>
            <p class="xe-hint">地址会保存在本地浏览器。留空时仅下载，不上传。</p>
          </div>
        )}

        <div class="xe-row">
          <button class="btn-flat btn-primary" onClick={() => this.download()}>下载 XML</button>
          <button
            class="btn-flat"
            onClick={() => this.uploadToAssociation()}
            disabled={this.isUploading || !endpoint}
          >
            {this.isUploading ? '上传中...' : '上传协会系统'}
          </button>
          <button
            class="btn-flat"
            onClick={() => this.exportAndUpload()}
            disabled={this.isUploading}
          >
            一键导出 + 上传
          </button>
        </div>

        {endpoint && (
          <div class="xe-endpoint">
            <span class="xe-ep-label">端点：</span>
            <span class="xe-ep-value">{endpoint}</span>
          </div>
        )}

        {this.lastUploadOk === true && (
          <div class="xe-status xe-status-ok">✓ 上次上传成功</div>
        )}
        {this.lastUploadOk === false && this.lastError && (
          <div class="xe-status xe-status-err">✕ 上传失败：{this.lastError}</div>
        )}
      </div>
    );
  }
}
