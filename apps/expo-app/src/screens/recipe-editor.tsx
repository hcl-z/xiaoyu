/**
 * 菜谱编辑器：新建与编辑共用同一份表单与校验。
 * 应用内以全屏弹窗打开，左上叉号取消、右上对勾完成，名称为空时完成置灰。
 */
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CoverField } from '@/chrome/cover-field';
import { Alert, SuccessOverlay, TaskScreen } from '@/chrome/overlays';
import { Button, IconButton } from '@/components/button';
import { Pill, Stepper } from '@/components/controls';
import { Icon } from '@/components/icon';
import { FieldError, FormGroup, FormRow, TextArea, TextField } from '@/components/inputs';
import { EmptyState, ListRow, Section, Skeleton } from '@/components/surfaces';
import { Body, Caption, Micro } from '@/components/text';
import { useRecipes, useTaxonomies, type RecipeSave } from '@/data/store';
import type { Recipe } from '@/data/types';

/** 保存结果的显式状态：写失败要看得见，也要能原地重试 */
type SaveResult = { tone: 'success' | 'failure'; title: string; caption?: string };

type Item = { name: string; amount: string };
type Group = { group: string; items: Item[] };

/** 保证当前值始终可见，即使它已被从分类/标签库中删除 */
function withCurrent(options: string[], current: string[]): string[] {
  const extra = current.filter((v) => v && !options.includes(v));
  return [...options, ...extra];
}

/**
 * 表单快照：进来时的样子和此刻的样子都按同一套规则整理，
 * 再比字符串——用来判断关闭前要不要拦一下。
 */
function snapshot(v: {
  title: string;
  subtitle: string;
  category: string;
  minutes: number;
  tags: string[];
  groups: Group[];
  steps: string[];
  image: string;
}) {
  return JSON.stringify([
    v.title.trim(),
    v.subtitle.trim(),
    v.category,
    v.minutes,
    v.tags,
    v.groups.map((g) => ({
      group: g.group.trim(),
      items: g.items.map((item) => ({ name: item.name.trim(), amount: item.amount.trim() })),
    })),
    v.steps.map((step) => step.trim()),
    v.image,
  ]);
}

export function RecipeEditorScreen({ mode }: { mode: 'new' | 'edit' }) {
  const params = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { categories, tags: tagLibrary, addTaxonomy } = useTaxonomies();

  const recipe = mode === 'edit' ? recipes.find((r) => r.slug === params.slug) : undefined;
  const heading = mode === 'edit' ? '编辑菜谱' : '新建菜谱';

  if (mode === 'edit' && loading && !recipe) {
    return (
      <TaskScreen title={heading} onClose={() => router.back()}>
        <View className="px-5 pt-5" style={{ rowGap: 20 }}>
          <Skeleton className="h-24 w-full" rounded={18} />
          <Skeleton className="h-40 w-full" rounded={18} />
          <Skeleton className="h-32 w-full" rounded={18} />
        </View>
      </TaskScreen>
    );
  }

  if (mode === 'edit' && !recipe) {
    return (
      <TaskScreen title={heading} onClose={() => router.back()}>
        <View className="px-5 py-10">
          <Section>
            <EmptyState
              icon={<Icon name="book-open" size="xl" tone="accent" />}
              title="找不到这道菜谱"
              description="它可能已经被删除。"
              action={
                <Button size="sm" onPress={() => router.replace('/recipes')}>
                  返回菜谱库
                </Button>
              }
            />
          </Section>
        </View>
      </TaskScreen>
    );
  }

  return (
    <RecipeEditorForm
      // 换目标时重建表单状态，避免把上一道菜的草稿带过来
      key={recipe?.slug ?? 'new'}
      mode={mode}
      recipe={recipe}
      heading={heading}
      categories={categories.map((c) => c.name)}
      tagLibrary={tagLibrary.map((t) => t.name)}
      addTaxonomy={addTaxonomy}
      addRecipe={addRecipe}
      updateRecipe={updateRecipe}
      deleteRecipe={deleteRecipe}
      onClose={() => router.back()}
      onCreated={(slug) => router.replace(`/recipes/${slug}`)}
      onDeleted={() => router.replace('/recipes')}
    />
  );
}

