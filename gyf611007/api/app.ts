import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { runMigrations } from "./db.js";
import authRoutes from "./routes/auth.js";
import pageRoutes from "./routes/pages.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

runMigrations();

const app: express.Application = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const publicDir = path.resolve(__dirname, "..", "public");
app.use(express.static(publicDir));

app.use("/api/auth", authRoutes);
app.use("/", pageRoutes);

app.use(
  "/api/health",
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: "ok",
    });
  }
);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    error: "Server internal error",
  });
});

app.use((req: Request, res: Response) => {
  if (req.headers["hx-request"]) {
    res.status(404).send("Not found");
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>404 - 页面不存在</title></head>
        <body style="background:#1a1614;color:#e8ddd0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h1 style="font-size:48px;color:#c8956c;">404</h1>
            <p>页面不存在</p>
            <a href="/" style="color:#c8956c;">返回首页</a>
          </div>
        </body>
      </html>
    `);
  }
});

export default app;
