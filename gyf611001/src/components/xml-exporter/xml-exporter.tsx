import { Component, Prop, h, Method, Event, EventEmitter } from '@stencil/core';
import { buildFIEXml } from '../../utils/helpers';

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
    if (!this.associationEndpoint) {
      this.uploadFailed.emit({ error: '未配置协会系统上传地址' });
      return false;
    }
    try {
      const res = await fetch(this.associationEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml;charset=utf-8' },
        body: xml,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.exportComplete.emit({ xml, uploaded: true });
      return true;
    } catch (e: any) {
      this.uploadFailed.emit({ error: e.message || '上传失败' });
      return false;
    }
  }

  @Method()
  async exportAndUpload(): Promise<{ xml: string; uploaded: boolean }> {
    const xml = await this.download();
    let uploaded = false;
    if (this.autoUpload) {
      uploaded = await this.uploadToAssociation();
    }
    return { xml, uploaded };
  }

  render() {
    return (
      <div class="xe-root">
        <div class="xe-title">FIE XML 对接</div>
        <div class="xe-row">
          <button class="btn-flat btn-primary" onClick={() => this.download()}>下载 XML</button>
          <button class="btn-flat" onClick={() => this.uploadToAssociation()}>上传协会系统</button>
          <button class="btn-flat" onClick={() => this.exportAndUpload()}>一键导出 + 上传</button>
        </div>
        {this.associationEndpoint && (
          <div class="xe-endpoint">端点：{this.associationEndpoint}</div>
        )}
      </div>
    );
  }
}