function RecipeEditorForm({
  mode,
  recipe,
  heading,
  categories,
  tagLibrary,
  addTaxonomy,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  onClose,
  onCreated,
  onDeleted,
}: {
  mode: 'new' | 'edit';
  recipe?: Recipe;
  heading: string;
  categories: string[];
  tagLibrary: string[];
  addTaxonomy: (kind: 'tag', name: string) => Promise<{ ok: boolean; error?: string }>;
  addRecipe: (draft: Recipe) => Promise<RecipeSave>;
  updateRecipe: (slug: string, draft: Recipe) => Promise<RecipeSave>;
  deleteRecipe: (slug: string) => Promise<void>;
  onClose: () => void;
  onCreated: (slug: string) => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(recipe?.title ?? '');
  /**
   * 标题是不是被“碰过”（失焦或非空）。
   * 没有它就只能在空表单上顶着一条报错，而用户什么都还没做。
   */
  const [titleTouched, setTitleTouched] = useState(false);
  const [subtitle, setSubtitle] = useState(recipe?.subtitle ?? '');
  const [category, setCategory] = useState<string>(recipe?.category ?? '');
  const [minutes, setMinutes] = useState(recipe?.minutes ?? 20);
  /** 人份已从界面移除；保存时原样带回，别把服务端已有的值抹成默认 */
  const [servings] = useState(recipe?.servings ?? 2);
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [groups, setGroups] = useState<Group[]>(
    recipe?.ingredients.length
      ? recipe.ingredients.map((g) => ({ group: g.group, items: [...g.items] }))
      : [{ group: '主料', items: [{ name: '', amount: '' }] }]
  );
  const [steps, setSteps] = useState<string[]>(recipe?.steps.length ? [...recipe.steps] : ['']);
  /** 封面图：站内相对路径（/api/photos/<id>），空串表示没设 */
  const [image, setImage] = useState(recipe?.image ?? '');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const [composingTag, setComposingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [tagError, setTagError] = useState('');

  const categoryOptions = useMemo(
    () => withCurrent(categories, [category]),
    [categories, category]
  );
  /** 新建时若未选择，默认落在分类库的第一项（无副作用，纯派生） */
  const activeCategory = category || categoryOptions[0] || '';
  const tagOptions = useMemo(() => withCurrent(tagLibrary, tags), [tagLibrary, tags]);
  const valid = title.trim().length > 0;

  /** 进来时的样子；只有它和此刻不同，关闭才需要问一句 */
  const base = useMemo(
    () =>
      snapshot({
        title: recipe?.title ?? '',
        subtitle: recipe?.subtitle ?? '',
        category: recipe?.category ?? '',
        minutes: recipe?.minutes ?? 20,
        tags: recipe?.tags ?? [],
        groups: recipe?.ingredients.length
          ? recipe.ingredients.map((g) => ({ group: g.group, items: [...g.items] }))
          : [{ group: '主料', items: [{ name: '', amount: '' }] }],
        steps: recipe?.steps.length ? [...recipe.steps] : [''],
        image: recipe?.image ?? '',
      }),
    [recipe]
  );
  const dirty =
    snapshot({ title, subtitle, category, minutes, tags, groups, steps, image }) !== base;

  /** 关闭前的最后一道闸：草稿没保存就退出，先让人知道 */
  const requestClose = () => {
    if (dirty && result?.tone !== 'success') setConfirmDiscard(true);
    else onClose();
  };

  /** 新建标签：已存在则直接选中，不报错打断录入 */
  const commitTag = async () => {
    const value = tagDraft.trim();
    if (!value || addingTag) return;

    if (tagOptions.includes(value)) {
      setTags((list) => (list.includes(value) ? list : [...list, value]));
      setTagDraft('');
      setComposingTag(false);
      setTagError('');
      return;
    }

    setAddingTag(true);
    setTagError('');
    const res = await addTaxonomy('tag', value);
    setAddingTag(false);
    if (res.ok) {
      setTags((list) => (list.includes(value) ? list : [...list, value]));
      setTagDraft('');
      setComposingTag(false);
    } else {
      setTagError(res.error ?? '添加失败');
    }
  };

  const setItem = (gi: number, ii: number, patch: Partial<Item>) =>
    setGroups((list) =>
      list.map((g, i) =>
        i === gi
          ? { ...g, items: g.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
          : g
      )
    );

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const draft: Recipe = {
      slug: recipe?.slug ?? `custom-${Date.now().toString(36)}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: activeCategory,
      minutes,
      servings,
      image,
      favorite: recipe?.favorite ?? false,
      cooked: recipe?.cooked ?? 0,
      tags,
      ingredients: groups
        .map((g) => ({
          group: g.group.trim() || '食材',
          items: g.items
            .filter((it) => it.name.trim())
            .map((it) => ({ name: it.name.trim(), amount: it.amount.trim() || '适量' })),
        }))
        .filter((g) => g.items.length > 0),
      steps: steps.map((s) => s.trim()).filter(Boolean),
    };

    const res =
      mode === 'edit' && recipe ? await updateRecipe(recipe.slug, draft) : await addRecipe(draft);
    setSaving(false);

    /** 没存下就停在原地，草稿都还在，改完再点一次即可 */
    if (res.error) {
      setResult({ tone: 'failure', title: '保存失败', caption: res.error });
      setTimeout(() => setResult(null), 1800);
      return;
    }

    setResult({ tone: 'success', title: mode === 'edit' ? '已保存' : '已新建' });
    setTimeout(() => {
      setResult(null);
      if (mode === 'edit' && recipe) onClose();
      else onCreated(res.recipe.slug);
    }, 700);
  };

  const remove = async () => {
    if (!recipe) return;
    setConfirmDelete(false);
    setSaving(true);
    await deleteRecipe(recipe.slug);
    setSaving(false);
    onDeleted();
  };

  return (
    <>
      <TaskScreen
        title={heading}
        onClose={requestClose}
        subtitle={titleTouched && !valid ? '名称不能为空' : valid ? undefined : '名称是必填项'}
        leading={{ icon: 'x', label: '取消', onPress: requestClose }}
        trailing={{
          icon: 'check',
          label: saving ? '保存中' : '完成',
          onPress: () => void save(),
          disabled: !valid || saving || result !== null,
          tone: 'accent',
        }}>
        {/*
         * 屏边距由这一层统一给（与其它屏幕一致：Section 只负责卡片，
         * 不管左右边距）。以前是每个子块自己写 px-5，导致 Section 的卡片
         * 直接顶到屏幕边（实测只剩 3px）。
         * 注意：卡片**内部**的行仍然要自己写 px-4，那是另一层。
         */}
        <View className="px-5 pt-5" style={{ rowGap: 22 }}>
          {/* 左图右文：封面与名称 / 备注同属「这道菜长什么样」，放一块里 */}
          <View className="flex-row items-start gap-3">
            <CoverField value={image} onChange={setImage} disabled={saving} />
            <View className="min-w-0 flex-1" style={{ rowGap: 8 }}>
              {/*
               * 封面旁边的两个字段用 stacked：框内上方小标签 + 下方值。
               * 横向只剩封面右边这么窄，inline 的左侧标签会把输入区挤得很短。
               * rowGap 8（不是 10）是为了让两个框叠起来正好等于封面高度：
               * 每框 7+14+2+22+7 = 52，两个 104，加上 8 就是 110 ≈ THUMB。
               */}
              <TextField
                value={title}
                onChange={setTitle}
                onBlur={() => setTitleTouched(true)}
                align="left"
                placeholder="番茄牛腩饭"
                label="菜名"
                layout="stacked"
              />
              <TextField
                value={subtitle}
                onChange={setSubtitle}
                align="left"
                placeholder="一句话说明（可选）"
                label="备注"
                layout="stacked"
              />
            </View>
          </View>

          {/*
           * 名称是必填，但只在用户“碰过”之后才报错。
           * 以前直接拿 !valid 当错误条件，于是一进新建页就顶着一条红字——
           * 用户还没开始填，就先被指责了一顿。
           */}
          {titleTouched && !valid ? <FieldError>名称是唯一的必填项</FieldError> : null}

          {/*
           * FormGroup 自带 px-5，而外层容器已经有 px-5——
           * 直接嵌进去会变成 40pt 缩进（比其它行深一半）。
           * 这里用 px-0 把 FormGroup 自己的边距清掉，只留外层那一层。
           */}
          <FormGroup className="px-0">
            <FormRow label="用时">
              <Stepper value={minutes} onChange={setMinutes} min={5} max={240} suffix=" 分钟" />
            </FormRow>
          </FormGroup>

          <Section title="分类" footer="分类可在「我的 › 分类管理」中增删改">
            {categoryOptions.map((c) => (
              <ListRow
                key={c}
                title={c}
                accessory="check"
                selected={activeCategory === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </Section>

          <Section
            title="标签"
            footer={tagError ? undefined : '可多选 · 新建的标签会同时加入「我的 › 标签管理」'}
            padded>
            <View className="flex-row flex-wrap gap-2">
              {tagOptions.map((t) => (
                <Pill
                  key={t}
                  active={tags.includes(t)}
                  onPress={() =>
                    setTags((list) =>
                      list.includes(t) ? list.filter((x) => x !== t) : [...list, t]
                    )
                  }>
                  {t}
                </Pill>
              ))}
              {!composingTag ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="新建标签"
                  onPress={() => {
                    setComposingTag(true);
                    setTagError('');
                  }}
                  className="border-hair h-8 flex-row items-center gap-1.5 rounded-full border border-dashed px-3.5">
                  <Icon name="plus" size="sm" tone="muted" strokeWidth={2.4} />
                  <Body tone="muted" size="text-[13px]">
                    新建标签
                  </Body>
                </Pressable>
              ) : null}
            </View>

            {composingTag ? (
              <View className="border-hair bg-paper rounded-control mt-3 flex-row items-center gap-2 border px-3 py-2">
                <TextField
                  value={tagDraft}
                  onChange={(v) => {
                    setTagDraft(v);
                    if (tagError) setTagError('');
                  }}
                  align="left"
                  autoFocus
                  placeholder="标签名，回车即添加"
                  label="新建标签"
                  onSubmit={() => void commitTag()}
                  /* 外层已经画了描边容器，输入框不再套一层 */
                  inline
                  className="flex-1"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="取消新建标签"
                  onPress={() => {
                    setComposingTag(false);
                    setTagDraft('');
                    setTagError('');
                  }}
                  hitSlop={6}>
                  <Body tone="muted" size="text-[13px]">
                    取消
                  </Body>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="添加标签"
                  accessibilityState={{ disabled: !tagDraft.trim() || addingTag }}
                  disabled={!tagDraft.trim() || addingTag}
                  onPress={() => void commitTag()}
                  hitSlop={6}>
                  <Body
                    tone={tagDraft.trim() ? 'accent' : 'muted'}
                    size="text-[15px]"
                    weight="font-semibold">
                    {addingTag ? '添加中' : '添加'}
                  </Body>
                </Pressable>
              </View>
            ) : null}

            {tagError ? (
              <View className="mt-2">
                <Caption tone="danger" className="leading-relaxed">
                  {tagError}
                </Caption>
              </View>
            ) : null}
          </Section>

          <View style={{ rowGap: 20 }}>
            {groups.map((group, gi) => (
              <Section
                key={`${group.group}-${gi}`}
                title={
                  <View className="flex-row items-center gap-2">
                    <Micro>{group.group || '食材'}</Micro>
                    {groups.length > 1 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="删除分组"
                        onPress={() => setGroups((list) => list.filter((_, i) => i !== gi))}
                        hitSlop={6}>
                        <Body tone="accent" size="text-[11px]" weight="font-medium">
                          删除分组
                        </Body>
                      </Pressable>
                    ) : null}
                  </View>
                }>
                {/*
                 * 分组名与下面的食材行一样走无边框内联：
                 * 它本来就在 Section 的卡片里，旁边还有「删除分组」，
                 * 再套一个白底描边框就是框中框。
                 * px-4 是卡片内的行内边距——外层 px-5 只管卡片外边距，
                 * 两者不是同一层，不能互相替代。
                 */}
                <View className="flex-row items-center gap-3 px-4 py-2.5">
                  <Body tone="muted" weight="font-normal" className="shrink-0">
                    分组名
                  </Body>
                  <TextField
                    value={group.group}
                    onChange={(v) =>
                      setGroups((list) => list.map((g, i) => (i === gi ? { ...g, group: v } : g)))
                    }
                    align="left"
                    placeholder="主料 / 调味"
                    label="分组名"
                    inline
                    className="flex-1"
                  />
                </View>

                {group.items.map((item, ii) => (
                  <View key={ii} className="flex-row items-center gap-2 px-4 py-2">
                    {/*
                     * 密集行用 inline（不套框、不写标签）：
                     * 一行里已经有「食材 / 用量 / 删除」三个控件，
                     * 再给每个输入套一层白底描边框会变成四个框叠在一起。
                     * 标签也不重复写——placeholder 已经把意思说清楚了。
                     */}
                    <TextField
                      value={item.name}
                      onChange={(v) => setItem(gi, ii, { name: v })}
                      align="left"
                      placeholder="食材"
                      inline
                      className="flex-1"
                    />
                    <View className="bg-hair h-5 w-px" />
                    <View style={{ width: 88 }}>
                      <TextField
                        value={item.amount}
                        onChange={(v) => setItem(gi, ii, { amount: v })}
                        align="right"
                        placeholder="用量"
                        inline
                      />
                    </View>
                    <IconButton
                      name="trash-2"
                      label="删除该食材"
                      size="sm"
                      variant="fill"
                      onPress={() =>
                        setGroups((list) =>
                          list.map((g, i) =>
                            i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g
                          )
                        )
                      }
                    />
                  </View>
                ))}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="添加食材"
                  onPress={() =>
                    setGroups((list) =>
                      list.map((g, i) =>
                        i === gi ? { ...g, items: [...g.items, { name: '', amount: '' }] } : g
                      )
                    )
                  }
                  className="active:bg-fill/60 min-h-11 w-full flex-row items-center gap-2 px-4 py-3">
                  <Icon name="plus" size="md" tone="accent" strokeWidth={2.4} />
                  <Body tone="accent">添加食材</Body>
                </Pressable>
              </Section>
            ))}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="添加食材分组"
              onPress={() =>
                setGroups((list) => [
                  ...list,
                  {
                    group: list.length === 1 ? '调味' : `分组 ${list.length + 1}`,
                    items: [{ name: '', amount: '' }],
                  },
                ])
              }
              className="self-start px-4">
              <Body tone="accent" size="text-[15px]">
                + 添加食材分组
              </Body>
            </Pressable>
          </View>

          <Section title="步骤" footer="每行一步，详情页会自动编号">
            {steps.map((step, i) => (
              <View key={i} className="flex-row items-start gap-3 px-4 py-2.5">
                <View className="bg-fill mt-1.5 h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full">
                  <Body tabular size="text-[12px]" weight="font-bold" tone="soft">
                    {String(i + 1)}
                  </Body>
                </View>
                <View className="min-w-0 flex-1">
                  {/*
                   * 步骤行左边的序号圆点已经说明了“第几步”，
                   * TextArea 不再重复写 label（以前是「第 3 步」+ 圆点「3」两份）。
                   * 也不套输入框——整卡已经在 Section 里，再套一层就是框中框。
                   */}
                  <TextArea
                    value={step}
                    onChange={(v) => setSteps((list) => list.map((s, j) => (j === i ? v : s)))}
                    rows={step.length > 34 ? 2 : 1}
                    placeholder="这一步做什么？"
                    bare
                  />
                </View>
                {steps.length > 1 ? (
                  <IconButton
                    name="trash-2"
                    label={`删除第 ${i + 1} 步`}
                    size="sm"
                    variant="fill"
                    onPress={() => setSteps((list) => list.filter((_, j) => j !== i))}
                  />
                ) : null}
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="添加步骤"
              onPress={() => setSteps((list) => [...list, ''])}
              className="active:bg-fill/60 min-h-11 w-full flex-row items-center gap-2 px-4 py-3">
              <Icon name="plus" size="md" tone="accent" strokeWidth={2.4} />
              <Body tone="accent">添加步骤</Body>
            </Pressable>
          </Section>

          {mode === 'edit' ? (
            <Section>
              <ListRow
                leading={
                  <View className="h-[22px] w-[22px] items-center justify-center">
                    <Icon name="trash-2" size="md" tone="danger" />
                  </View>
                }
                title="删除这道菜谱"
                destructive
                onPress={() => setConfirmDelete(true)}
              />
            </Section>
          ) : (
            <Caption className="text-center">点右上角对勾保存，之后仍可随时修改</Caption>
          )}

          {mode === 'edit' && recipe ? (
            <Caption>
              {recipe.favorite ? '已收藏' : '未收藏'} · 累计制作 {recipe.cooked}{' '}
              次（由打卡记录自动统计）
            </Caption>
          ) : null}
        </View>
      </TaskScreen>

      <SuccessOverlay
        open={result !== null}
        tone={result?.tone ?? 'success'}
        title={result?.title ?? ''}
        caption={result?.caption}
      />

      <Alert
        open={confirmDelete}
        title="删除这道菜谱？"
        message={`「${recipe?.title ?? ''}」将从菜谱库中移除，历史打卡记录会保留。`}
        confirmLabel="删除"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />

      <Alert
        open={confirmDiscard}
        title="放弃这次修改？"
        message="还没保存，关掉之后填过的内容就没了。"
        cancelLabel="继续编辑"
        confirmLabel="放弃"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      />
    </>
  );
}
