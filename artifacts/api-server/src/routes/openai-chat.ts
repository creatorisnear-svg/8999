import { Router } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  SendOpenaiMessageParams,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/openai/conversations", async (req, res) => {
  const convs = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(convs);
});

router.post("/openai/conversations", async (req, res) => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [conv] = await db.insert(conversations).values({ title: parsed.data.title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res) => {
  const parsed = GetOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, parsed.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, parsed.data.id)).orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res) => {
  const parsed = DeleteOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(messages).where(eq(messages.conversationId, parsed.data.id));
  await db.delete(conversations).where(eq(conversations.id, parsed.data.id));
  res.status(204).send();
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  const parsed = ListOpenaiMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, parsed.data.id)).orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const paramsParsed = SendOpenaiMessageParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const convId = paramsParsed.data.id;
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({ conversationId: convId, role: "user", content: bodyParsed.data.content });

  const allMessages = await db.select().from(messages).where(eq(messages.conversationId, convId)).orderBy(messages.createdAt);
  const chatMessages = allMessages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  const stream = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: "You are a TikTok Shop dropshipping expert AI assistant. Help users research products, find suppliers, create marketing content, and grow their TikTok Shop business.",
      },
      ...chatMessages,
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  await db.insert(messages).values({ conversationId: convId, role: "assistant", content: fullResponse });
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/openai/generate-image", async (req, res) => {
  const { generateImageBuffer } = await import("@workspace/integrations-openai-ai-server/image");
  const { prompt } = req.body as { prompt: string };
  if (!prompt) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }
  const buffer = await generateImageBuffer(prompt, "1024x1024");
  res.json({ b64_json: buffer.toString("base64") });
});

export default router;
