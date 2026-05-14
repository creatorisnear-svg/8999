import { Buffer } from "node:buffer";

// Image generation via OpenAI is not used in this app.
// Product images are served via loremflickr.com — no API key needed.

export async function generateImageBuffer(
  _prompt: string,
  _size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  throw new Error("generateImageBuffer is not supported — use loremflickr URLs instead.");
}

export async function editImages(
  _imageFiles: string[],
  _prompt: string,
  _outputPath?: string
): Promise<Buffer> {
  throw new Error("editImages is not supported — use loremflickr URLs instead.");
}
