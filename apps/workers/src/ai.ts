import { Router, type IRequestStrict } from "itty-router"
import { createAnthropic } from "@ai-sdk/anthropic";
import { createClient } from "@supabase/supabase-js";
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
      searchMemory: {
        description: "Search the user's memory for relevant information. Returns an array of descriptions of frames that match the query, sorted by relevance to the query",
        parameters: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => {
          console.log("Searching memory for", query)
          const result = await fetch("https://api.voyageai.com/v1/embeddings", {
            method: "POST",
            body: JSON.stringify({
              input: [query],
              model: "voyage-3"
            }),
            headers: {
              authorization: `Bearer ${env.VOYAGE_API_KEY}`,
              "content-type": "application/json"
            }
          }).then(r => r.json())
      
          const embedding = result.data?.[0]?.embedding
      
          if (!embedding) return []

          const supabase = createClient(env.SUPABASE_API_URL, env.SUPABASE_SERVICE_ROLE_KEY)
          const {data: sections} = await supabase.rpc("match_frames", {
            embedding,
            match_threshold: 0.78,
            match_count: 10,
            min_content_length: 50,
          })

          if (!sections) return []

          return sections
        }
      },
      getCurrentImage: {
        description: "Get the current image from the user's camera as a base64 encoded string",
        parameters: z.object({}),
      },
    },
  });

  return result.toDataStreamResponse();
});


export default router
