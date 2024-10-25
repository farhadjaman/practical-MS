import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// app.use((req: Request, res: Response, next: NextFunction) => {
//   const allowedOrigins = ["http://localhost:8081", "http://127.0.0.1:8081"];
//   const origin = req.headers.origin;

//   if (origin && allowedOrigins.includes(origin)) {
//     console.log("Setting Access-Control-Allow-Origin:", origin);
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     next();
//   }
//   else
//   res.status(403).json({ message: "Forbidden" });
// });

// Routes

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const port = process.env.PORT || 4004;
const serviceName = process.env.SERVICE_NAME || "auth-service";

app.listen(port, () => {
  console.log(`${serviceName} is running on port ${port}`);
});
