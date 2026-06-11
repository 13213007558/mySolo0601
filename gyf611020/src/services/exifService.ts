import piexif from 'piexifjs';

export interface ExifExtra {
  operatorId: string;
  manuscriptCode: string;
  pageNum: number;
}

const blobToDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const dataURLToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const exifService = {
  async writeAngleMetadata(
    imageBlob: Blob,
    angle: number,
    extra: ExifExtra
  ): Promise<Blob> {
    try {
      const dataUrl = await blobToDataURL(imageBlob);
      const userComment = JSON.stringify({
        angle,
        operatorId: extra.operatorId,
        manuscriptCode: extra.manuscriptCode,
        pageNum: extra.pageNum,
        timestamp: Date.now(),
      });

      const zeroth: Record<number, unknown> = {};
      zeroth[piexif.ImageIFD.Software] = 'ManuscriptSideLight/1.0';

      const exif: Record<number, unknown> = {};
      exif[piexif.ExifIFD.DateTimeOriginal] =
        new Date().toISOString().replace('T', ' ').slice(0, 19);
      exif[piexif.ExifIFD.UserComment] = encodeUserComment(userComment);

      const gps: Record<number, unknown> = {};
      gps[piexif.GPSIFD.GPSVersionID] = [2, 0, 0, 0];

      const exifObj = { '0th': zeroth, Exif: exif, GPS: gps, Interop: {}, '1st': {}, thumbnail: null };
      const exifBytes = piexif.dump(exifObj as never);
      const newDataUrl = piexif.insert(exifBytes, dataUrl);
      return dataURLToBlob(newDataUrl);
    } catch (err) {
      console.warn('EXIF写入失败，返回原图:', err);
      return imageBlob;
    }
  },

  async readAngleMetadata(imageBlob: Blob): Promise<number | null> {
    try {
      const dataUrl = await blobToDataURL(imageBlob);
      const exifObj = piexif.load(dataUrl) as {
        Exif?: Record<number, unknown>;
      };
      const userComment = exifObj.Exif?.[piexif.ExifIFD.UserComment];
      if (!userComment) return null;
      const decoded = decodeUserComment(userComment as string);
      if (!decoded) return null;
      const parsed = JSON.parse(decoded) as { angle?: number };
      return parsed.angle ?? null;
    } catch (err) {
      console.warn('EXIF读取失败:', err);
      return null;
    }
  },
};

function encodeUserComment(text: string): string {
  const prefix = 'UNICODE\x00';
  const encoder = new TextEncoder();
  const prefixBytes = encoder.encode(prefix);
  const textBytes = encoder.encode(text);
  const combined = new Uint8Array(prefixBytes.length + textBytes.length);
  combined.set(prefixBytes, 0);
  combined.set(textBytes, prefixBytes.length);
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return binary;
}

function decodeUserComment(raw: string): string | null {
  try {
    if (typeof raw !== 'string') return null;
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    const decoded = decoder.decode(bytes);
    const marker = 'UNICODE\x00';
    const idx = decoded.indexOf(marker);
    if (idx !== -1) return decoded.slice(idx + marker.length);
    return decoded;
  } catch {
    return null;
  }
}
