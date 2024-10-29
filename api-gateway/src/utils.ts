import axios from "axios";
import { Express, Request, Response } from "express";
import config from "./config.json";
import middlewares from "./middlewares";

export const getMiddlewares = (middlewareNames: string[]) => {
  return middlewareNames.map((middlewareName) => middlewares[middlewareName]);
};

const createHandler = (hostname: string, path: string, method: string) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      let url = `${hostname}${path}`;

      if (req.params) {
        Object.entries(req.params).forEach(([key, value]) => {
          url = url.replace(`:${key}`, encodeURIComponent(value));
        });
      }

            const {
              authorization,
              "user-agent": userAgent,
              // Add other headers you need to forward
            } = req.headers;

      const { data } = await axios({
        method: method.toLowerCase(),
        url,
        data: req.body,
        headers: {
          authorization,
          "user-agent": userAgent,
          origin: "http://localhost:8081",
          "x-user-id": req.headers["x-user-id"] || "",
          "x-user-name": req.headers["x-user-name"] || "",
          "x-user-email": req.headers["x-user-email"] || "",
          "x-user-role": req.headers["x-user-role"] || "",
        },
      });
      res.status(200).json(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const { response } = error;
        res
          .status(response?.status || 500)
          .json(response?.data || { message: "Server Error" });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  };
};

export const configureRoutes = (app: Express) => {
  Object.entries(config.services).forEach(([_name, service]) => {
    const hostname = service.url;
    service.routes.forEach((route) => {
      route.methods.forEach((method) => {
        const endpoint = `/api${route.path}`;
        const routeMiddlewares = getMiddlewares(route.middlewares);
        const handler = createHandler(hostname, route.path, method);
        app[method.toLowerCase()](endpoint,...routeMiddlewares, handler);
      });
    });
  });
};
