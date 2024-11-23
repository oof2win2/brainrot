import { Router, type IRequestStrict } from "itty-router"
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

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
    system: 'You are a helpful assistant.',
    messages,
  });

  return result.toDataStreamResponse();
});


export default router
