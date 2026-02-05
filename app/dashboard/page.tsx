"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { FiPlus, FiLogOut, FiCopy, FiExternalLink } from "react-icons/fi";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@supabase/supabase-js";
import { createEndpoint } from "./actions";

interface Endpoint {
  id: string;
  name: string;
  webhook_id: string;
  created_at: string;
  event_count?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      } else {
        setUser(user);
        loadEndpoints(user.id);
      }
    };
    checkUser();
  }, []);

  const loadEndpoints = async (userId: string) => {
    setLoading(true);

    // Get endpoints
    const { data: endpointsData, error: endpointsError } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (endpointsError) {
      console.error("Error loading endpoints:", endpointsError);
      setLoading(false);
      return;
    }

    // Get event counts for each endpoint
    const endpointsWithCounts = await Promise.all(
      (endpointsData || []).map(async (endpoint) => {
        const { count } = await supabase
          .from("webhook_events")
          .select("*", { count: "exact", head: true })
          .eq("endpoint_id", endpoint.id);

        return {
          ...endpoint,
          event_count: count || 0,
        };
      })
    );

    setEndpoints(endpointsWithCounts);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const openCreateDialog = () => {
    setEndpointName("");
    setDialogOpen(true);
  };

  const handleCreateEndpoint = async () => {
    if (!endpointName.trim() || !user) return;

    setCreating(true);

    const result = await createEndpoint(endpointName);

    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Endpoint created successfully");
      loadEndpoints(user.id);
      setDialogOpen(false);
    }

    setCreating(false);
  };

  const copyWebhookUrl = (webhookId: string) => {
    const url = `${window.location.origin}/api/webhooks/${webhookId}`;
    navigator.clipboard.writeText(url);
    showToast("Webhook URL copied to clipboard");
  };

  const getWebhookUrl = (webhookId: string) => {
    return `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/api/webhooks/${webhookId}`;
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Webhook Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <FiLogOut className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Webhooks</h2>
            <p className="text-gray-600">
              Create webhook endpoints to receive and test HTTP requests
            </p>
          </div>
          <Button onClick={openCreateDialog} disabled={creating} size="lg">
            <FiPlus className="mr-2" />
            New Endpoint
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading endpoints...
          </div>
        ) : endpoints.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">No webhook endpoints yet</p>
              <Button onClick={openCreateDialog} disabled={creating}>
                <FiPlus className="mr-2" />
                Create Your First Endpoint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {endpoints.map((endpoint) => (
              <Card
                key={endpoint.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{endpoint.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {getWebhookUrl(endpoint.webhook_id)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyWebhookUrl(endpoint.webhook_id)}
                        >
                          <FiCopy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>
                          {endpoint.event_count}{" "}
                          {endpoint.event_count === 1 ? "event" : "events"}
                        </span>
                        <span>
                          Created{" "}
                          {formatDistanceToNow(new Date(endpoint.created_at))}{" "}
                          ago
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/endpoints/${endpoint.id}`}>
                      <Button variant="outline">
                        View Events
                        <FiExternalLink className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Endpoint Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Endpoint</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="name" className="text-sm font-medium mb-2 block">
              Endpoint Name
            </label>
            <Input
              id="name"
              placeholder="e.g., Stripe Webhooks"
              value={endpointName}
              onChange={(e) => setEndpointName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateEndpoint();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateEndpoint}
              disabled={creating || !endpointName.trim()}
            >
              {creating ? "Creating..." : "Create Endpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
