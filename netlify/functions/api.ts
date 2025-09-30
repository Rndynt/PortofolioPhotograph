import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let isInitialized = false;

async function initializeApp() {
  if (!isInitialized) {
    await registerRoutes(app);
    isInitialized = true;
  }
}

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  await initializeApp();
  return serverlessHandler(event, context);
};
