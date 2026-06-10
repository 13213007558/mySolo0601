import type { Photo, FilterState } from '$lib/types';
import { escapeMarkdown } from './validator';
import { formatDateChinese } from './date';

export function generateHandoverSummary(photos: Photo[], filters: FilterState): string {
	if (photos.length === 0) {
		return '# 交接摘要\n\n当前筛选条件下没有照片记录。';
	}

	const sortedPhotos = [...photos].sort((a, b) => {
		if (a.date !== b.date) return a.date.localeCompare(b.date);
		if (a.floor !== b.floor) return a.floor.localeCompare(b.floor);
		return a.process.localeCompare(b.process);
	});

	const grouped: Record<string, Record<string, Record<string, Photo[]>>> = {};

	for (const photo of sortedPhotos) {
		if (!grouped[photo.date]) grouped[photo.date] = {};
		if (!grouped[photo.date][photo.floor]) grouped[photo.date][photo.floor] = {};
		if (!grouped[photo.date][photo.floor][photo.process]) {
			grouped[photo.date][photo.floor][photo.process] = [];
		}
		grouped[photo.date][photo.floor][photo.process].push(photo);
	}

	let md = '# 施工照片交接摘要\n\n';
	md += `生成时间：${formatDateChinese(new Date())}\n\n`;

	if (filters.dateRange) {
		md += `日期范围：${formatDateChinese(filters.dateRange[0])} 至 ${formatDateChinese(filters.dateRange[1])}\n\n`;
	}
	if (filters.selectedDate) {
		md += `指定日期：${formatDateChinese(filters.selectedDate)}\n\n`;
	}
	if (filters.floors.length > 0) {
		md += `筛选楼层：${filters.floors.join('、')}\n\n`;
	}
	if (filters.processes.length > 0) {
		md += `筛选工序：${filters.processes.join('、')}\n\n`;
	}
	if (filters.keyword) {
		md += `关键词：${filters.keyword}\n\n`;
	}

	md += `---\n\n`;
	md += `## 统计信息\n\n`;
	md += `- 照片总数：${photos.length} 张\n`;
	md += `- 已完成：${photos.filter((p) => p.isCompleted).length} 张\n`;
	md += `- 待确认：${photos.filter((p) => !p.isCompleted).length} 张\n\n`;
	md += `---\n\n`;

	for (const date of Object.keys(grouped).sort()) {
		md += `## ${formatDateChinese(date)}\n\n`;

		for (const floor of Object.keys(grouped[date]).sort()) {
			md += `### ${floor}\n\n`;

			for (const process of Object.keys(grouped[date][floor]).sort()) {
				const processPhotos = grouped[date][floor][process];
				const completedCount = processPhotos.filter((p) => p.isCompleted).length;

				md += `#### ${process}（${processPhotos.length}张，已完成${completedCount}张）\n\n`;

				for (let i = 0; i < processPhotos.length; i++) {
					const photo = processPhotos[i];
					const status = photo.isCompleted ? '✅ 已完成' : '⏳ 待确认';
					const remark = photo.remark ? ` - ${escapeMarkdown(photo.remark)}` : '';

					md += `${i + 1}. ${status} - ${escapeMarkdown(photo.name)}${remark}\n`;
				}

				md += '\n';
			}
		}
	}

	md += `---\n\n`;
	md += `> 本摘要由施工日志照片归档台自动生成\n`;

	return md;
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (e) {
		console.error('复制失败:', e);
		return false;
	}
}

export function downloadMarkdown(md: string, filename = '交接摘要.md'): void {
	const now = new Date();
	const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
	const finalName = filename.replace('.md', `_${timestamp}.md`);

	const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = finalName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
