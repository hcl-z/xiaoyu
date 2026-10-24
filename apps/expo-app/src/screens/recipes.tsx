/**
 * 菜谱库：实时搜索、分段筛选、分类 chips；特写大卡 + 紧凑列表行。
 * 大图只在默认浏览态出现；一旦筛选，结果平铺，避免首个结果被莫名放大。
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { NavBar } from '@/chrome';
import { Icon } from '@/components/icon';
import { IconButton } from '@/components/button';
import { Pill } from '@/components/controls';
import { SearchField } from '@/components/inputs';
import { RemoteImage, useImageStatus } from '@/components/remote-image';
import { EmptyState, ListRow, Section, Skeleton } from '@/components/surfaces';
import { Body, Caption, Micro, Title } from '@/components/text';
import { useRecipes, useTaxonomies } from '@/data/store';
import type { Recipe } from '@/data/types';
import { relativeDayLabel } from '@/domain/date';
import { CrossFade, SwapIn } from '@/motion';
import { elevationStyle } from '@/theme';

import { useTabScreenPadding } from './layout-metrics';

export function RecipesScreen() {
  const router = useRouter();
  const { paddingTop, paddingBottom } = useTabScreenPadding();
  const { recipes, loading } = useRecipes();
  const { categories } = useTaxonomies();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('全部');

  /** 分类来自「我的 › 分类管理」；另有「全部」与「收藏」筛选项 */
  const filters = useMemo(() => ['全部', ...categories.map((c) => c.name), '收藏'], [categories]);
  /** 选中的分类被删除后，自动回落到「全部」 */
  const activeCat = filters.includes(cat) ? cat : '全部';

  const list = useMemo(() => {
    let out = [...recipes];
    if (activeCat === '收藏') out = out.filter((r) => r.favorite);
    else if (activeCat !== '全部') out = out.filter((r) => r.category === activeCat);

    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          // 冰箱里有菠菜，搜「菠菜」就应该能找到菜谱
          r.ingredients.some((g) => g.items.some((item) => item.name.toLowerCase().includes(q)))
      );
    }
    return out.sort((a, b) => b.cooked - a.cooked);
  }, [recipes, activeCat, query]);

  const browsing = !query.trim() && activeCat === '全部';
  const featured = browsing ? list[0] : undefined;
  const rows = browsing ? list.slice(1) : list;

  /**
   * 结果集的身份：筛选条件一变就算换了一批内容，列表要重新「落位」。
   * 带上长度，这样同一条件下增删菜谱（比如刚收藏了一本）也会重播错峰。
   */
  const resultKey = `${activeCat}\u0000${query.trim()}\u0000${list.length}`;

  return (
    <ScrollView
      className="bg-paper"
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop, paddingBottom }}
      showsVerticalScrollIndicator={false}>
      <NavBar
        variant="large"
        largeTitle="菜谱"
        subtitle={`${recipes.length} 道 · 按制作次数排序`}
        trailing={
          <IconButton
            name="plus"
            label="新建菜谱"
            size="lg"
            variant="fill"
            onPress={() => router.push('/recipes/new')}
          />
        }
      />

      <View className="mt-4" style={{ rowGap: 12 }}>
        <View className="px-5">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="搜菜名、标签或食材，如「菠菜」"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, columnGap: 8 }}>
          {filters.map((c) => (
            <Pill key={c} active={c === activeCat} onPress={() => setCat(c)}>
              {c}
            </Pill>
          ))}
        </ScrollView>
      </View>

      <View className="mt-5">
        <CrossFade
          loading={loading}
          skeleton={
            <View className="px-5" style={{ rowGap: 20 }}>
              <Skeleton className="h-44 w-full" rounded={18} />
              <Section>
                {[0, 1, 2].map((i) => (
                  <View key={i} className="flex-row items-center gap-3 px-4 py-3">
                    <Skeleton className="h-12 w-12" rounded={14} />
                    <View className="flex-1" style={{ rowGap: 6 }}>
                      <Skeleton className="h-3.5 w-28" rounded={4} />
                      <Skeleton className="h-2.5 w-40" rounded={4} />
                    </View>
                  </View>
                ))}
              </Section>
            </View>
          }>
          {list.length === 0 ? (
            <SwapIn swapKey={resultKey}>
              <View className="px-5">
                <Section>
                  <EmptyState
                    icon={<Icon name="search" size="xl" tone="accent" />}
                    title="没有匹配的菜谱"
                    description={
                      query.trim()
                        ? `没有找到与「${query.trim()}」相关的菜谱，菜名、标签与食材都试过了。`
                        : activeCat === '收藏'
                          ? '还没有收藏任何菜谱。'
                          : '这个分类下还是空的。'
                    }
                    action={
                      <View className="flex-row gap-2">
                        {query.trim() || activeCat !== '全部' ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="清除筛选"
                            onPress={() => {
                              setQuery('');
                              setCat('全部');
                            }}
                            className="bg-fill active:bg-fill-deep rounded-control h-8 flex-row items-center px-3">
                            <Body size="text-[13px]" weight="font-semibold">
                              清除筛选
                            </Body>
                          </Pressable>
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="新建菜谱"
                          onPress={() => router.push('/recipes/new')}
                          className="bg-indigo active:bg-indigo-deep rounded-control h-8 flex-row items-center px-3">
                          <Body size="text-[13px]" weight="font-semibold" tone="invert">
                            新建菜谱
                          </Body>
                        </Pressable>
                      </View>
                    }
                  />
                </Section>
              </View>
            </SwapIn>
          ) : (
            <SwapIn swapKey={resultKey}>
              <View style={{ rowGap: 20 }}>
                {featured ? (
                  <View className="px-5">
                    <FeaturedCard
                      recipe={featured}
                      onPress={() => router.push(`/recipes/${featured.slug}`)}
                    />
                  </View>
                ) : null}

                <View className="px-5">
                  <Section
                    title={browsing ? '全部菜谱' : activeCat === '全部' ? '搜索结果' : activeCat}
                    footer={`共 ${list.length} 道`}>
                    {rows.map((r, i) => (
                      <ListRow
                        key={r.slug}
                        staggerIndex={featured ? i + 1 : i}
                        staggerKey={resultKey}
                        onPress={() => router.push(`/recipes/${r.slug}`)}
                        leading={<RecipeThumb recipe={r} size={48} />}
                        title={
                          <View className="flex-row items-center gap-1.5">
                            <Body numberOfLines={1} className="shrink">
                              {r.title}
                            </Body>
                            {r.favorite ? (
                              <Icon name="heart" size="sm" tone="accent" fill="current" />
                            ) : null}
                          </View>
                        }
                        subtitle={`${r.category} · ${r.minutes} 分钟 · ${relativeDayLabel(r.lastCookedOn)}`}
                        value={r.cooked ? `${r.cooked} 次` : '未做'}
                        accessory="chevron"
                      />
                    ))}
                  </Section>
                </View>
              </View>
            </SwapIn>
          )}
        </CrossFade>
      </View>
    </ScrollView>
  );
}

function FeaturedCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const { hasPhoto, reportLoaded } = useImageStatus(recipe.image);
  /**
   * 图挂了就不能再按「照片」来排版：黑色蒙层压在半透明底上会糊成一块脏面，
   * 白字也没了着落。没有真图时退回浅色封面——撤掉蒙层，字换成墨色。
   */
  const label = [
    recipe.title,
    '做得最多',
    `${recipe.minutes} 分钟`,
    recipe.cooked ? `做过 ${recipe.cooked} 次` : null,
    recipe.favorite ? '已收藏' : null,
  ]
    .filter(Boolean)
    .join('，');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="rounded-group h-44 w-full overflow-hidden active:opacity-90"
      style={elevationStyle.card}>
      <RemoteImage
        src={recipe.image}
        style={{ width: '100%', height: '100%' }}
        onStatusChange={reportLoaded}
      />

      {hasPhoto ? (
        /* Web 用自下而上的黑色渐变；原生用两层递进的半透明面近似 */
        <>
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.16)' }} />
          <View
            className="absolute right-0 bottom-0 left-0"
            style={{ height: '55%', backgroundColor: 'rgba(0,0,0,0.34)' }}
          />
        </>
      ) : (
        /* 浅色封面：把书页图标挪到左上角，和右上角的收藏徽章站住两个角 */
        <View className="absolute top-4 left-4">
          <Icon name="book-open" size="xl" tone="accent" />
        </View>
      )}

      <View className="absolute right-0 bottom-0 left-0 p-4">
        <Micro tone={hasPhoto ? 'invert' : 'accent'}>做得最多</Micro>
        <View className="mt-1">
          <Title tone={hasPhoto ? 'invert' : 'ink'}>{recipe.title}</Title>
        </View>
        <View className="mt-1 flex-row items-center gap-3">
          <Fact icon="clock" text={`${recipe.minutes} 分钟`} tone={hasPhoto ? 'invert' : 'soft'} />
          <Caption size="text-caption" tone={hasPhoto ? 'invert' : 'soft'} tabular>
            {`做过 ${recipe.cooked} 次`}
          </Caption>
        </View>
      </View>

      {recipe.favorite ? (
        <View className="bg-card/85 absolute top-3 right-3 h-8 w-8 items-center justify-center rounded-full">
          <Icon name="heart" size="sm" tone="accent" fill="current" />
        </View>
      ) : null}
    </Pressable>
  );
}

function Fact({
  icon,
  text,
  tone = 'invert',
}: {
  icon: 'clock';
  text: string;
  tone?: 'invert' | 'soft';
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size="sm" tone={tone} />
      <Caption size="text-caption" tone={tone} tabular>
        {text}
      </Caption>
    </View>
  );
}

export function RecipeThumb({ recipe, size }: { recipe: Recipe; size: number }) {
  return (
    <RemoteImage
      src={recipe.image}
      style={{ width: size, height: size, borderRadius: 14 }}
      placeholder={<Icon name="book-open" size={size >= 48 ? 'md' : 'sm'} tone="accent" />}
    />
  );
}
