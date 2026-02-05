"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { FiArrowLeft, FiCopy, FiTrash2, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";
import { format } from "date-fns";

interface Event {
  id: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  status_code: number;
  error_message: string | null;
  created_at: string;
}

interface Endpoint {
  id: string;
  name: string;
  webhook_id: string;
  created_at: string;
}

export default function EndpointDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();

    // Set up real-time subscription for new events
    const channel = supabase
      .channel("webhook-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webhook_events",
          filter: `endpoint_id=eq.${id}`,
        },
        (payload) => {
          setEvents((prev) => [payload.new as Event, ...prev]);
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Real-time subscription error:", err);
          showToast("Real-time updates unavailable. Use refresh to see new events.", "error");
        }
        if (status === "TIMED_OUT") {
          console.error("Real-time subscription timed out");
          showToast("Real-time connection timed out. Reconnecting...", "error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, showToast]);

  const loadData = async () => {
    setLoading(true);

    // Load endpoint
    const { data: endpointData, error: endpointError } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("id", id)
      .single();

    if (endpointError) {
      console.error("Error loading endpoint:", endpointError);
      router.push("/dashboard");
      return;
    }

    setEndpoint(endpointData);

    // Load events
    const { data: eventsData, error: eventsError } = await supabase
      .from("webhook_events")
      .select("*")
      .eq("endpoint_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (eventsError) {
      console.error("Error loading events:", eventsError);
    } else {
      setEvents(eventsData || []);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("webhook_endpoints")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting:", error);
      showToast("Failed to delete endpoint", "error");
      setDeleting(false);
      setDeleteDialogOpen(false);
    } else {
      showToast("Endpoint deleted successfully");
      router.push("/dashboard");
    }
  };

  const copyWebhookUrl = () => {
    if (!endpoint) return;
    const url = `${window.location.origin}/api/webhooks/${endpoint.webhook_id}`;
    navigator.clipboard.writeText(url);
    showToast("Webhook URL copied to clipboard");
  };

  if (loading || !endpoint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const webhookUrl = `${window.location.origin}/api/webhooks/${endpoint.webhook_id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <FiArrowLeft className="mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">{endpoint.name}</h1>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleting}
            >
              <FiTrash2 className="mr-2" />
              Delete Endpoint
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Webhook URL Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Webhook URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg text-sm">
                {webhookUrl}
              </code>
              <Button onClick={copyWebhookUrl} variant="outline">
                <FiCopy className="mr-2" />
                Copy
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Send POST requests to this URL. Events will appear below in
              real-time.
            </p>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Events ({events.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={loadData}>
                <FiRefreshCw className="mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No events yet. Send a POST request to your webhook URL to test
                it!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell className="font-mono text-sm">
                        {format(new Date(event.created_at), "MMM d, h:mm:ss a")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.status_code === 200
                              ? "default"
                              : "destructive"
                          }
                        >
                          {event.status_code}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-sm text-gray-600">
                        {JSON.stringify(event.body).substring(0, 100)}...
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Event Detail Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Timestamp</h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedEvent.created_at), "PPpp")}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Method</h3>
                <Badge>{selectedEvent.method}</Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Status Code</h3>
                <Badge
                  variant={
                    selectedEvent.status_code === 200
                      ? "default"
                      : "destructive"
                  }
                >
                  {selectedEvent.status_code}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Body</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(selectedEvent.body, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headers</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(selectedEvent.headers, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Endpoint</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 py-4">
            Are you sure you want to delete <strong>{endpoint.name}</strong>?
            All webhook events will be permanently lost.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Endpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
