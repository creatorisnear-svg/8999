import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import suppliersRouter from "./suppliers";
import campaignsRouter from "./campaigns";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import openaiChatRouter from "./openai-chat";
import authRouter from "./auth";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(productsRouter);
router.use(suppliersRouter);
router.use(campaignsRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(openaiChatRouter);
router.use(settingsRouter);

export default router;
