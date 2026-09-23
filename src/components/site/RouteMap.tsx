"use client";

import { KIND_COLOR, ROUTES, type Route } from "@/lib/routes";

type NodeDef = { id: Route; x: number; y: number; w: number; h: number };

const W = 176;
const H = 76;

const NODES: NodeDef[] = [
  { id: "welcome", x: 24, y: 172, w: W, h: H },
  { id: "today", x: 274, y: 32, w: W, h: H },
  { id: "recipes", x: 274, y: 170, w: W, h: H },
  { id: "profile", x: 274, y: 308, w: W, h: H },
  { id: "recipe", x: 546, y: 54, w: W, h: H },
  { id: "newRecipe", x: 546, y: 170, w: W, h: H },
  { id: "checkin", x: 546, y: 308, w: W, h: H },
];

function Node({
  def,
  active,
  onSelect,
}: {
  def: NodeDef;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = ROUTES.find((r) => r.id === def.id)!;
  return (
    <g
      onClick={onSelect}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      <rect
        x={def.x}
        y={def.y}
        width={def.w}
        height={def.h}
        rx={18}
        fill={active ? "#EAF2FF" : "#FFFFFF"}
        stroke={active ? "#007AFF" : "#E5E5EA"}
        strokeWidth={active ? 2 : 1.4}
        className="transition-all duration-300"
      />
      <circle cx={def.x + 20} cy={def.y + 24} r={5} fill={KIND_COLOR[meta.kind]} />
      <text
        x={def.x + 34}
        y={def.y + 29}
        fill="#1C1C1E"
        fontSize="17"
        fontWeight="600"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {meta.name}
      </text>
      <text
        x={def.x + 20}
        y={def.y + 52}
        fill={active ? "#007AFF" : "#636366"}
        fontSize="12.5"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {meta.path}
      </text>
      <text
        x={def.x + 20}
        y={def.y + 68}
        fill="#636366"
        fontSize="10.5"
        style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.18em" }}
      >
        {meta.kind.toUpperCase()} · {meta.data.toUpperCase()}
      </text>
    </g>
  );
}

export function RouteMap({
  active,
  onSelect,
}: {
  active: Route;
  onSelect: (r: Route) => void;
}) {
  return (
    <div className="relative overflow-x-auto no-scrollbar">
      <svg viewBox="0 0 748 448" className="h-auto w-full min-w-[700px]" role="img" aria-label="daily + 页面路由与交互链路图">
        <defs>
          <marker id="ar" markerWidth="9" markerHeight="9" refX="7" refY="3.2" orient="auto">
            <path d="M0,0 L7,3.2 L0,6.4 Z" fill="#636366" />
          </marker>
          <marker id="ar-hot" markerWidth="9" markerHeight="9" refX="7" refY="3.2" orient="auto">
            <path d="M0,0 L7,3.2 L0,6.4 Z" fill="#007AFF" />
          </marker>
        </defs>

        <path d="M200 200 C 238 200, 236 70, 274 70" fill="none" stroke="#636366" strokeWidth="1.6" markerEnd="url(#ar)" />
        <text x="204" y="140" fontSize="11" fill="#636366" style={{ letterSpacing: "0.2em" }}>
          首次启动
        </text>

        <path d="M244 70 V 346" fill="none" stroke="#34C759" strokeWidth="1.6" strokeDasharray="1 6" strokeLinecap="round" />
        <path d="M244 70 H 274" stroke="#34C759" strokeWidth="1.6" markerEnd="url(#ar)" />
        <path d="M244 208 H 274" stroke="#34C759" strokeWidth="1.6" markerEnd="url(#ar)" />
        <path d="M244 346 H 274" stroke="#34C759" strokeWidth="1.6" markerEnd="url(#ar)" />
        <text x="238" y="400" fontSize="11" fill="#34C759" textAnchor="middle" style={{ letterSpacing: "0.24em" }}>
          TAB BAR
        </text>

        <path d="M450 200 C 498 200, 496 92, 546 92" fill="none" stroke="#007AFF" strokeWidth="1.8" markerEnd="url(#ar-hot)" />
        <path d="M450 208 H 546" fill="none" stroke="#007AFF" strokeWidth="1.8" markerEnd="url(#ar-hot)" />
        <text x="470" y="166" fontSize="11" fill="#007AFF" style={{ letterSpacing: "0.2em" }}>
          PUSH
        </text>

        <path d="M450 78 C 512 78, 486 346, 546 346" fill="none" stroke="#0062CC" strokeWidth="1.8" strokeDasharray="7 6" markerEnd="url(#ar)" />
        <path d="M634 130 V 308" fill="none" stroke="#0062CC" strokeWidth="1.8" strokeDasharray="7 6" markerEnd="url(#ar)" />
        <text x="644" y="228" fontSize="11" fill="#0062CC" style={{ letterSpacing: "0.2em" }}>
          MODAL
        </text>

        <path d="M634 384 C 634 434, 362 434, 352 384 V 108" fill="none" stroke="#34C759" strokeWidth="1.8" strokeDasharray="7 6" markerEnd="url(#ar)" />
        <text x="440" y="428" fontSize="11.5" fill="#34C759" style={{ letterSpacing: "0.16em" }}>
          POST /api/checkins 后回落 /today，列表 +1
        </text>

        {NODES.map((n) => (
          <Node key={n.id} def={n} active={active === n.id} onSelect={() => onSelect(n.id)} />
        ))}
      </svg>
    </div>
  );
}

export function RouteLegend() {
  const items = [
    { c: "#007AFF", t: "实线 · Push 横向推入", dash: false },
    { c: "#0062CC", t: "虚线 · Modal 弹层", dash: true },
    { c: "#34C759", t: "点线 · Tab 切换与回落", dash: true },
    { c: "#636366", t: "细线 · 启动流向", dash: false },
  ];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((i) => (
        <span key={i.t} className="flex items-center gap-2 text-[12px] text-muted">
          <svg width="26" height="8" aria-hidden>
            <path d="M0 4 H26" stroke={i.c} strokeWidth="1.8" strokeDasharray={i.dash ? "6 5" : undefined} />
          </svg>
          {i.t}
        </span>
      ))}
    </div>
  );
}
