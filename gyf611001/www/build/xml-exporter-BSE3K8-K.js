import { r as registerInstance, d as createEvent, h } from './index-CGJi_we2.js';
import { b as buildFIEXml } from './helpers-ksbpMhqy.js';

const xmlExporterCss = () => `:host{display:block}.xe-root{padding:16px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px}.xe-title{font-weight:600;font-size:14px;margin-bottom:12px;color:var(--text-primary);font-family:var(--font-mono)}.xe-row{display:flex;flex-wrap:wrap;gap:10px}.xe-endpoint{margin-top:10px;font-family:var(--font-mono);font-size:12px;color:var(--text-muted)}`;

const XmlExporter = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.exportComplete = createEvent(this, "exportComplete", 7);
        this.uploadFailed = createEvent(this, "uploadFailed", 7);
        this.boutState = null;
        this.associationEndpoint = '';
        this.autoUpload = false;
    }
    async buildXml() {
        return buildFIEXml(this.boutState);
    }
    async download() {
        var _a, _b;
        const xml = await this.buildXml();
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const id = ((_b = (_a = this.boutState) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.id) || 'bout';
        a.download = `fencing-bout-${id}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.exportComplete.emit({ xml, uploaded: false });
        return xml;
    }
    async uploadToAssociation() {
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
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            this.exportComplete.emit({ xml, uploaded: true });
            return true;
        }
        catch (e) {
            this.uploadFailed.emit({ error: e.message || '上传失败' });
            return false;
        }
    }
    async exportAndUpload() {
        const xml = await this.download();
        let uploaded = false;
        if (this.autoUpload) {
            uploaded = await this.uploadToAssociation();
        }
        return { xml, uploaded };
    }
    render() {
        return (h("div", { key: '90cb51ba0f5d10d3f5fb888c21783926a03d9e4b', class: "xe-root" }, h("div", { key: 'a4b6378072a98b328ab307255b4bc0769bf03da8', class: "xe-title" }, "FIE XML \u5BF9\u63A5"), h("div", { key: 'defe57efd5d58aeb62567098aaf8eb8399aa3028', class: "xe-row" }, h("button", { key: 'dbf7c39658336f898b14c8c770165a52dc18280c', class: "btn-flat btn-primary", onClick: () => this.download() }, "\u4E0B\u8F7D XML"), h("button", { key: '89bb82316769f4ac5bd15cdcfae36e58f205d72e', class: "btn-flat", onClick: () => this.uploadToAssociation() }, "\u4E0A\u4F20\u534F\u4F1A\u7CFB\u7EDF"), h("button", { key: 'dee0f452b16194bdf009be24178f7202f1bad728', class: "btn-flat", onClick: () => this.exportAndUpload() }, "\u4E00\u952E\u5BFC\u51FA + \u4E0A\u4F20")), this.associationEndpoint && (h("div", { key: '5395e25ef86fac9b3de6f8b94fde297563f248de', class: "xe-endpoint" }, "\u7AEF\u70B9\uFF1A", this.associationEndpoint))));
    }
};
XmlExporter.style = xmlExporterCss();

export { XmlExporter as X };
//# sourceMappingURL=xml-exporter-BSE3K8-K.js.map

//# sourceMappingURL=xml-exporter-BSE3K8-K.js.map