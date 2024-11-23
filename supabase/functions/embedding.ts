import { createClient } from "npm:@supabase/supabase-js";
import { VoyageAIClient } from "npm:voyageai";

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

// Initialize Voyage AI client
const voyageClient = new VoyageAIClient({
  apiKey: Deno.env.get("VOYAGE_API_KEY") ?? "",
});

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  if (payload.table !== "frame")
    return Response.json({ message: "Ignored" }, { status: 202 });
  if (payload.type !== "INSERT")
    return Response.json({ message: "Ignored" }, { status: 202 });

  const supabaseAdminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get the image from Supabase storage
    const { data: imageData, error: storageError } =
      await supabaseAdminClient.storage
        .from("frames")
        .download(payload.record.filename);

    if (storageError) throw storageError;

    // Convert image data to base64
    const base64Image = await imageData
      .arrayBuffer()
      .then((buffer) => Buffer.from(buffer).toString("base64"));

    // Generate embedding using Voyage AI
    const result = await voyageClient.embed({
      input: [`data:image/jpeg;base64,${base64Image}`],
      model: "voyage-multimodal-3",
    });

    // Update the frame record with the embedding
    const { error: updateError } = await supabaseAdminClient
      .from("frame")
      .update({ embedding: result.embeddings[0] })
      .eq("id", payload.record.id);

    if (updateError) throw updateError;

    return Response.json(
      {
        message: "Embedding created successfully",
        embedding: result.embeddings[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing embedding:", error);
    return Response.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
});
