import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import suppliersRouter from "./suppliers";
import campaignsRouter from "./campaigns";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import openaiChatRouter from "./openai-chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(suppliersRouter);
router.use(campaignsRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(openaiChatRouter);

export default router;
