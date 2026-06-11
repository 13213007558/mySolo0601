import { Router, type Request, type Response } from "express";
import { renderLayout } from "../views/layout.js";
import { renderLoginPage } from "../views/loginView.js";
import { renderDashboard, renderNewBatchForm } from "../views/dashboardView.js";
import {
  renderCuppingRoom,
  renderSamplePartial,
} from "../views/cuppingView.js";
import {
  renderBatchCard,
} from "../views/dashboardView.js";
import { renderCertificatePage, renderCertificateInner } from "../views/certificateView.js";
import { requireAuth, authMiddleware } from "../middleware/authMiddleware.js";
import * as repo from "../repositories/cuppingRepository.js";
import * as service from "../services/cuppingService.js";

const router = Router();

router.use(authMiddleware);

router.get("/", (req: Request, res: Response): void => {
  if (req.user) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/login");
  }
});

router.get("/login", (req: Request, res: Response): void => {
  if (req.user) {
    res.redirect("/dashboard");
    return;
  }
  const content = renderLoginPage();
  const html = renderLayout(content, {
    title: "登录",
    user: null,
  });
  res.send(html);
});

router.get("/dashboard", requireAuth, (req: Request, res: Response): void => {
  const batches = repo.getAllBatches();
  const content = renderDashboard(batches, req.user!);
  const html = renderLayout(content, {
    title: "批次管理",
    user: req.user!,
  });
  res.send(html);
});

router.get("/batches/new", requireAuth, (req: Request, res: Response): void => {
  if (req.user!.role !== "chief" && req.user!.role !== "admin") {
    res.status(403).send("Forbidden");
    return;
  }
  const form = renderNewBatchForm();
  res.send(form);
});

router.post("/batches", requireAuth, (req: Request, res: Response): void => {
  if (req.user!.role !== "chief" && req.user!.role !== "admin") {
    res.status(403).send("Forbidden");
    return;
  }

  const { batch_code, tea_name, origin, sample_count } = req.body;
  const sampleCount = parseInt(sample_count as string) || 3;

  const batch = repo.createBatch({
    batch_code: batch_code as string,
    tea_name: tea_name as string,
    origin: (origin as string) || "",
    created_by: req.user!.id,
  });

  for (let i = 1; i <= sampleCount; i++) {
    repo.addSample(batch.id, `${batch.batch_code}-${i}`, i);
  }

  res.setHeader("HX-Redirect", `/cupping/${batch.id}`);
  res.sendStatus(200);
});

router.get(
  "/cupping/:batchId",
  requireAuth,
  (req: Request, res: Response): void => {
    const batchId = parseInt(req.params.batchId);
    const batch = repo.getBatchById(batchId);

    if (!batch) {
      res.status(404).send("批次不存在");
      return;
    }

    const samples = repo.getSamplesByBatchId(batchId);
    const standards = service.getStandardScores(batchId);
    const currentSample = service.getNextSampleToEvaluate(batchId);

    let existingScore: import("../types.js").Score | null = null;
    if (currentSample) {
      existingScore = repo.getScoreBySampleAndScorer(
        currentSample.id,
        req.user!.id
      ) || null;
    }

    const content = renderCuppingRoom(
      batch,
      samples,
      currentSample,
      standards,
      req.user!,
      existingScore
    );

    const html = renderLayout(content, {
      title: `${batch.batch_code} · 杯测审评`,
      user: req.user!,
    });

    res.send(html);
  }
);

router.get(
  "/cupping/:batchId/sample/:sampleId",
  requireAuth,
  (req: Request, res: Response): void => {
    const sampleId = parseInt(req.params.sampleId);
    const batchId = parseInt(req.params.batchId);
    const sample = repo.getSampleById(sampleId);

    if (!sample || sample.batch_id !== batchId) {
      res.status(404).send("样本不存在");
      return;
    }

    const standards = service.getStandardScores(batchId);
    const existingScore =
      repo.getScoreBySampleAndScorer(sampleId, req.user!.id) || null;

    const content = renderSamplePartial(
      sample,
      standards,
      existingScore,
      req.user!
    );

    res.send(content);
  }
);

