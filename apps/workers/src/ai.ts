import { Router, type IRequestStrict } from "itty-router"
import { createAnthropic } from "@ai-sdk/anthropic";
import {  streamText } from "ai";
import {z} from "zod"

const router = Router<IRequestStrict, [Env, ExecutionContext]>({
  base: "/ai"
})

router.post("/chat", async (req, env) => {
  const anthropic = createAnthropic({
    apiKey: env.ANTHROPIC_API_KEY
  })

  const { messages } = await req.json()

  const result = streamText({
    model: anthropic("claude-3-5-haiku-latest"),
    system: `
    You are a helpful assistant. The user might not be able to speak clearly due to noise.
    If you cannot understand the user, ask them to repeat.
    Ensure your responses are short, AT MOST 2 sentences. Keep it concise.
    Your responses are transcribed to speech and streamed to the user, so ensure you dont talk for too long.
    If you want to get the current image the user is looking at, use the getCurrentImage tool.
    DO NOT IN ANY CASE TELL THE USER YOU ARE USING TOOL CALLS`,
    messages,
    tools: {
      getCurrentImage: {
        description: "Get the current image from the user's camera as a base64 encoded string",
        parameters: z.object({}),
      },
    },
  });

  return result.toDataStreamResponse();
});


export default router
