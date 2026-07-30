"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Activity,
  Cpu,
  UserCheck
} from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { appThemes } from "@/lib/themes";
import { getFontClass } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface Summary {
  totalVisitors: number;
  totalVisits: number;
  avgVisits: number;
  returnRate: number;
}

interface DailyTrendItem {
  date: string;
  visits: number;
  visitors: number;
}

interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

interface RecentSession {
  deviceId: string;
  visitCount: number;
  lastVisitedAt: number;
  createdAt: number;
  ipAddress: string;
  os: string;
  browser: string;
  deviceType: string;
  country: string;
}

interface AnalyticsData {
  summary: Summary;
  dailyTrend: DailyTrendItem[];
  distributions: {
    os: DistributionItem[];
    browser: DistributionItem[];
    deviceType: DistributionItem[];
    country: DistributionItem[];
  };
  recentSessions: RecentSession[];
}

// Helper to get country flag emoji
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
};

// Helper for relative time formatting
const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Helper to format date
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function ThemeWrapper({ children, theme, fontClass }: { children: React.ReactNode, theme: any, fontClass: string }) {
  return (
    <div
      className={cn(
        "flex-1 min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-500 font-sans relative overflow-hidden",
        fontClass
      )}
      style={
        {
          "--background": theme.background,
          "--foreground": theme.foreground,
          "--muted": theme.muted,
          "--accent": theme.accent,
          "--accent-rgb": theme.accentRgb,
          "--chrome-surface": theme.mode === "dark"
            ? "rgba(14, 14, 18, 0.76)"
            : "rgba(255, 255, 255, 0.78)",
          "--chrome-surface-strong": theme.mode === "dark"
            ? "rgba(20, 20, 24, 0.92)"
            : "rgba(255, 255, 255, 0.9)",
          "--chrome-surface-soft": theme.mode === "dark"
            ? "rgba(24, 24, 28, 0.58)"
            : "rgba(255, 255, 255, 0.56)",
          "--chrome-border": theme.mode === "dark"
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(17, 17, 17, 0.08)",
          "--chrome-shadow": theme.mode === "dark"
            ? "0 28px 80px rgba(0, 0, 0, 0.4)"
            : "0 24px 60px rgba(17, 17, 17, 0.08)",
          "--chrome-shadow-hover": theme.mode === "dark"
            ? "0 32px 100px rgba(0, 0, 0, 0.5)"
            : "0 28px 80px rgba(17, 17, 17, 0.12)",
        } as React.CSSProperties
      }
    >
      {/* VisionOS ambient highlights */}
      <div className="absolute top-[-15%] left-[15%] right-[15%] h-[40%] bg-gradient-to-b from-[var(--accent)]/3 to-transparent rounded-full blur-[130px] pointer-events-none z-[0] opacity-80" />
      <div className="absolute bottom-[-15%] left-[25%] right-[25%] h-[35%] bg-gradient-to-t from-[var(--accent)]/3 to-transparent rounded-full blur-[110px] pointer-events-none z-[0] opacity-70" />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { appThemeId, fontFamily } = useAppStore();
  const theme = appThemes.find((t) => t.id === appThemeId) || appThemes[0];
  const fontClass = getFontClass(fontFamily);

  useEffect(() => {
    const root = document.documentElement;
    const isDarkTheme = theme.mode === "dark";
    root.classList.toggle("dark", isDarkTheme);
    root.dataset.theme = theme.id;
    root.style.colorScheme = isDarkTheme ? "dark" : "light";
  }, [theme.id, theme.mode]);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeType, setRangeType] = useState<"preset" | "custom">("preset");
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(14);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "recent">("overview");
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    yVisits: number;
    yVisitors: number;
    item: DailyTrendItem;
  } | null>(null);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const pastStr = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setCustomStart(pastStr);
    setCustomEnd(todayStr);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics");
      if (!res.ok) {
        throw new Error(`Failed to fetch analytics data: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/analytics");
        if (!res.ok) {
          throw new Error(`Failed to fetch analytics data: ${res.statusText}`);
        }
        const json = await res.json();
        if (active) {
          setData(json);
        }
      } catch (err: unknown) {
        console.error(err);
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load analytics");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <ThemeWrapper theme={theme} fontClass={fontClass}>
        <div className="flex flex-col items-center justify-center flex-1 text-center min-h-[400px] py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent)] mb-4" />
          <p className="text-[var(--muted)] animate-pulse">Analyzing visitor metrics...</p>
        </div>
      </ThemeWrapper>
    );
  }

  if (error || !data) {
    return (
      <ThemeWrapper theme={theme} fontClass={fontClass}>
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <div className="glass-panel p-8 rounded-2xl border-[var(--chrome-border)] text-center max-w-md mx-auto my-12">
            <Activity className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-bold mb-2">Error Loading Analytics</h3>
            <p className="text-[var(--muted)] text-sm mb-6">{error || "Something went wrong"}</p>
            <button
              onClick={fetchData}
              className="glass-panel glass-glow px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </ThemeWrapper>
    );
  }

  const { dailyTrend, recentSessions } = data;

  // Filter sessions (devices) active in the selected range
  const filteredDevices = recentSessions.filter((d) => {
    if (rangeType === "preset") {
      const cutoffTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;
      return d.lastVisitedAt >= cutoffTime;
    } else {
      const startMs = new Date(customStart + "T00:00:00").getTime();
      const endMs = new Date(customEnd + "T23:59:59").getTime();
      return d.lastVisitedAt >= startMs && d.lastVisitedAt <= endMs;
    }
  });

  // Dynamically compute KPIs
  const totalVisitors = filteredDevices.length;
  let totalVisits = 0;
  let returningVisitors = 0;

  const osCount: Record<string, number> = {};
  const browserCount: Record<string, number> = {};
  const deviceTypeCount: Record<string, number> = {};
  const countryCount: Record<string, number> = {};

  for (const d of filteredDevices) {
    totalVisits += d.visitCount || 1;
    if ((d.visitCount || 1) > 1) {
      returningVisitors++;
    }
    const os = d.os || "Unknown";
    osCount[os] = (osCount[os] || 0) + 1;
    const browser = d.browser || "Unknown";
    browserCount[browser] = (browserCount[browser] || 0) + 1;
    const deviceType = d.deviceType || "desktop";
    deviceTypeCount[deviceType] = (deviceTypeCount[deviceType] || 0) + 1;
    const country = d.country || "Unknown";
    countryCount[country] = (countryCount[country] || 0) + 1;
  }

  const avgVisits = totalVisitors > 0 ? Number((totalVisits / totalVisitors).toFixed(1)) : 0;
  const returnRate = totalVisitors > 0 ? Number(((returningVisitors / totalVisitors) * 100).toFixed(1)) : 0;

  const mapToPercentArray = (counts: Record<string, number>, total: number) => {
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const currentDistributions = {
    os: mapToPercentArray(osCount, totalVisitors),
    browser: mapToPercentArray(browserCount, totalVisitors),
    deviceType: mapToPercentArray(deviceTypeCount, totalVisitors),
    country: mapToPercentArray(countryCount, totalVisitors),
  };

  // Filter daily trend based on range
  const filteredDailyTrend = dailyTrend.filter((item) => {
    if (rangeType === "preset") {
      const cutoffStr = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return item.date >= cutoffStr;
    } else {
      return item.date >= customStart && item.date <= customEnd;
    }
  });

  // Filter sessions based on search query
  const filteredSessions = filteredDevices.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.ipAddress.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.os.toLowerCase().includes(q) ||
      s.browser.toLowerCase().includes(q) ||
      s.deviceId.toLowerCase().includes(q)
    );
  });

  // Calculate coordinates for SVG line chart
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 20;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  const maxVal = Math.max(
    ...filteredDailyTrend.map((d) => Math.max(d.visits, d.visitors)),
    10 // Fallback minimum scale
  );
  const yMax = Math.ceil(maxVal * 1.15); // Add top padding

  const points = filteredDailyTrend.map((d, i) => {
    const x = paddingX + (i / (filteredDailyTrend.length - 1)) * graphWidth;
    const yVisits = paddingY + graphHeight - (d.visits / yMax) * graphHeight;
    const yVisitors = paddingY + graphHeight - (d.visitors / yMax) * graphHeight;
    return { x, yVisits, yVisitors, item: d, index: i };
  });

  // Build SVG path commands
  const visitsPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yVisits}`).join(" ");
  const visitorsPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yVisitors}`).join(" ");

  const visitsArea = `${visitsPath} L ${points[points.length - 1].x} ${paddingY + graphHeight} L ${points[0].x} ${paddingY + graphHeight} Z`;

  const visitorsAreaActual = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yVisitors}`).join(" ") +
    ` L ${points[points.length - 1].x} ${paddingY + graphHeight} L ${points[0].x} ${paddingY + graphHeight} Z`;

  // Handle SVG Mouse Move for Tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * svgWidth;

    // Find nearest point
    let nearestPoint = points[0];
    let minDist = Math.abs(points[0].x - relativeX);

    for (const p of points) {
      const dist = Math.abs(p.x - relativeX);
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = p;
      }
    }

    if (nearestPoint) {
      setHoveredPoint({
        index: nearestPoint.index,
        x: nearestPoint.x,
        yVisits: nearestPoint.yVisits,
        yVisitors: nearestPoint.yVisitors,
        item: nearestPoint.item,
      });
    }
  };

  return (
    <ThemeWrapper theme={theme} fontClass={fontClass}>
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[var(--muted)] hover:text-[var(--foreground)] text-sm mb-2 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Typing Test
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight font-sans">
              Device Analytics
            </h1>
            <p className="text-[var(--muted)] text-sm mt-1">
              Real-time traffic and hardware configurations visiting Thock
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
            {rangeType === "custom" && (
              <div className="flex items-center gap-2 glass-panel p-1.5 rounded-xl border-[var(--chrome-border)]">
                <span className="text-[10px] text-[var(--muted)] font-semibold uppercase px-1">Range:</span>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] rounded-lg px-2 py-0.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]/50 transition-colors"
                />
                <span className="text-[10px] text-[var(--muted)]">to</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] rounded-lg px-2 py-0.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]/50 transition-colors"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="glass-panel glass-glow p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer h-[34px] flex items-center justify-center"
                title="Refresh analytics data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <div className="glass-panel p-1 rounded-xl flex gap-1 text-xs font-semibold h-[34px] items-center">
                {[7, 14, 30].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setRangeType("preset");
                      setTimeRange(range as 7 | 14 | 30);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      rangeType === "preset" && timeRange === range
                        ? "bg-[var(--accent)] text-[var(--background)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {range}d
                  </button>
                ))}
                <button
                  onClick={() => setRangeType("custom")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    rangeType === "custom"
                      ? "bg-[var(--accent)] text-[var(--background)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Visits",
              value: totalVisits.toLocaleString(),
              desc: "Aggregate site views",
              icon: Activity,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Unique Devices",
              value: totalVisitors.toLocaleString(),
              desc: "Identified device hardware",
              icon: Cpu,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Avg. Views/Device",
              value: avgVisits.toFixed(1),
              desc: "Frequency index",
              icon: Clock,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              label: "Return Rate",
              value: `${returnRate}%`,
              desc: "Devices visited > 1 times",
              icon: UserCheck,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
          ].map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="glass-panel p-5 rounded-2xl border-[var(--chrome-border)] hover:border-[var(--accent)]/30 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[var(--muted)] text-xs font-medium uppercase tracking-wider block">
                      {card.label}
                    </span>
                    <span className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1.5 block">
                      {card.value}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[var(--muted)] text-[11px] mt-3 block opacity-80">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--chrome-border)] mb-6 flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
              activeTab === "overview"
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Overview & Trends
            {activeTab === "overview" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
              activeTab === "recent"
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Session Log ({filteredSessions.length})
            {activeTab === "recent" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
            )}
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Main Chart Card */}
            <div className="glass-panel p-6 rounded-2xl border-[var(--chrome-border)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg font-sans">Traffic Overview</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Daily comparison of unique devices versus total page visits
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 bg-[var(--accent)] rounded-full inline-block" />
                    Visits
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 bg-[var(--muted)] rounded-full inline-block" />
                    Unique Visitors
                  </span>
                </div>
              </div>

              {/* SVG Line/Area Chart */}
              <div className="relative">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto overflow-visible select-none"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    {/* Visits Gradient */}
                    <linearGradient id="visits-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                    </linearGradient>
                    {/* Visitors Gradient */}
                    <linearGradient id="visitors-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8e8e93" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#8e8e93" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + ratio * graphHeight;
                    const labelVal = Math.round(yMax * (1 - ratio));
                    return (
                      <g key={idx} className="opacity-40">
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={svgWidth - paddingX}
                          y2={y}
                          stroke="var(--chrome-border)"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="9"
                          fill="var(--muted)"
                          className="font-mono font-medium"
                        >
                          {labelVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Date Grid Lines (X-Axis) */}
                  {filteredDailyTrend.map((d, i) => {
                    if (
                      filteredDailyTrend.length > 15
                        ? i % Math.ceil(filteredDailyTrend.length / 5) === 0
                        : i % 2 === 0
                    ) {
                      const x = paddingX + (i / (filteredDailyTrend.length - 1)) * graphWidth;
                      const dateObj = new Date(d.date + "T00:00:00");
                      const formattedDate = dateObj.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <g key={i} className="opacity-40">
                          <line
                            x1={x}
                            y1={paddingY}
                            x2={x}
                            y2={paddingY + graphHeight}
                            stroke="var(--chrome-border)"
                            strokeWidth="0.8"
                          />
                          <text
                            x={x}
                            y={paddingY + graphHeight + 14}
                            textAnchor="middle"
                            fontSize="9"
                            fill="var(--muted)"
                          >
                            {formattedDate}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}

                  {/* Shaded Area Fills */}
                  <path d={visitsArea} fill="url(#visits-grad)" />
                  <path d={visitorsAreaActual} fill="url(#visitors-grad)" />

                  {/* Stroke Lines */}
                  <path
                    d={visitsPath}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={visitorsPath}
                    fill="none"
                    stroke="#8e8e93"
                    strokeWidth="1.8"
                    strokeDasharray="1 1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-75"
                  />

                  {/* Interactive Hover Line and Points */}
                  {hoveredPoint && (
                    <g>
                      <line
                        x1={hoveredPoint.x}
                        y1={paddingY}
                        x2={hoveredPoint.x}
                        y2={paddingY + graphHeight}
                        stroke="var(--accent)"
                        strokeWidth="1.5"
                        opacity="0.3"
                      />

                      {/* Visits Node */}
                      <circle
                        cx={hoveredPoint.x}
                        cy={hoveredPoint.yVisits}
                        r="4.5"
                        fill="var(--accent)"
                        stroke="var(--background)"
                        strokeWidth="1.5"
                      />

                      {/* Visitors Node */}
                      <circle
                        cx={hoveredPoint.x}
                        cy={hoveredPoint.yVisitors}
                        r="4.5"
                        fill="#8e8e93"
                        stroke="var(--background)"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </svg>

                {/* Tooltip Popup */}
                {hoveredPoint && (
                  <div
                    className="absolute pointer-events-none glass-panel p-2.5 rounded-xl border-[var(--chrome-border)] shadow-xl text-xs font-sans z-10"
                    style={{
                      left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                      top: `${Math.min(hoveredPoint.yVisits, hoveredPoint.yVisitors) - 45}px`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <p className="font-semibold text-[var(--muted)] mb-1 text-[10px]">
                      {new Date(hoveredPoint.item.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                        Visits: {hoveredPoint.item.visits}
                      </span>
                      <span className="flex items-center gap-1.5 text-[var(--muted)]">
                        <span className="w-2 h-2 rounded-full bg-[#8e8e93]" />
                        Unique: {hoveredPoint.item.visitors}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Breakdown Distributions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Countries Card */}
              <div className="glass-panel p-6 rounded-2xl border-[var(--chrome-border)] flex flex-col">
                <h3 className="font-bold text-base font-sans mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--muted)]" /> Geolocation
                </h3>
                <div className="space-y-3.5 flex-1 overflow-auto max-h-[300px] pr-1">
                  {currentDistributions.country.length === 0 ? (
                    <p className="text-xs text-[var(--muted)] text-center py-8">No geo data</p>
                  ) : (
                    currentDistributions.country.map((c, i) => (
                      <div key={i} className="relative py-1">
                        {/* Visual progress bar as background */}
                        <div
                          className="absolute inset-0 bg-[var(--accent)]/5 rounded-lg"
                          style={{ width: `${c.percentage}%` }}
                        />
                        <div className="flex justify-between items-center text-xs relative z-10 px-2.5">
                          <span className="font-semibold flex items-center gap-2">
                            <span className="text-base">{getFlagEmoji(c.name)}</span>
                            {c.name}
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold">{c.count}</span>
                            <span className="text-[var(--muted)] text-[10px] font-normal">
                              ({c.percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Browsers Card */}
              <div className="glass-panel p-6 rounded-2xl border-[var(--chrome-border)] flex flex-col">
                <h3 className="font-bold text-base font-sans mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--muted)]" /> Browsers
                </h3>
                <div className="space-y-3.5 flex-1 pr-1">
                  {currentDistributions.browser.length === 0 ? (
                    <p className="text-xs text-[var(--muted)] text-center py-8">No browser data</p>
                  ) : (
                    currentDistributions.browser.slice(0, 5).map((b, i) => (
                      <div key={i} className="text-xs space-y-1">
                        <div className="flex justify-between items-center px-1">
                          <span className="font-semibold">{b.name}</span>
                          <span className="font-mono text-[var(--muted)] font-bold">
                            {b.count} <span className="font-normal text-[10px]">({b.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-[var(--chrome-surface-soft)] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--accent)] h-full rounded-full"
                            style={{ width: `${b.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Operating Systems Card */}
              <div className="glass-panel p-6 rounded-2xl border-[var(--chrome-border)] flex flex-col">
                <h3 className="font-bold text-base font-sans mb-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[var(--muted)]" /> Operating Systems
                </h3>
                <div className="space-y-3.5 flex-1 pr-1">
                  {currentDistributions.os.length === 0 ? (
                    <p className="text-xs text-[var(--muted)] text-center py-8">No OS data</p>
                  ) : (
                    currentDistributions.os.slice(0, 5).map((os, i) => (
                      <div key={i} className="text-xs space-y-1">
                        <div className="flex justify-between items-center px-1">
                          <span className="font-semibold">{os.name}</span>
                          <span className="font-mono text-[var(--muted)] font-bold">
                            {os.count} <span className="font-normal text-[10px]">({os.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-[var(--chrome-surface-soft)] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--accent)] h-full rounded-full"
                            style={{ width: `${os.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "recent" && (
          <div className="glass-panel rounded-2xl border-[var(--chrome-border)] overflow-hidden">
            {/* Search bar */}
            <div className="p-4 border-b border-[var(--chrome-border)] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search country, IP, OS, browser..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] rounded-xl text-xs placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                />
              </div>
              <span className="text-xs text-[var(--muted)] font-mono font-medium">
                Showing {filteredSessions.length} of {recentSessions.length} recent devices
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--chrome-surface-soft)]/50 text-[var(--muted)] border-b border-[var(--chrome-border)] uppercase tracking-wider font-semibold text-[10px]">
                    <th className="p-4">Anonymized IP</th>
                    <th className="p-4">Origin</th>
                    <th className="p-4">System Details</th>
                    <th className="p-4">Device</th>
                    <th className="p-4 font-mono text-center">Visits</th>
                    <th className="p-4">First Visited</th>
                    <th className="p-4">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--chrome-border)] font-medium">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--muted)]">
                        No matching visitor sessions found.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session, i) => {
                      return (
                        <tr key={i} className="hover:bg-[var(--chrome-surface-soft)]/30 transition-colors">
                          <td className="p-4 font-mono font-semibold text-[var(--accent)]">
                            {session.ipAddress}
                          </td>
                          <td className="p-4">
                            <span className="flex items-center gap-1.5">
                              <span className="text-base">{getFlagEmoji(session.country)}</span>
                              <span>{session.country}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-semibold">{session.browser}</span>
                              <span className="text-[10px] text-[var(--muted)] font-normal">on {session.os}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 bg-[var(--chrome-surface-soft)] border border-[var(--chrome-border)] px-2 py-0.5 rounded-md text-[10px] capitalize">
                              {session.deviceType === "mobile" ? (
                                <Smartphone className="w-3 h-3 text-[var(--muted)]" />
                              ) : session.deviceType === "tablet" ? (
                                <Tablet className="w-3 h-3 text-[var(--muted)]" />
                              ) : (
                                <Monitor className="w-3 h-3 text-[var(--muted)]" />
                              )}
                              {session.deviceType}
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-sm">
                            {session.visitCount}
                          </td>
                          <td className="p-4 text-[var(--muted)] font-normal">
                            {formatDate(session.createdAt)}
                          </td>
                          <td className="p-4 font-semibold">
                            <div className="flex flex-col">
                              <span>{formatRelativeTime(session.lastVisitedAt)}</span>
                              <span className="text-[9px] text-[var(--muted)] font-mono font-normal">
                                {new Date(session.lastVisitedAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ThemeWrapper>
  );
}