router.post(
  "/cupping/:batchId/sample/:sampleId/verify-spoon",
  requireAuth,
  (req: Request, res: Response): void => {
    const sampleId = parseInt(req.params.sampleId);
    const batchId = parseInt(req.params.batchId);
    const sample = repo.getSampleById(sampleId);

    if (!sample || sample.batch_id !== batchId) {
      res.status(404).send("样本不存在");
      return;
    }

    if (sample.status === "scored" || sample.sip_valid !== null) {
      res.status(400).send("样本已完成啜饮");
      return;
    }

    repo.verifySpoon(sampleId);
    repo.updateSampleStatus(sampleId, "sipping");

    const updatedSample = repo.getSampleById(sampleId)!;
    const standards = service.getStandardScores(batchId);
    const existingScore =
      repo.getScoreBySampleAndScorer(sampleId, req.user!.id) || null;

    const content = renderSamplePartial(
      updatedSample,
      standards,
      existingScore,
      req.user!
    );

    res.send(content);
  }
);

router.post(
  "/cupping/:batchId/sample/:sampleId/end-sip",
  requireAuth,
  (req: Request, res: Response): void => {
    const sampleId = parseInt(req.params.sampleId);
    const batchId = parseInt(req.params.batchId);
    const sample = repo.getSampleById(sampleId);

    if (!sample || sample.batch_id !== batchId) {
      res.status(404).send("样本不存在");
      return;
    }

    const {
      duration_ms,
      avg_volume_db,
      peak_volume_db,
      min_volume_db,
      samples_above_threshold,
      total_samples,
    } = req.body;

    const sipResult = {
      duration_ms: parseInt(duration_ms as string) || 0,
      avg_volume_db: parseFloat(avg_volume_db as string) || 0,
      peak_volume_db: parseFloat(peak_volume_db as string) || 0,
      min_volume_db: parseFloat(min_volume_db as string) || 0,
      samples_above_threshold: parseInt(samples_above_threshold as string) || 0,
      total_samples: parseInt(total_samples as string) || 0,
    };

    const validation = service.validateSipResult(
      sipResult,
      sample.volume_threshold_db
    );

    repo.updateSipResult(
      sampleId,
      sipResult.duration_ms,
      sipResult.avg_volume_db,
      validation.valid,
      sample.volume_threshold_db
    );

    const updatedSample = repo.getSampleById(sampleId)!;
    const standards = service.getStandardScores(batchId);
    const existingScore =
      repo.getScoreBySampleAndScorer(sampleId, req.user!.id) || null;

    const content = renderSamplePartial(
      updatedSample,
      standards,
      existingScore,
      req.user!
    );

    res.send(content);
  }
);

router.post(
  "/cupping/:batchId/sample/:sampleId/score",
  requireAuth,
  (req: Request, res: Response): void => {
    const sampleId = parseInt(req.params.sampleId);
    const batchId = parseInt(req.params.batchId);
    const sample = repo.getSampleById(sampleId);

    if (!sample || sample.batch_id !== batchId) {
      res.status(404).send("样本不存在");
      return;
    }

    if (!sample.sip_valid) {
      res.status(400).send("啜饮不合格，无法评分");
      return;
    }

    const appearance = parseFloat(req.body.appearance as string) || 0;
    const aroma = parseFloat(req.body.aroma as string) || 0;
    const taste = parseFloat(req.body.taste as string) || 0;
    const leaf = parseFloat(req.body.leaf as string) || 0;

    const standards = service.getStandardScores(batchId);
    const total = service.calculateTotal({ appearance, aroma, taste, leaf });
    const deviation = service.calculateDeviation(
      { appearance, aroma, taste, leaf },
      standards
    );

    repo.upsertScore({
      sample_id: sampleId,
      scorer_id: req.user!.id,
      appearance,
      aroma,
      taste,
      leaf,
      total,
      deviation,
    });

    repo.updateSampleStatus(sampleId, "scored");

    const batch = repo.getBatchById(batchId)!;
    if (batch.status === "pending") {
      repo.updateBatchStatus(batchId, "in_progress");
    }

    const allScored = service.checkIfAllSamplesScored(batchId);
    if (allScored) {
      service.autoCreateCertificateDraft(batchId);
    }

    const updatedSample = repo.getSampleById(sampleId)!;
    const updatedStandards = service.getStandardScores(batchId);
    const updatedScore = repo.getScoreBySampleAndScorer(
      sampleId,
      req.user!.id
    ) || null;

    const content = renderSamplePartial(
      updatedSample,
      updatedStandards,
      updatedScore,
      req.user!
    );

    res.send(content);
  }
);

