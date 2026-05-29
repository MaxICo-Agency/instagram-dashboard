"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { Analytics, Bucket, FollowerDay } from "@/lib/types";

const AXIS = "#6b6b82";
const GRID = "#23232f";
const BLUE = "#5b8cff";
const LIME = "#b8f700";
const VIOLET = "#a78bfa";
const PINK = "#f472b6";

const tip = {
  background: "#14141d",
  border: "1px solid #2a2a3a",
  borderRadius: 10,
  color: "#f4f4f8",
  fontSize: 12,
};

const shortDate = (d: string) => {
  const p = d.split("-");
  return `${p[2]}.${p[1]}`;
};

export function ViewsTrend({ data }: { data: Analytics["viewsTrend"] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} stroke={AXIS} fontSize={11} minTickGap={28} />
        <YAxis stroke={AXIS} fontSize={11} width={44} />
        <Tooltip contentStyle={tip} labelFormatter={(v) => shortDate(String(v))} />
        <Line type="monotone" dataKey="views" name="Перегляди" stroke={BLUE} strokeWidth={1} dot={false} opacity={0.5} />
        <Line type="monotone" dataKey="ma" name="Сер. (5)" stroke={LIME} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HBars({
  data,
  color = LIME,
  height = 300,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 2, right: 12, left: 4, bottom: 2 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" stroke={AXIS} fontSize={11} />
        <YAxis type="category" dataKey="label" stroke={AXIS} fontSize={10} width={150} tickMargin={4} />
        <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="value" fill={color} radius={[0, 5, 5, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeekdayBars({ data }: { data: Analytics["weekday"] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" stroke={AXIS} fontSize={10} interval={0} tickMargin={6} />
        <YAxis stroke={AXIS} fontSize={11} width={44} />
        <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="avgViews" name="Сер. перегляди" radius={[5, 5, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.best ? LIME : "#3b3b52"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DistBars({ data }: { data: Bucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" stroke={AXIS} fontSize={10} tickMargin={6} />
        <YAxis stroke={AXIS} fontSize={11} width={36} allowDecimals={false} />
        <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="value" name="К-сть" fill={VIOLET} radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SavesShares({ data }: { data: Analytics["savesVsShares"] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 30 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" stroke={AXIS} fontSize={9} angle={-35} textAnchor="end" interval={0} height={50} />
        <YAxis stroke={AXIS} fontSize={11} width={44} />
        <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="saves" name="Збереження" fill={LIME} radius={[4, 4, 0, 0]} />
        <Bar dataKey="shares" name="Поширення" fill={BLUE} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrend({ data }: { data: Analytics["monthly"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" stroke={AXIS} fontSize={11} />
        <YAxis yAxisId="v" stroke={AXIS} fontSize={11} width={44} />
        <YAxis yAxisId="er" orientation="right" stroke={AXIS} fontSize={11} width={36} />
        <Tooltip contentStyle={tip} />
        <Line yAxisId="v" type="monotone" dataKey="avgViews" name="Сер. перегляди" stroke={BLUE} strokeWidth={2.5} dot={{ r: 3 }} />
        <Line yAxisId="er" type="monotone" dataKey="avgER" name="ER %" stroke={LIME} strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FollowerGrowth({ data }: { data: FollowerDay[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gFoll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} stroke={AXIS} fontSize={10} minTickGap={28} />
        <YAxis yAxisId="g" stroke={AXIS} fontSize={11} width={40} />
        <YAxis yAxisId="f" orientation="right" stroke={AXIS} fontSize={11} width={48} domain={["dataMin - 200", "dataMax + 200"]} />
        <Tooltip contentStyle={tip} labelFormatter={(v) => shortDate(String(v))} />
        <Bar yAxisId="g" dataKey="gained" name="Приріст/день" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.reelPublished ? LIME : "#3b3b52"} />
          ))}
        </Bar>
        <Area yAxisId="f" type="monotone" dataKey="followers" name="Підписники" stroke={BLUE} strokeWidth={2} fill="url(#gFoll)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function GainScatter({ data }: { data: Analytics["scatter"] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
        <CartesianGrid stroke={GRID} />
        <XAxis type="number" dataKey="views" name="Перегляди" stroke={AXIS} fontSize={11} width={44} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)} />
        <YAxis type="number" dataKey="gained" name="Приріст" stroke={AXIS} fontSize={11} width={40} />
        <ZAxis range={[60, 60]} />
        <Tooltip contentStyle={tip} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={data} fill={PINK} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function BucketBars({ data, color = LIME }: { data: Bucket[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" stroke={AXIS} fontSize={11} tickMargin={6} />
        <YAxis stroke={AXIS} fontSize={11} width={36} />
        <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="value" name="%" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
