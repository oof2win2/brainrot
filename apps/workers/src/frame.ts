import { Router, type IRequestStrict } from "itty-router"
import { createClient } from "@supabase/supabase-js";
import { VoyageAIClient } from "voyageai";
import { arrayBufferToBase64 } from "./utils";

type FrameRecord = {
  id: string;
  filename: string;
  embedding: number[];
  created_at: string;
};

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
    const result = await fetch("https://api.voyageai.com/v1/multimodalembeddings", {
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
    }).then(r => r.json())

    const embedding = result.data?.[0]?.embedding

    if (!embedding) throw new Error("No data embedded")

    // Update the frame record with the embedding
    const { error: updateError } = await supabaseAdminClient
      .from("frame")
      .update({ embedding })
      .eq("id", payload.record.id);

    if (updateError) throw updateError;

    return Response.json(
      {
        message: "Embedding created successfully",
        embedding: result.data[0],
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
