import { GoogleGenAI } from '@google/genai';

export interface Verdict {
  match: 'yes' | 'no' | 'unsure';
  reason: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Lenient verification: approve unless the model is confident the task was NOT done.
// Any API error → 'unsure' (caller approves). Party > strictness.
export async function verifyPhoto(
  submitted: Buffer,
  taskDescription: string,
  reference?: Buffer | null,
  submittedMime = 'image/jpeg',
): Promise<Verdict> {
  try {
    const parts: object[] = [
      {
        text:
          `You are verifying a photo task at a wedding party game. Task given to the guest: "${taskDescription}".\n` +
          (reference
            ? 'The FIRST image is a reference photo of the target person. The SECOND image is the guest submission. Decide if the target person (from the reference) appears in the submission together with at least one other person.\n'
            : 'The image is the guest submission. Decide if it plausibly shows the task being completed.\n') +
          'Be lenient: party lighting, silly poses and partial faces are fine. Answer "no" ONLY if the photo clearly has nothing to do with the task (e.g. a random object, empty room, screenshot). If in doubt answer "unsure".',
      },
    ];
    if (reference) parts.push({ inlineData: { mimeType: 'image/webp', data: reference.toString('base64') } }); // admin refs are webp
    parts.push({ inlineData: { mimeType: submittedMime, data: submitted.toString('base64') } });

    const res = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            match: { type: 'string', enum: ['yes', 'no', 'unsure'] },
            reason: { type: 'string' },
          },
          required: ['match', 'reason'],
        },
      },
    });
    return JSON.parse(res.text ?? '{"match":"unsure","reason":"empty response"}') as Verdict;
  } catch (e) {
    return { match: 'unsure', reason: `api error: ${e instanceof Error ? e.message : e}` };
  }
}