router.post(
  "/cupping/:batchId/sample/:sampleId/invalidate",
  requireAuth,
  (req: Request, res: Response): void => {
    const sampleId = parseInt(req.params.sampleId);
    const batchId = parseInt(req.params.batchId);
    const sample = repo.getSampleById(sampleId);

    if (!sample || sample.batch_id !== batchId) {
      res.status(404).send("样本不存在");
      return;
    }

    const result = service.tryInvalidateSample(sampleId);

    if (!result.success) {
      res.status(400).send("操作失败");
      return;
    }

    const batch = repo.getBatchById(batchId)!;
    const samples = repo.getSamplesByBatchId(batchId);
    const standards = service.getStandardScores(batchId);
    const nextSample = service.getNextSampleToEvaluate(batchId);

    const existingScore = nextSample
      ? repo.getScoreBySampleAndScorer(nextSample.id, req.user!.id) || null
      : null;

    const content = renderCuppingRoom(
      batch,
      samples,
      nextSample,
      standards,
      req.user!,
      existingScore
    );

    res.send(content);
  }
);

router.post(
  "/cupping/:batchId/lock",
  requireAuth,
  (req: Request, res: Response): void => {
    if (req.user!.role !== "chief" && req.user!.role !== "admin") {
      res.status(403).send("Forbidden");
      return;
    }

    const batchId = parseInt(req.params.batchId);
    const batch = repo.getBatchById(batchId);

    if (!batch) {
      res.status(404).send("批次不存在");
      return;
    }

    repo.lockBatch(batchId);

    const updatedBatch = repo.getBatchById(batchId)!;
    const samples = repo.getSamplesByBatchId(batchId);
    const standards = service.getStandardScores(batchId);
    const nextSample = service.getNextSampleToEvaluate(batchId);
    const existingScore = nextSample
      ? repo.getScoreBySampleAndScorer(nextSample.id, req.user!.id) || null
      : null;

    const content = renderCuppingRoom(
      updatedBatch,
      samples,
      nextSample,
      standards,
      req.user!,
      existingScore
    );

    const html = renderLayout(content, {
      title: `${updatedBatch.batch_code} · 杯测审评`,
      user: req.user!,
    });

    res.send(html);
  }
);

router.get(
  "/cupping/:batchId/certificate",
  requireAuth,
  (req: Request, res: Response): void => {
    const batchId = parseInt(req.params.batchId);
    const batch = repo.getBatchById(batchId);

    if (!batch) {
      res.status(404).send("批次不存在");
      return;
    }

    const samples = repo.getSamplesByBatchId(batchId);
    const standards = service.getStandardScores(batchId);

    let certificate = repo.getCertificateByBatchId(batchId);
    if (!certificate) {
      const content = service.generateCertificateContent(batchId);
      certificate = repo.createCertificate(batchId, content);
    }

    const content = renderCertificatePage(
      batch,
      samples,
      standards,
      certificate,
      req.user!
    );

    const html = renderLayout(content, {
      title: `${batch.batch_code} · 拍卖证书`,
      user: req.user!,
    });

    res.send(html);
  }
);

router.post(
  "/cupping/:batchId/certificate/sign",
  requireAuth,
  (req: Request, res: Response): void => {
    if (req.user!.role !== "chief" && req.user!.role !== "admin") {
      res.status(403).send("Forbidden");
      return;
    }

    const batchId = parseInt(req.params.batchId);
    const batch = repo.getBatchById(batchId);

    if (!batch) {
      res.status(404).send("批次不存在");
      return;
    }

    let certificate = repo.getCertificateByBatchId(batchId);
    if (!certificate) {
      const content = service.generateCertificateContent(batchId);
      certificate = repo.createCertificate(batchId, content);
    }

    if (!certificate.signed_at) {
      repo.signCertificate(certificate.id, req.user!.id);
      certificate = repo.getCertificateByBatchId(batchId);
    }

    const samples = repo.getSamplesByBatchId(batchId);
    const standards = service.getStandardScores(batchId);

    const content = renderCertificateInner(
      batch,
      samples,
      standards,
      certificate,
      req.user!
    );

    res.send(content);
  }
);

router.get(
  "/api/batches",
  requireAuth,
  (req: Request, res: Response): void => {
    const batches = repo.getAllBatches();
    const html = batches.map((b) => renderBatchCard(b)).join("");
    res.send(html);
  }
);

export default router;
