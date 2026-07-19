"use client";

import { useEffect, useMemo, useState, use as usePromise } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LinkFormDialog } from "@/components/dashboard/link-form-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  ExternalLink as ExternalLinkIcon,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import type { Website, Link as LinkModel } from "@/db/schema";
import { Switch } from "@/components/ui/switch";

const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  signal: "Signal",
  messenger: "Messenger",
  instagram: "Instagram",
  discord: "Discord",
  other: "Other",
};

export default function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const [website, setWebsite] = useState<Website | null>(null);
  const [links, setLinks] = useState<LinkModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LinkModel | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/websites/${id}`);
      if (res.ok) {
        const data = await res.json();
        setWebsite(data.website);
        setLinks(data.website.links || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return links
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.platform.toLowerCase().includes(q)
      )
      .sort((a, b) => b.priority - a.priority);
  }, [links, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/links/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Link deleted");
      setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    } else {
      toast.error("Failed to delete link");
    }
    setDeleteTarget(null);
  }

  async function toggleStatus(link: LinkModel) {
    const newStatus = link.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, status: newStatus } : l))
      );
    } else {
      toast.error("Failed to update status");
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function forceSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/revalidate", { method: "POST" });
      if (res.ok) {
        toast.success("Production cache cleared — changes are live instantly.");
      } else {
        toast.error("Failed to clear cache");
      }
    } catch {
      toast.error("Failed to clear cache");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="text-neutral-400 py-12 text-center">Loading...</div>
    );
  }

  if (!website) {
    return (
      <div className="text-neutral-400 py-12 text-center">
        Website not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/websites"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to websites
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-900">
                {website.name}
              </h1>
              <Badge
                variant={website.status === "active" ? "success" : "secondary"}
              >
                {website.status}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              /{website.slug}{" "}
              {website.domain ? `· ${website.domain}` : ""}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={forceSync}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing…" : "Force Sync to Production"}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingLink(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4 bg-neutral-50 border-dashed">
        <p className="text-xs text-neutral-500 mb-1">Public API endpoint</p>
        <code className="text-sm text-neutral-800 break-all">
          GET /api/public/websites/{website.slug}/links
        </code>
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search links..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="py-8 text-center text-neutral-400">
          No links found.
        </Card>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((link) => (
              <Card key={link.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline">
                      {PLATFORM_LABELS[link.platform] || link.platform}
                    </Badge>
                    <p className="font-medium text-neutral-900 mt-1">
                      {link.name}
                    </p>
                  </div>
                  <Switch
                    checked={link.status === "active"}
                    onCheckedChange={() => toggleStatus(link)}
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-1 break-all">
                  {link.url}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  Priority: {link.priority}
                </p>
                <div className="flex justify-end gap-1 mt-2 border-t border-neutral-100 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyLink(link.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingLink(link);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(link)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {PLATFORM_LABELS[link.platform] || link.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell className="text-neutral-500 max-w-xs truncate">
                      {link.url}
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {link.priority}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={link.status === "active"}
                        onCheckedChange={() => toggleStatus(link)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyLink(link.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLinkIcon className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingLink(link);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(link)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <LinkFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        websiteId={website.id}
        link={editingLink}
        onSaved={loadData}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete link?"
        description={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
