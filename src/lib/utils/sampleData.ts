import type { Photo, ConstructionLog } from '$lib/types';
import { generateId } from './hash';

function createSampleSvg(width: number, height: number, bgColor: string, text: string): string {
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
			<rect width="${width}" height="${height}" fill="${bgColor}"/>
			<rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="10,5"/>
			<text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${text}</text>
			<text x="50%" y="65%" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">样例照片</text>
		</svg>
	`;
	return 'data:image/svg+xml;base64,' + btoa(svg);
}

export function generateSamplePhotos(): Photo[] {
	const svg1 = createSampleSvg(400, 300, '#F59E0B', '18层 砌筑');
	const svg2 = createSampleSvg(400, 300, '#3B82F6', '18层 钢筋');
	const svg3 = createSampleSvg(400, 300, '#10B981', '21层 模板');
	const svg4 = createSampleSvg(400, 300, '#8B5CF6', '21层 混凝土');
	const svg5 = createSampleSvg(400, 300, '#EF4444', '3层 防水');
	const svg6 = createSampleSvg(400, 300, '#F97316', '3层 抹灰');

	const now = new Date();
	const timeStr = (date: Date) => date.toISOString().replace('T', ' ').substring(0, 19);

	return [
		{
			id: generateId(),
			hash: 'sample_hash_001',
			name: '20240115_18层砌筑_001.jpg',
			date: '2024-01-15',
			floor: '18层',
			process: '砌筑',
			remark: '墙体砌筑验收合格 💯',
			dataUrl: svg1,
			thumbnailUrl: svg1,
			size: 102400,
			uploadTime: timeStr(now),
			isCompleted: true
		},
		{
			id: generateId(),
			hash: 'sample_hash_002',
			name: '20240115_18层钢筋_002.jpg',
			date: '2024-01-15',
			floor: '18层',
			process: '钢筋',
			remark: '梁板钢筋绑扎完成',
			dataUrl: svg2,
			thumbnailUrl: svg2,
			size: 153600,
			uploadTime: timeStr(now),
			isCompleted: false
		},
		{
			id: generateId(),
			hash: 'sample_hash_003',
			name: '20240116_21层模板_003.jpg',
			date: '2024-01-16',
			floor: '21层',
			process: '模板',
			remark: '模板支护检查 <b>重点</b>',
			dataUrl: svg3,
			thumbnailUrl: svg3,
			size: 204800,
			uploadTime: timeStr(now),
			isCompleted: false
		},
		{
			id: generateId(),
			hash: 'sample_hash_004',
			name: '20240116_21层混凝土_004.jpg',
			date: '2024-01-16',
			floor: '21层',
			process: '混凝土',
			remark: '混凝土浇筑完成',
			dataUrl: svg4,
			thumbnailUrl: svg4,
			size: 179200,
			uploadTime: timeStr(now),
			isCompleted: true
		},
		{
			id: generateId(),
			hash: 'sample_hash_005',
			name: '20240117_3层防水_005.jpg',
			date: '2024-01-17',
			floor: '3层',
			process: '防水',
			remark: '地下室防水施工',
			dataUrl: svg5,
			thumbnailUrl: svg5,
			size: 128000,
			uploadTime: timeStr(now),
			isCompleted: true
		},
		{
			id: generateId(),
			hash: 'sample_hash_006',
			name: '20240117_3层抹灰_006.jpg',
			date: '2024-01-17',
			floor: '3层',
			process: '抹灰',
			remark: '内墙抹灰 <script>alert(\'xss\')</script>',
			dataUrl: svg6,
			thumbnailUrl: svg6,
			size: 140800,
			uploadTime: timeStr(now),
			isCompleted: false
		}
	];
}

export function generateSampleLogs(): ConstructionLog[] {
	const now = new Date();
	const timeStr = (date: Date) => date.toISOString().replace('T', ' ').substring(0, 19);

	return [
		{
			id: generateId(),
			date: '2024-01-15',
			floor: '18层',
			process: '砌筑',
			content: '18层墙体砌筑施工，验收合格',
			photoIds: ['sample_hash_001'],
			hasPhoto: true,
			createTime: timeStr(now)
		},
		{
			id: generateId(),
			date: '2024-01-16',
			floor: '21层',
			process: '模板',
			content: '21层梁板模板支护施工',
			photoIds: ['sample_hash_003'],
			hasPhoto: true,
			createTime: timeStr(now)
		},
		{
			id: generateId(),
			date: '2024-01-18',
			floor: '5层',
			process: '钢筋',
			content: '5层梁板钢筋绑扎，缺少照片证据',
			photoIds: [],
			hasPhoto: false,
			createTime: timeStr(now)
		}
	];
}

export function getSampleData(): { photos: Photo[]; logs: ConstructionLog[] } {
	return {
		photos: generateSamplePhotos(),
		logs: generateSampleLogs()
	};
}
