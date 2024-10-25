import axios from "axios";
import { Express, Request, Response } from "express";
import config from "./config.json";

export const configureRoutes = (app: Express) => {
  Object.entries(config.services).forEach(([_name, service]) => {
    const hostname = service.url;
    service.routes.forEach((route) => {
      route.methods.forEach((method) => {
        const handler = createHandler(hostname, route.path, method);
        app[method.toLowerCase()](`/api${route.path}`, handler);
      });
    });
  });
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

      console.log(url);

      const { data } = await axios({
        method: method.toLowerCase(),
        url,
        data: req.body,
        headers: {
          ...req.headers,
          origin: "http://localhost:8081",
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
