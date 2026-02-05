import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per webhook

// Max payload size: 1MB
const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024;

function checkRateLimit(webhookId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(webhookId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(webhookId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params;

    // Check rate limit
    if (!checkRateLimit(webhookId)) {
      return Response.json(
        { error: "Rate limit exceeded. Max 60 requests per minute." },
        { status: 429 }
      );
    }

    // Check payload size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return Response.json(
        { error: "Payload too large. Max size is 1MB." },
        { status: 413 }
      );
    }

    // Get request body and headers
    const bodyText = await request.text();

    // Double-check actual body size
    if (bodyText.length > MAX_PAYLOAD_SIZE) {
      return Response.json(
        { error: "Payload too large. Max size is 1MB." },
        { status: 413 }
      );
    }

    // Parse JSON body (if valid)
    let body = null;
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        // Store raw text if not valid JSON
        body = { _raw: bodyText };
      }
    }

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
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { webhookId } = await params;

  return Response.json({
    message: "Webhook endpoint active",
    webhookId,
    method: "GET",
    note: "Send POST requests to this URL to create events",
  });
}
