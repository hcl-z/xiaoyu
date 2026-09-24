"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Info, LogOut, Tags, UserRound } from "lucide-react";
import {
  Alert,
  Badge,
  Caption,
  Heatmap,
  HeatmapLegend,
  ListRow,
  Metric,
  Micro,
  NavBar,
  Section,
  Stat,
} from "@/components/ds";
import { useStats, useTaxonomies } from "@/lib/use-app-data";
import { useAppModals } from "@/components/app/AppModalProvider";
import { useSession } from "@/components/app/SessionProvider";
import { todayISO } from "@/lib/content";

export default function ProfilePage() {
  const router = useRouter();
  const { openTaxonomy } = useAppModals();
  const { stats, loading } = useStats();
  const { categories, tags, loading: taxonomiesLoading } = useTaxonomies();
  const { user, isDemo, signingOut, signOut } = useSession();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [about, setAbout] = useState(false);

  const heat = useMemo(() => stats.days.map((d) => d.count), [stats.days]);
  const heatDays = useMemo(() => stats.days.map((d) => d.day), [stats.days]);
  const monthActive = stats.totals.activeDays;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <NavBar variant="large" largeTitle="我的" subtitle={`已坚持记录 ${stats.streak} 天`} />

      <div className="px-5">
        <Section padded>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tint text-title font-bold text-indigo">
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-title font-bold text-ink">{user.name}</p>
                {isDemo ? <Badge tone="gray">演示账号</Badge> : null}
              </div>
              <Caption className="mt-0.5 block">
                {loading ? "统计中…" : `连续 ${stats.streak} 天 · 本月 ${monthActive} 天有记录`}
              </Caption>
            </div>
            <Badge tone="accent">
              <Metric as="span" className="text-[13px]">
                {stats.streak}
              </Metric>
              天
            </Badge>
          </div>
        </Section>
      </div>

      <div className="px-5">
        <Section
          title="最近 28 天"
          footer="轻点任意方格查看那天的记录"
          padded
        >
          {loading || heat.length === 0 ? (
            <Caption className="block py-6 text-center">统计加载中…</Caption>
          ) : (
            <>
              <Heatmap
                values={heat}
                days={heatDays}
                selected={todayISO()}
                onSelect={(day) => router.push(`/today?day=${day}`)}
              />
              <div className="mt-3 flex items-center justify-between border-t border-hair pt-3">
                <Caption>
                  {heat.filter((v) => v > 0).length} / {heat.length} 天有记录
                </Caption>
                <HeatmapLegend />
              </div>
            </>
          )}
        </Section>
      </div>

      <div className="px-5">
        <Section padded>
          <div className="grid grid-cols-3 divide-x divide-hair">
            <Stat value={stats.totals.checkins} label="累计记录" tone="accent" />
            <Stat value={stats.totals.recipes} label="菜谱" />
            <Stat value={stats.totals.favorites} label="收藏" tone="lake" />
          </div>
        </Section>
      </div>

      <div className="px-5">
        <Section title="内容管理" footer="分类与标签在菜谱编辑器和菜谱库筛选中通用">
          <ListRow
            leading={
              <span className="flex h-[22px] w-[22px] items-center justify-center text-indigo">
                <FolderTree size={17} />
              </span>
            }
            title="分类管理"
            subtitle="菜谱库顶部的筛选项"
            value={taxonomiesLoading ? undefined : `${categories.length} 个`}
            accessory="chevron"
            onClick={() => openTaxonomy("category")}
          />
          <ListRow
            leading={
              <span className="flex h-[22px] w-[22px] items-center justify-center text-indigo">
                <Tags size={17} />
              </span>
            }
            title="标签管理"
            subtitle="标记做法与场景，可多选"
            value={taxonomiesLoading ? undefined : `${tags.length} 个`}
            accessory="chevron"
            onClick={() => openTaxonomy("tag")}
          />
        </Section>
      </div>

      <div className="px-5">
        <Section title="关于">
          <ListRow
            leading={
              <span className="flex h-[22px] w-[22px] items-center justify-center text-indigo">
                <Info size={17} />
              </span>
            }
            title="关于 daily +"
            value="1.0.0"
            accessory="chevron"
            onClick={() => setAbout(true)}
          />
        </Section>
      </div>

      <div className="px-5">
        <Section
          title="账号"
          footer={isDemo ? "演示账号为公共数据，所有体验者都能看到" : "登录状态会在本设备保留 30 天"}
        >
          <ListRow
            leading={
              <span className="flex h-[22px] w-[22px] items-center justify-center text-indigo">
                <UserRound size={17} />
              </span>
            }
            title={user.name}
            subtitle={user.email}
          />
          <ListRow
            leading={
              <span className="flex h-[22px] w-[22px] items-center justify-center text-danger">
                <LogOut size={17} />
              </span>
            }
            title={signingOut ? "正在退出…" : "退出登录"}
            destructive
            onClick={() => setConfirmLogout(true)}
          />
        </Section>
      </div>

      <div className="px-5">
        <Micro className="block px-4 text-center">DAILY + 1.0.0 (24)</Micro>
      </div>

      <Alert
        open={about}
        title="daily +"
        message="菜谱管理与每日饮食打卡。随吃随记，不设固定餐次束缚。"
        cancelLabel="知道了"
        confirmLabel="查看系统"
        destructive={false}
        onCancel={() => setAbout(false)}
        onConfirm={() => {
          setAbout(false);
          window.open("/design-system", "_blank", "noopener");
        }}
      />

      <Alert
        open={confirmLogout}
        title="退出登录？"
        message="退出后需要重新登录，才能查看你的菜谱与饮食记录。"
        confirmLabel="退出"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void signOut();
        }}
      />
    </div>
  );
}
