/**
 * 菜谱详情：图片头叠内容；食材 / 步骤 / 记录三标签。
 * 食材可逐条勾选，记录页聚合这道菜的每一次打卡与历次笔记。
 */
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavBar } from '@/chrome';
import { BottomActionBar } from '@/chrome/tabbar';
import { useCheckinSheet } from '@/chrome/checkin';
import { Button, IconButton } from '@/components/button';
import { CheckCircle, Segmented } from '@/components/controls';
import { Icon } from '@/components/icon';
import { RemoteImage } from '@/components/remote-image';
import { Badge, EmptyState, ListRow, Section, Skeleton } from '@/components/surfaces';
import { Body, Caption, Micro, Title } from '@/components/text';
import { resolveImageUrl } from '@/data/client';
import { useRecipeHistory, useRecipes } from '@/data/store';
import { dayLabel, relativeDayLabel, todayISO } from '@/domain/date';
import { useFadeSwap } from '@/motion';

type Tab = 'ing' | 'step' | 'log';

export function RecipeDetailScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openCheckin } = useCheckinSheet();

  const { recipes, loading, updateRecipe } = useRecipes();
  const recipe = recipes.find((r) => r.slug === slug);
  const history = useRecipeHistory(recipe?.slug);

  const [tab, setTab] = useState<Tab>('ing');
  const [checked, setChecked] = useState<number[]>([]);

  const flat = useMemo(() => (recipe ? recipe.ingredients.flatMap((g) => g.items) : []), [recipe]);
  /**
   * 只有还没到的安排才叫「已安排」。
   * 过期没确认的计划本来就还在那一天的时间轴上，不该继续以「已安排」的身份
   * 挂在详情页，更不该把日期更早的那条当成「下一次」。放在提前 return 之前，
   * 免得 hook 顺序随渲染分支变化。
   */
  const upcoming = useMemo(
    () =>
      history.planned
        .filter((p) => p.day >= todayISO())
        .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time)),
    [history.planned]
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/recipes');
  };

  const tabStyle = useFadeSwap(tab);

  if (loading && !recipe) {
    return (
      <View className="bg-paper flex-1 px-5" style={{ paddingTop: insets.top + 8, rowGap: 20 }}>
        <Skeleton className="h-60 w-full" rounded={18} />
        <Skeleton className="h-7 w-44" rounded={6} />
        <Skeleton className="h-3 w-56" rounded={4} />
        <Skeleton className="h-24 w-full" rounded={18} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="bg-paper flex-1" style={{ paddingTop: insets.top }}>
        <NavBar
          variant="compact"
          title="菜谱"
          onBack={() => router.replace('/recipes')}
          backLabel="菜谱"
        />
        <View className="px-5 py-10">
          <Section>
            <EmptyState
              icon={<Icon name="book-open" size="xl" tone="accent" />}
              title="这道菜不在了"
              description="它可能已被删除。"
              action={
                <Button size="sm" onPress={() => router.replace('/recipes')}>
                  返回菜谱库
                </Button>
              }
            />
          </Section>
        </View>
      </View>
    );
  }

  const toggleFavorite = () => {
    void updateRecipe(recipe.slug, { ...recipe, favorite: !recipe.favorite });
  };

  /** 只取有内容的笔记，最新的在前 */
  const notes = history.history.filter((h) => h.note.trim().length > 0);
  const imageUri = resolveImageUrl(recipe.image);

  return (
    <View className="bg-paper flex-1">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 + Math.max(insets.bottom, 16) }}
        showsVerticalScrollIndicator={false}>
        {/* 范式 B：图片上的透明紧凑导航条 */}
        <View>
          <View className="bg-fill h-60 w-full">
            <RemoteImage
              uri={imageUri}
              style={{ width: '100%', height: '100%' }}
              placeholder={<Icon name="book-open" size="xl" tone="accent" />}
            />
          </View>
          <View className="absolute top-0 right-0 left-0" style={{ paddingTop: insets.top }}>
            <NavBar
              variant="compact"
              transparent
              onBack={goBack}
              backLabel=""
              trailing={
                <>
                  <IconButton
                    name="heart"
                    label={recipe.favorite ? '取消收藏' : '收藏'}
                    variant="glass"
                    onPress={toggleFavorite}
                  />
                  <IconButton
                    name="pencil"
                    label="编辑菜谱"
                    variant="glass"
                    onPress={() => router.push(`/recipes/${recipe.slug}/edit`)}
                  />
                </>
              }
            />
          </View>
          <View
            className="absolute right-0 bottom-0 left-0"
            style={{ height: 64, backgroundColor: 'rgba(0,0,0,0.22)' }}
          />
        </View>

        <View className="bg-paper rounded-t-sheet -mt-4 px-5 pt-5" style={{ rowGap: 20 }}>
          <Section padded>
            <Micro tone="accent">{recipe.category}</Micro>
            <View className="mt-1.5">
              <Title>{recipe.title}</Title>
            </View>
            {recipe.subtitle ? (
              <Caption className="mt-1.5 leading-relaxed">{recipe.subtitle}</Caption>
            ) : null}
            {recipe.tags.length ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {recipe.tags.map((t) => (
                  <View key={t} className="border-hair bg-card rounded-full border px-2.5 py-1">
                    <Body tone="soft" size="text-[12px]" weight="font-medium">
                      {t}
                    </Body>
                  </View>
                ))}
              </View>
            ) : null}
          </Section>

          <Section padded>
            <View className="flex-row">
              <MetricFact icon="clock" value={recipe.minutes} unit="分钟" first />
              <MetricFact icon="check" value={recipe.cooked} unit="做过" />
            </View>
            <View className="border-hair mt-4 flex-row items-center justify-between gap-3 border-t pt-3.5">
              <Micro>{relativeDayLabel(recipe.lastCookedOn)}</Micro>
              {upcoming.length > 0 ? (
                <Badge tone="lake">
                  {`已安排 ${dayLabel(upcoming[0].day).replace(' · ', ' ')}`}
                </Badge>
              ) : null}
            </View>
          </Section>

          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'ing', label: `食材 ${flat.length}` },
              { value: 'step', label: `步骤 ${recipe.steps.length}` },
              { value: 'log', label: `记录 ${history.history.length}` },
            ]}
          />

          <Animated.View style={[tabStyle, { rowGap: 20 }]}>
            {tab === 'ing' ? (
              <View style={{ rowGap: 20 }}>
                {recipe.ingredients.map((group, gi) => {
                  const offset = recipe.ingredients
                    .slice(0, gi)
                    .reduce((s, g) => s + g.items.length, 0);
                  const groupChecked = group.items.filter((_, ii) =>
                    checked.includes(offset + ii)
                  ).length;
                  return (
                    <Section
                      key={group.group}
                      title={group.group}
                      footer={
                        groupChecked === group.items.length && group.items.length > 0
                          ? '这一组已备齐'
                          : undefined
                      }>
                      {group.items.map((item, ii) => {
                        const idx = offset + ii;
                        const on = checked.includes(idx);
                        return (
                          <ListRow
                            key={`${item.name}-${ii}`}
                            label={item.name}
                            leading={
                              <CheckCircle
                                done={on}
                                size={22}
                                label={item.name}
                                onPress={() =>
                                  setChecked((list) =>
                                    list.includes(idx)
                                      ? list.filter((x) => x !== idx)
                                      : [...list, idx]
                                  )
                                }
                              />
                            }
                            title={
                              <Body
                                numberOfLines={1}
                                tone={on ? 'muted' : 'ink'}
                                style={on ? { textDecorationLine: 'line-through' } : undefined}>
                                {item.name}
                              </Body>
                            }
                            value={
                              <Body tabular weight="font-medium" tone="muted" size="text-caption">
                                {item.amount}
                              </Body>
                            }
                            onPress={() =>
                              setChecked((list) =>
                                list.includes(idx) ? list.filter((x) => x !== idx) : [...list, idx]
                              )
                            }
                          />
                        );
                      })}
                    </Section>
                  );
                })}
              </View>
            ) : tab === 'step' ? (
              recipe.steps.length ? (
                <Section title="步骤" footer="按顺序完成即可">
                  {recipe.steps.map((step, i) => (
                    <ListRow
                      key={i}
                      leading={
                        <View className="bg-fill h-[22px] w-[22px] items-center justify-center rounded-full">
                          <Body tabular size="text-[12px]" weight="font-bold" tone="soft">
                            {String(i + 1)}
                          </Body>
                        </View>
                      }
                      title={
                        <Body className="leading-relaxed" style={{ flexShrink: 1 }}>
                          {step}
                        </Body>
                      }
                    />
                  ))}
                </Section>
              ) : (
                <Section>
                  <EmptyState
                    icon={<Icon name="book-open" size="xl" tone="accent" />}
                    title="还没有写步骤"
                    description="做一次之后补上，下次就能照着做。"
                    action={
                      <Button size="sm" onPress={() => router.push(`/recipes/${recipe.slug}/edit`)}>
                        去补充
                      </Button>
                    }
                  />
                </Section>
              )
            ) : (
              /* 记录页：做过的每一次，以及历次笔记。全部来自打卡数据 */
              <View style={{ rowGap: 20 }}>
                {upcoming.length > 0 ? (
                  <Section title="已安排" footer="到那天在「今日」确认，就计入制作次数">
                    {upcoming.map((item) => (
                      <ListRow
                        key={item.id}
                        leading={
                          <View className="h-[22px] w-[22px] items-center justify-center">
                            <Icon name="calendar-clock" size="md" tone="lake" />
                          </View>
                        }
                        title={dayLabel(item.day)}
                        subtitle={item.note || undefined}
                        accessory="chevron"
                        onPress={() => router.push(`/today?day=${item.day}`)}
                      />
                    ))}
                  </Section>
                ) : null}

                {notes.length > 0 ? (
                  <Section title="历次笔记" footer="打卡时写下的心得，最新的在前">
                    {notes.map((item) => (
                      <ListRow
                        key={item.id}
                        leading={
                          <View className="h-[22px] w-[22px] items-center justify-center">
                            <Icon name="notebook-pen" size="md" tone="accent" />
                          </View>
                        }
                        title={
                          <Body className="leading-relaxed" style={{ flexShrink: 1 }}>
                            {item.note}
                          </Body>
                        }
                        subtitle={dayLabel(item.day)}
                      />
                    ))}
                  </Section>
                ) : null}

                {history.loading ? (
                  <Section>
                    {[0, 1, 2].map((i) => (
                      <View key={i} className="flex-row items-center gap-3 px-4 py-3">
                        <Skeleton className="h-[22px] w-[22px]" rounded={11} />
                        <View className="flex-1" style={{ rowGap: 6 }}>
                          <Skeleton className="h-3.5 w-28" rounded={4} />
                          <Skeleton className="h-2.5 w-20" rounded={4} />
                        </View>
                      </View>
                    ))}
                  </Section>
                ) : history.history.length === 0 ? (
                  <Section>
                    <EmptyState
                      icon={<Icon name="check" size="xl" tone="accent" />}
                      title="还没做过这道菜"
                      description="做完点底部的「做好了」，每一次都会出现在这里。"
                      action={
                        <Button size="sm" onPress={() => openCheckin({ recipe: recipe.slug })}>
                          记第一笔
                        </Button>
                      }
                    />
                  </Section>
                ) : (
                  <Section
                    title="做过的记录"
                    footer={`共 ${history.history.length} 次 · 点击跳到那一天`}>
                    {history.history.map((item) => (
                      <ListRow
                        key={item.id}
                        label={`查看 ${item.day}`}
                        leading={<CheckCircle done size={22} />}
                        title={dayLabel(item.day)}
                        subtitle={item.time || undefined}
                        accessory="chevron"
                        onPress={() => router.push(`/today?day=${item.day}`)}
                      />
                    ))}
                  </Section>
                )}
              </View>
            )}
          </Animated.View>

          {tab === 'ing' && flat.length > 0 ? (
            <Caption className="text-center">
              {`已备 ${checked.length} / ${flat.length} 项`}
            </Caption>
          ) : null}
        </View>
      </ScrollView>

      <BottomActionBar
        caption={
          recipe.cooked > 0
            ? `${relativeDayLabel(recipe.lastCookedOn)} · 累计 ${recipe.cooked} 次`
            : '还没做过 · 做完记一笔，就会开始累计'
        }>
        <Button size="lg" block onPress={() => openCheckin({ recipe: recipe.slug })}>
          做好了，记一笔
        </Button>
      </BottomActionBar>
    </View>
  );
}

function MetricFact({
  icon,
  value,
  unit,
  first = false,
}: {
  icon: 'clock' | 'users' | 'check';
  value: number;
  unit: string;
  first?: boolean;
}) {
  return (
    <View className={`flex-1 items-center gap-1 px-2 ${first ? '' : 'border-hair border-l'}`}>
      <Icon name={icon} size="sm" tone="muted" />
      <Body tabular size="text-[22px]" weight="font-semibold">
        {String(value)}
      </Body>
      <Micro>{unit}</Micro>
    </View>
  );
}
