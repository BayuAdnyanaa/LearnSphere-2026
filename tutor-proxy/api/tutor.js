// Vercel serverless function: POST /api/tutor. All the rules are in lib/tutor.js.
import { handleTutor, newState, MAX_BODY_BYTES } from "../lib/tutor.js";

// Kept between calls while this instance stays warm
const state = newState();

// Reads at most one byte more than the limit, so a huge body cannot fill memory
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) return Buffer.alloc(MAX_BODY_BYTES + 1);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const rawBody = req.method === "POST" ? await readBody(req) : Buffer.alloc(0);
  const out = await handleTutor({ method: req.method, headers: req.headers, rawBody }, process.env, fetch, state);
  res.writeHead(out.status, out.headers);
  res.end(out.body);
}

// Vercel must not parse the body: the size check needs the raw bytes
export const config = { api: { bodyParser: false } };
