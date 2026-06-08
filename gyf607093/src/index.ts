import express, { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { logger } from './utils/logger';
import { privacyService } from './services/privacyService';

import authRoutes from './routes/auth';
import disinfectionRoutes from './routes/disinfection';
import feedbackRoutes from './routes/feedback';
import auditRoutes from './routes/audit';
import exportRoutes from './routes/export';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '婴幼儿用品消毒复核墙康复课务版',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/disinfection', disinfectionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/export', exportRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: '接口不存在', path: req.path });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('服务器错误', { error: err.message, stack: err.stack });
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

async function startServer() {
  try {
    await privacyService.init();

    app.listen(config.port, () => {
      logger.info(`==============================================`);
      logger.info(`婴幼儿用品消毒复核墙康复课务版`);
      logger.info(`服务已启动在 http://localhost:${config.port}`);
      logger.info(`==============================================`);
      logger.info(``);
      logger.info(`测试账号:`);
      logger.info(`  管理员: admin / 123456`);
      logger.info(`  主管: supervisor / 123456`);
      logger.info(`  治疗师: therapist1 / 123456`);
      logger.info(`  前台: reception / 123456`);
      logger.info(`  普通用户: general / 123456`);
      logger.info(``);
      logger.info(`主要接口:`);
      logger.info(`  POST /api/auth/login - 登录`);
      logger.info(`  GET  /api/disinfection/class/:id - 班级消毒记录`);
      logger.info(`  GET  /api/disinfection/baby/:id - 宝宝消毒记录`);
      logger.info(`  POST /api/disinfection/:id/resolve - 处理异常`);
      logger.info(`  POST /api/disinfection/manual - 手工补录`);
      logger.info(`  POST /api/feedback - 创建课后反馈`);
      logger.info(`  GET  /api/audit/unauthorized - 越权审计日志`);
      logger.info(`  POST /api/export/csv - 导出CSV`);
      logger.info(``);
    });
  } catch (error) {
    logger.error('服务启动失败', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();

export default app;
