"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, CheckCircle2, Link2, MessageCircle, Send, XCircle } from "lucide-react";

interface Stats {
  totalWebsites: number;
  activeWebsites: number;
  totalLinks: number;
  activeWhatsappLinks: number;
  activeTelegramLinks: number;
  inactiveLinks: number;
}

const STAT_CARDS: {
  key: keyof Stats;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "totalWebsites", label: "Total Websites", icon: Globe, color: "text-neutral-900" },
  { key: "activeWebsites", label: "Active Websites", icon: CheckCircle2, color: "text-green-600" },
  { key: "totalLinks", label: "Total Links", icon: Link2, color: "text-neutral-900" },
  { key: "activeWhatsappLinks", label: "Active WhatsApp Links", icon: MessageCircle, color: "text-green-600" },
  { key: "activeTelegramLinks", label: "Active Telegram Links", icon: Send, color: "text-blue-600" },
  { key: "inactiveLinks", label: "Inactive Links", icon: XCircle, color: "text-red-500" },
];

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          A snapshot of your websites and checkout links.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => {
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
  );
}
