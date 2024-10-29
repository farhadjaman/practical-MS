//import express, dotenv, helmet, morgan, rateLimit,
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { configureRoutes } from "./utils";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (_req, res) => {
    res.status(429).json({
      message: "Too many requests, please try again later.",
    });
  },
});
app.use("/api", limiter);

app.use(morgan("dev"));
app.use(express.json());

//Routes
configureRoutes(app);

//health check
app.get("/health", (_req, res) => {
  res.json({ message: "API Gateway is up and running" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const port = process.env.PORT || 8081;

app.listen(port, () => {
  console.log(`API Gateway is running on port ${port}`);
});
