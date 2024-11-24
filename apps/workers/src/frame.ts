import { Router, type IRequestStrict } from "itty-router"
import { createClient } from "@supabase/supabase-js";
import { VoyageAIClient } from "voyageai";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

type FrameRecord = {
  id: string;
  filename: string;
  embedding: number[];
  created_at: string;
};
2
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: FrameRecord;
  schema: "public";
  old_record: null | FrameRecord;
}

const router = Router<IRequestStrict, [Env, ExecutionContext]>({
  base: "/webhooks"
})

router.post("/frame", async (req, env) => {
  // Initialize Voyage AI client
  const voyageClient = new VoyageAIClient({
    apiKey: env.VOYAGE_API_KEY
  });

  const payload: WebhookPayload = await req.json();
  if (payload.table !== "frame")
    return Response.json({ message: "Ignored" }, { status: 202 });
  if (payload.type !== "INSERT")
    return Response.json({ message: "Ignored" }, { status: 202 });

  const supabaseAdminClient = createClient(
    env.SUPABASE_API_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get the image from Supabase storage
    // const { data: imageData, error: storageError } =
    //   await supabaseAdminClient.storage
    //     .from("frame")
    //     .download(payload.record.filename);
    //

    // if (storageError) throw storageError;
    //
    // // Convert image data to base64
    // const base64Image = await imageData
    //   .arrayBuffer()
    //   .then((buffer) => arrayBufferToBase64(buffer))
    //
    const image_url = supabaseAdminClient.storage.from("frame").getPublicUrl(payload.record.filename)

    // Generate embedding using Voyage AI
    const [embeddingReq, descriptionReq] = await Promise.all([
      fetch("https://api.voyageai.com/v1/multimodalembeddings", {
        method: "POST",
        body: JSON.stringify({
          inputs: [
            {
              content: [
                {
                  type: "image_url",
                  image_url: image_url.data.publicUrl
                }
              ]
            }
          ],
          model: "voyage-multimodal-3"
        }),
        headers: {
          authorization: `Bearer ${env.VOYAGE_API_KEY}`,
          "content-type": "application/json"
        }
      }).then(r => r.json()),
      generateText({
        model: createAnthropic({apiKey: env.ANTHROPIC_API_KEY})("claude-3-5-sonnet-latest"),
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates descriptions of images"
          },
          {
            role: "user",
            content: [
              {
                type: "image",
                // mimeType: "image/jpeg",
                image: new URL(image_url.data.publicUrl)
              }
            ]
          }
        ]
      })
    ])

    const embedding = embeddingReq.data?.[0]?.embedding
    const description = descriptionReq.text

    if (!embedding) throw new Error("No data embedded")

    // Update the frame record with the embedding
    const { error: updateError } = await supabaseAdminClient
      .from("frame")
      .update({ embedding, description })
      .eq("id", payload.record.id);

    if (updateError) throw updateError;

    return Response.json(
      {
        message: "Embedding created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing embedding:", error);
    return Response.json(
      {
        message: "Internal Server Error"
      },
      { status: 500 }
    );
  }
});


export default router
