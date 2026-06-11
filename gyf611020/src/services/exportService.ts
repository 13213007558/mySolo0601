import JSZip from 'jszip';
import { storageService } from './storageService';
import { db } from '../db';
import { CaptureRecord, AnnotationLayer } from '../types';

const IIIF_CONTEXT = 'http://iiif.io/api/presentation/3/context.json';

export const exportService = {
  buildManifest(
    records: CaptureRecord[],
    annotationsMap: Record<string, AnnotationLayer>
  ): Record<string, unknown> {
    const id = `manuscript/${records[0]?.manuscriptId ?? 'unknown'}`;
    const canvases = records.map((r) => {
      const canvasId = `${id}/canvas/p${r.pageNum}_v${r.version}_a${Math.round(r.actualAngle)}`;
      const imageService = {
        id: canvasId,
        type: 'ImageService3',
        profile: 'level1',
      };
      const body = {
        id: `${canvasId}/image`,
        type: 'Image',
        format: 'image/jpeg',
        height: 3000,
        width: 2400,
        service: [imageService],
      };
      const annoPage = {
        id: `${canvasId}/annotations`,
        type: 'AnnotationPage',
        items: annotationsMap[r.id]
          ? [
              ...annotationsMap[r.id].arrows.map((a, i) => ({
                id: `${canvasId}/arrow/${i}`,
                type: 'Annotation',
                motivation: 'tagging',
                body: {
                  type: 'TextualBody',
                  value: `纤维走向 ${a.angle.toFixed(1)}°${a.snappedTo15 ? ' (吸附15°)' : ''}`,
                  format: 'text/plain',
                },
                target: `${canvasId}#xywh=percent:${Math.min(a.startX, a.endX) * 100},${Math.min(a.startY, a.endY) * 100},${Math.abs(a.endX - a.startX) * 100 + 2},${Math.abs(a.endY - a.startY) * 100 + 2}`,
              })),
              ...annotationsMap[r.id].polygons.map((p, i) => ({
                id: `${canvasId}/repair/${i}`,
                type: 'Annotation',
                motivation: 'commenting',
                body: {
                  type: 'TextualBody',
                  value: `[${p.repairType}] ${p.note || '无备注'}`,
                  format: 'text/plain',
                },
                target: canvasId,
              })),
            ]
          : [],
      };
      return {
        id: canvasId,
        type: 'Canvas',
        label: {
          none: [
            `第 ${r.pageNum} 页 · v${r.version} · ${r.actualAngle.toFixed(1)}°${r.needsRetake ? ' [待重拍]' : ''}`,
          ],
        },
        width: 2400,
        height: 3000,
        items: [
          {
            id: `${canvasId}/page`,
            type: 'AnnotationPage',
            items: [
              {
                id: `${canvasId}/anno/image`,
                type: 'Annotation',
                motivation: 'painting',
                body,
                target: canvasId,
              },
            ],
          },
        ],
        annotations: [annoPage],
        seeAlso: [
          {
            id: `${canvasId}/metadata.json`,
            type: 'Dataset',
            label: { none: ['角度元数据'] },
            format: 'application/json',
            profile: 'http://iiif.io/api/registry/metadata/',
          },
        ],
        metadata: [
          { label: { none: ['侧光角度'] }, value: { none: [`${r.actualAngle.toFixed(2)}°`] } },
          { label: { none: ['角度偏差'] }, value: { none: [`${r.angleDeviation.toFixed(2)}°${r.needsRetake ? ' (超标)' : ''}`] } },
          { label: { none: ['版本'] }, value: { none: [`v${r.version}`] } },
          { label: { none: ['采集时间'] }, value: { none: [new Date(r.capturedAt).toLocaleString('zh-CN')] } },
          { label: { none: ['采集人'] }, value: { none: [r.capturedBy] } },
          { label: { none: ['低蓝光模式'] }, value: { none: [r.lowBlueMode ? '开启' : '关闭'] } },
        ],
      };
    });

    return {
      '@context': IIIF_CONTEXT,
      id,
      type: 'Manifest',
      label: {
        none: [records.length > 0 ? `手稿采集记录 - ${records.length}幅` : '空手稿'],
      },
      metadata: [
        { label: { none: ['导出时间'] }, value: { none: [new Date().toLocaleString('zh-CN')] } },
        { label: { none: ['记录数'] }, value: { none: [`${records.length} 幅`] } },
      ],
      items: canvases,
    };
  },

  async exportBatch(
    captureIds: string[],
    onProgress?: (p: number) => void
  ): Promise<Blob> {
    const zip = new JSZip();
    const records: CaptureRecord[] = [];
    const annotationsMap: Record<string, AnnotationLayer> = {};
    const total = captureIds.length * 2 + 1;
    let step = 0;

    for (const id of captureIds) {
      const result = await storageService.getCapture(id);
      if (result) {
        records.push(result.record);
        const fileName = `images/p${result.record.pageNum}_v${result.record.version}_a${Math.round(result.record.actualAngle)}.jpg`;
        zip.file(fileName, result.blob);
        const annotation = await storageService.getAnnotations(id);
        if (annotation) {
          annotationsMap[id] = annotation;
          zip.file(
            `annotations/${id}.json`,
            JSON.stringify(annotation, null, 2)
          );
        }
        const meta = {
          id: result.record.id,
          manuscriptId: result.record.manuscriptId,
          pageNum: result.record.pageNum,
          targetAngle: result.record.targetAngle,
          actualAngle: result.record.actualAngle,
          angleDeviation: result.record.angleDeviation,
          needsRetake: result.record.needsRetake,
          lowBlueMode: result.record.lowBlueMode,
          capturedBy: result.record.capturedBy,
          capturedAt: result.record.capturedAt,
          version: result.record.version,
        };
        zip.file(`metadata/${id}.json`, JSON.stringify(meta, null, 2));
      }
      step++;
      onProgress?.(step / total);
    }

    for (const id of captureIds) {
      const m = await db.manuscripts.get(records.find((r) => r.id === id)?.manuscriptId ?? '');
      if (m) {
        zip.file(
          `manuscripts/${m.id}.json`,
          JSON.stringify(m, null, 2)
        );
      }
      step++;
      onProgress?.(step / total);
    }

    const manifest = this.buildManifest(records, annotationsMap);
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file(
      'README.txt',
      [
        '手稿侧光采集仪 IIIF 导出包',
        '===========================',
        '导出时间: ' + new Date().toLocaleString('zh-CN'),
        '记录数: ' + records.length,
        '',
        '目录结构:',
        '  manifest.json        - IIIF Presentation API 3.0 清单',
        '  images/              - 原始采集图像 (含 EXIF 角度元数据)',
        '  annotations/         - 标注层 JSON (纤维箭头 + 修补多边形)',
        '  metadata/            - 每条采集记录的结构化元数据',
        '  manuscripts/         - 手稿基本信息',
        '',
        '合规说明:',
        '  - 本包遵循 IIIF Presentation API 3.0 规范',
        '  - 侧光角度写入 EXIF UserComment 字段',
        '  - 标注层与原始图像完全分离存储',
      ].join('\n')
    );
    step++;
    onProgress?.(step / total);

    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  },
};
