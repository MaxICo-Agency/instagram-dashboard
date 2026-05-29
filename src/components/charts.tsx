"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket, TrendPoint } from "@/lib/types";

const AXIS = "#6b6b82";
const GRID = "#23232f";
const BLUE = "#5b8cff";
const LIME = "#b8f700";

function shortDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}.${m}`;
}

const tooltipStyle = {
  background: "#14141d",
  border: "1px solid #2a2a3a",
  borderRadius: 10,
  color: "#f4f4f8",
  fontSize: 12,
};

export function TrendChart({ series }: { series: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.5} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LIME} stopOpacity={0.35} />
            <stop offset="100%" stopColor={LIME} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} stroke={AXIS} fontSize={11} tickMargin={8} minTickGap={24} />
        <YAxis stroke={AXIS} fontSize={11} width={48} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => shortDate(String(v))} />
        <Area type="monotone" dataKey="views" name="Перегляди" stroke={LIME} strokeWidth={2} fill="url(#gViews)" />
        <Area type="monotone" dataKey="reach" name="Охоплення" stroke={BLUE} strokeWidth={2} fill="url(#gReach)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BucketBars({ data }: { data: Bucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" stroke={AXIS} fontSize={11} tickMargin={6} />
        <YAxis stroke={AXIS} fontSize={11} width={40} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="value" name="%" fill={LIME} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
