"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createEndpoint(name: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Generate short unique ID
  const webhookId = Math.random().toString(36).substring(2, 10);

  const { error } = await supabase.from("webhook_endpoints").insert({
    user_id: user.id,
    name: name.trim(),
    webhook_id: webhookId,
  });

  if (error) {
    console.error("Error creating endpoint:", error);
    return { error: "Failed to create endpoint" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteEndpoint(endpointId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership before deleting
  const { data: endpoint } = await supabase
    .from("webhook_endpoints")
    .select("user_id")
    .eq("id", endpointId)
    .single();

  if (!endpoint || endpoint.user_id !== user.id) {
    return { error: "Endpoint not found or access denied" };
  }

  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", endpointId);

  if (error) {
    console.error("Error deleting endpoint:", error);
    return { error: "Failed to delete endpoint" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
