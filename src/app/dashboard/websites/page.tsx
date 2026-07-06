"use client";

import { useEffect, useMemo, useState } from "react";
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
import { WebsiteFormDialog } from "@/components/dashboard/website-form-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { Plus, Search, Pencil, Trash2, ExternalLink } from "lucide-react";
import type { Website, Link as LinkModel } from "@/db/schema";

type WebsiteWithLinks = Website & { links: LinkModel[] };

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<WebsiteWithLinks[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Website | null>(null);

  async function loadWebsites() {
    setLoading(true);
    try {
      const res = await fetch("/api/websites");
      const data = await res.json();
      setWebsites(data.websites || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWebsites();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return websites.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.slug.toLowerCase().includes(q) ||
        (w.domain || "").toLowerCase().includes(q)
    );
  }, [websites, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/websites/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Website deleted");
      setWebsites((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    } else {
      toast.error("Failed to delete website");
    }
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Websites</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage the websites that pull checkout links from this system.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingWebsite(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Website
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search websites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <Card className="py-8 text-center text-neutral-400">Loading...</Card>
      ) : filtered.length === 0 ? (
        <Card className="py-8 text-center text-neutral-400">No websites found.</Card>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((website) => (
              <Card key={website.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/websites/${website.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {website.name}
                  </Link>
                  <Badge variant={website.status === "active" ? "success" : "secondary"}>
                    {website.status}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-500 mt-1">/{website.slug}</p>
                {website.domain && (
                  <a
                    href={
                      website.domain.startsWith("http")
                        ? website.domain
                        : `https://${website.domain}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-500 hover:underline"
                  >
                    {website.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <p className="text-sm text-neutral-500 mt-1">
                  {website.links?.length ?? 0} link{website.links?.length === 1 ? "" : "s"}
                </p>
                <div className="flex justify-end gap-1 mt-2 border-t border-neutral-100 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingWebsite(website);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(website)}>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/websites/${website.id}`} className="hover:underline">
                        {website.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-neutral-500">{website.slug}</TableCell>
                    <TableCell className="text-neutral-500">
                      {website.domain ? (
                        <a
                          href={
                            website.domain.startsWith("http")
                              ? website.domain
                              : `https://${website.domain}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {website.domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-500">{website.links?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={website.status === "active" ? "success" : "secondary"}>
                        {website.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingWebsite(website);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(website)}
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

      <WebsiteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        website={editingWebsite}
        onSaved={loadWebsites}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete website?"
        description={`This will permanently delete "${deleteTarget?.name}" and all of its links. This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
