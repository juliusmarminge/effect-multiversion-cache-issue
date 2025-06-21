import { MockLanguageModelV1 } from "ai/test";
import { streamText, simulateReadableStream, createDataStream } from "ai";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi({
  token:
    "eyJhcHBJZCI6ImFwcC0xIiwiYXBpS2V5Ijoic2tfZm9vIiwicmVnaW9ucyI6WyJmcmExIl19",
});

const generateChatStream = async () => {
  console.log("Generating chat stream");

  const dataStream = createDataStream({
    execute: (dataStream) => {
      if (process.env.IMAGE_GEN) {
        // do image gen
        // ...

        // upload image
        void utapi.uploadFiles(new File([], "test.txt"));
      } else {
        // do text gen
        const stream = streamText({
          model: new MockLanguageModelV1({
            doStream: async () => ({
              stream: simulateReadableStream({
                chunks: [
                  { type: "text-delta", textDelta: "Hello" },
                  { type: "text-delta", textDelta: ", " },
                  { type: "text-delta", textDelta: `world!` },
                  {
                    type: "finish",
                    finishReason: "stop",
                    logprobs: undefined,
                    usage: { completionTokens: 10, promptTokens: 3 },
                  },
                ],
              }),
              rawCall: { rawPrompt: null, rawSettings: {} },
            }),
          }),
          prompt: "Hello, test!",
        });

        stream.mergeIntoDataStream(dataStream);
      }
    },
  });

  return dataStream;
};

/**
 * This breaks the /api/chat route out from being "bundled" in fluid compute
 * (other functions reseolve faster and get in the way of parallelizing this
 * route. This is a hack suggested from Malte)
 */
export const maxDuration = 799;

async function internalRouteHandler(req: Request) {
  const stream = await generateChatStream();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  });
}

export async function POST(req: Request) {
  try {
    return await internalRouteHandler(req);
  } catch (e) {
    console.error("[CHAT] Caught otherwise unhandled error", e);
    return new Response(JSON.stringify({ error: e }), {
      status: 500,
    });
  }
}
