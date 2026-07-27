export interface Verdict {
  match: 'yes' | 'no' | 'unsure';
  reason: string;
}

// gpt-5.4-mini, not nano: this is face matching under party lighting, the one place
// weaker vision would cost real false rejections. ~$0.001 per check either way.
const MODEL = 'gpt-5.4-mini';

const SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'verdict',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        match: { type: 'string', enum: ['yes', 'no', 'unsure'] },
        reason: { type: 'string' },
      },
      required: ['match', 'reason'],
      additionalProperties: false,
    },
  },
};

function imagePart(bytes: Buffer) {
  // 640px webp thumbnails: plenty to recognise a face, and ~2.3x cheaper than the
  // full-size version, since OpenAI bills images by dimensions rather than file size.
  return { type: 'image_url', image_url: { url: `data:image/webp;base64,${bytes.toString('base64')}` } };
}

// Lenient verification: approve unless the model is confident the task was NOT done.
// Any API error → 'unsure' (caller approves). Party > strictness.
export async function verifyPhoto(
  submitted: Buffer,
  taskDescription: string,
  reference?: Buffer | null,
): Promise<Verdict> {
  try {
    const text =
      `You are verifying a photo task at a wedding party game. Task given to the guest: "${taskDescription}".\n` +
      (reference
        ? 'The FIRST image is a reference photo of the target person. The SECOND image is the guest submission. Decide if the target person (from the reference) appears in the submission together with at least one other person.\n'
        : 'The image is the guest submission. Decide if it plausibly shows the task being completed.\n') +
      'Be lenient: party lighting, silly poses and partial faces are fine. Answer "no" ONLY if the photo clearly has nothing to do with the task (e.g. a random object, empty room, screenshot). If in doubt answer "unsure".';

    const content: object[] = [{ type: 'text', text }];
    if (reference) content.push(imagePart(reference));
    content.push(imagePart(submitted));

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content }],
        response_format: SCHEMA,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { match: 'unsure', reason: `api error ${res.status}: ${body.slice(0, 200)}` };
    }
    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) return { match: 'unsure', reason: 'empty response' };
    return JSON.parse(raw) as Verdict;
  } catch (e) {
    return { match: 'unsure', reason: `api error: ${e instanceof Error ? e.message : e}` };
  }
}
