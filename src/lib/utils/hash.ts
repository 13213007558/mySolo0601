import type { Photo } from '$lib/types';

export async function calculateFileHash(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}

export function findDuplicatePhotos(newHash: string, existingPhotos: Photo[]): Photo | undefined {
	return existingPhotos.find((p) => p.hash === newHash);
}

export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export async function generateThumbnail(file: File, maxSize = 200): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			let { width, height } = img;

			if (width > height) {
				if (width > maxSize) {
					height = Math.round((height * maxSize) / width);
					width = maxSize;
				}
			} else {
				if (height > maxSize) {
					width = Math.round((width * maxSize) / height);
					height = maxSize;
				}
			}

			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('无法创建 canvas 上下文'));
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);
			resolve(canvas.toDataURL('image/jpeg', 0.8));
		};
		img.onerror = () => reject(new Error('图片加载失败'));
		img.src = URL.createObjectURL(file);
	});
}
