"use client";

import { PhoneFrame } from "@/components/ds";
import { layout, radius } from "@/design/tokens";

/**
 * 展示台预览的是真实路由；无会话时应用只读取公共演示数据，
 * 不再静默登录或等待 Cookie，因此不会干扰登录/注册页面。
 */
export function DevicePreview({
  path,
  title,
  scale = 1,
  width = layout.phoneW,
  height = layout.phoneH,
}: {
  path: string;
  title: string;
  scale?: number;
  width?: number;
  height?: number;
}) {
  const bezel = 10;
  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{ width: (width + bezel * 2) * scale, height: (height + bezel * 2) * scale }}
    >
      <div className="origin-top-left" style={{ transform: `scale(${scale})` }}>
        <PhoneFrame>
          <iframe
            title={title}
            src={path}
            loading="lazy"
            className="block border-0 bg-paper"
            style={{ width, height, borderRadius: radius.screen }}
          />
        </PhoneFrame>
      </div>
    </div>
  );
}
