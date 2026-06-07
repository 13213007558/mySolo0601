import { Router, type Request, type Response } from 'express';
import {
  getAllBabies,
  getBabyById,
  createBaby,
  updateBaby,
  addTemperature,
  addRectification,
  updateRectification,
  addPhoto,
  updatePhoto,
  getBabyStatistics,
} from '../services/babyService.js';
import type { DataStatus, ApiResponse } from '../../shared/types.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', (req: Request, res: Response<ApiResponse<any>>) => {
  const status = req.query.status as DataStatus | undefined;
  const search = req.query.search as string | undefined;
  const babies = getAllBabies(status, search);
  const stats = getBabyStatistics();
  res.json({ success: true, data: { babies, stats } });
});

router.get('/stats', (_req: Request, res: Response<ApiResponse<any>>) => {
  const stats = getBabyStatistics();
  res.json({ success: true, data: stats });
});

router.get('/:id', (req: Request, res: Response<ApiResponse<any>>) => {
  const baby = getBabyById(req.params.id);
  if (!baby) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: baby });
});

router.post('/', (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const baby = createBaby(req.body);
    res.json({ success: true, data: baby });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', (req: Request, res: Response<ApiResponse<any>>) => {
  const baby = updateBaby(req.params.id, req.body);
  if (!baby) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: baby });
});

router.get('/:id/temperatures', (req: Request, res: Response<ApiResponse<any>>) => {
  const baby = getBabyById(req.params.id);
  if (!baby) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: baby.temperatures });
});

router.post('/:id/temperatures', (req: Request, res: Response<ApiResponse<any>>) => {
  const record = addTemperature(req.params.id, req.body);
  if (!record) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: record });
});

router.get('/:id/photos', (req: Request, res: Response<ApiResponse<any>>) => {
  const baby = getBabyById(req.params.id);
  if (!baby) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: baby.photos });
});

router.post('/:id/photos', upload.single('file'), (req: Request, res: Response<ApiResponse<any>>) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: '未上传文件' });
    return;
  }
  const description = req.body.description || '';
  const fileUrl = `/uploads/${req.file.filename}`;
  const photo = addPhoto(
    req.params.id,
    req.file.originalname,
    req.file.path,
    fileUrl,
    description
  );
  if (!photo) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: photo });
});

router.put('/:id/photos/:photoId', (req: Request, res: Response<ApiResponse<any>>) => {
  const photo = updatePhoto(req.params.photoId, req.body);
  if (!photo) {
    res.status(404).json({ success: false, error: '照片不存在' });
    return;
  }
  res.json({ success: true, data: photo });
});

router.get('/:id/rectifications', (req: Request, res: Response<ApiResponse<any>>) => {
  const baby = getBabyById(req.params.id);
  if (!baby) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: baby.rectifications });
});

router.post('/:id/rectifications', (req: Request, res: Response<ApiResponse<any>>) => {
  const record = addRectification(req.params.id, req.body);
  if (!record) {
    res.status(404).json({ success: false, error: '宝宝不存在' });
    return;
  }
  res.json({ success: true, data: record });
});

router.put('/:id/rectifications/:recordId', (req: Request, res: Response<ApiResponse<any>>) => {
  const record = updateRectification(req.params.recordId, req.body);
  if (!record) {
    res.status(404).json({ success: false, error: '整改记录不存在' });
    return;
  }
  res.json({ success: true, data: record });
});

export default router;
