"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe,
  CheckCircle2,
  Link2,
  MessageCircle,
  Send,
  XCircle,
  MousePointerClick,
  Radio,
  TrendingUp,
} from "lucide-react";

interface TopSite {
  websiteId: number;
  name: string;
  slug: string;
  clicks?: number;
  requests?: number;
}

interface Stats {
  totalWebsites: number;
  activeWebsites: number;
  totalLinks: number;
  activeWhatsappLinks: number;
  activeTelegramLinks: number;
  inactiveLinks: number;
  clicks: { total: number; last24h: number; last7d: number };
  requests: { total: number; last24h: number; last7d: number };
  topWebsitesByClicks: TopSite[];
  topWebsitesByRequests: TopSite[];
}

const OVERVIEW_CARDS: {
  key: keyof Pick<
    Stats,
    | "totalWebsites"
    | "activeWebsites"
    | "totalLinks"
    | "activeWhatsappLinks"
    | "activeTelegramLinks"
    | "inactiveLinks"
  >;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    key: "totalWebsites",
    label: "Total Websites",
    icon: Globe,
    color: "text-neutral-900",
  },
  {
    key: "activeWebsites",
    label: "Active Websites",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  {
    key: "totalLinks",
    label: "Total Links",
    icon: Link2,
    color: "text-neutral-900",
  },
  {
    key: "activeWhatsappLinks",
    label: "Active WhatsApp Links",
    icon: MessageCircle,
    color: "text-green-600",
  },
  {
    key: "activeTelegramLinks",
    label: "Active Telegram Links",
    icon: Send,
    color: "text-blue-600",
  },
  {
    key: "inactiveLinks",
    label: "Inactive Links",
    icon: XCircle,
    color: "text-red-500",
  },
];

function MetricBlock({
  label,
  total,
  last24h,
  last7d,
}: {
  label: string;
  total: number;
  last24h: number;
  last7d: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-3xl font-bold text-neutral-900">{total}</p>
      <div className="flex gap-4 text-sm text-neutral-500 mt-1">
        <span>
          <span className="font-semibold text-neutral-700">{last24h}</span>{" "}
          last 24 h
        </span>
        <span>
          <span className="font-semibold text-neutral-700">{last7d}</span>{" "}
          last 7 d
        </span>
      </div>
    </div>
  );
}

function TopList({
  title,
  icon: Icon,
  items,
  valueKey,
  valueLabel,
}: {
  title: string;
  icon: React.ElementType;
  items: TopSite[];
  valueKey: "clicks" | "requests";
  valueLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-3 flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </p>
        <p className="text-sm text-neutral-400">No data yet this week.</p>
      </div>
    );
  }

  const max = Math.max(...items.map((i) => i[valueKey] ?? 0), 1);

  return (
    <div>
      <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-3 flex items-center gap-1">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((site) => {
          const val = site[valueKey] ?? 0;
          const pct = Math.max(4, Math.round((val / max) * 100));
          return (
            <div key={site.websiteId} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-sm text-neutral-700 truncate">
                {site.name}
              </div>
              <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-neutral-800"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-10 text-right text-sm font-medium text-neutral-900">
                {val}
              </div>
              <div className="text-xs text-neutral-400 w-10">{valueLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.clicks && data.requests) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          A snapshot of your websites, links, and traffic.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Websites &amp; Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OVERVIEW_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-neutral-500">
                    {card.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neutral-900">
                    {loading || !stats ? "—" : stats[card.key]}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Traffic &amp; Engagement
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-1.5">
                <MousePointerClick className="h-4 w-4 text-violet-600" />
                Link Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading || !stats ? (
                <div className="text-2xl font-bold text-neutral-900">—</div>
              ) : (
                <MetricBlock
                  label=""
                  total={stats.clicks.total}
                  last24h={stats.clicks.last24h}
                  last7d={stats.clicks.last7d}
                />
              )}
              <p className="text-xs text-neutral-400 mt-3">
                Tracked via the{" "}
                <code className="bg-neutral-100 px-1 rounded">/api/r/</code>{" "}
                redirect endpoint.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-blue-600" />
                API Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading || !stats ? (
                <div className="text-2xl font-bold text-neutral-900">—</div>
              ) : (
                <MetricBlock
                  label=""
                  total={stats.requests.total}
                  last24h={stats.requests.last24h}
                  last7d={stats.requests.last7d}
                />
              )}
              <p className="text-xs text-neutral-400 mt-3">
                Cache misses — times a consumer site fetched fresh link data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {stats &&
        (stats.topWebsitesByClicks.length > 0 ||
          stats.topWebsitesByRequests.length > 0) && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              Top Sites — Last 7 Days
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-5">
                  <TopList
                    title="By Link Clicks"
                    icon={TrendingUp}
                    items={stats.topWebsitesByClicks}
                    valueKey="clicks"
                    valueLabel="clicks"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <TopList
                    title="By API Requests"
                    icon={Radio}
                    items={stats.topWebsitesByRequests}
                    valueKey="requests"
                    valueLabel="reqs"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
    </div>
  );
}
