import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const webhookId = params.webhookId;

    // Get request body and headers
    const body = await request.json().catch(() => null);
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Find the endpoint
    const supabase = await createClient();
    const { data: endpoint, error: endpointError } = await supabase
      .from("webhook_endpoints")
      .select("id, user_id")
      .eq("webhook_id", webhookId)
      .single();

    if (endpointError || !endpoint) {
      return Response.json(
        { error: "Webhook endpoint not found" },
        { status: 404 }
      );
    }

    // Store the webhook event
    const { error: insertError } = await supabase
      .from("webhook_events")
      .insert({
        endpoint_id: endpoint.id,
        user_id: endpoint.user_id,
        method: "POST",
        headers,
        body,
        status_code: 200,
      });

    if (insertError) {
      console.error("Error storing webhook event:", insertError);
      return Response.json({ error: "Failed to store event" }, { status: 500 });
    }

    // Return success
    return Response.json({
      success: true,
      message: "Webhook received",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Also handle GET for testing
export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  return Response.json({
    message: "Webhook endpoint active",
    webhookId: params.webhookId,
    method: "GET",
    note: "Send POST requests to this URL to create events",
  });
}
