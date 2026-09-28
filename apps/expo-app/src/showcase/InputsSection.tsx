/** 输入：以真实表单、搜索与校验状态展示 */
import { useState } from 'react';
import { View } from 'react-native';

import { FieldRow, Pill, SearchField, TextArea, TextField } from '@/components';
import { Caption } from '@/components/text';
import { searchSuggestions } from '@/fixtures/showcase';

import { ShowcaseStage } from './gallery';

export function InputsSection() {
  const [name, setName] = useState('番茄牛腩饭');
  const [empty, setEmpty] = useState('');
  const [servings, setServings] = useState('2');
  const [invalid, setInvalid] = useState('0');
  const [note, setNote] = useState('牛腩先焯水，再和番茄一起炖 40 分钟。');
  const [query, setQuery] = useState('');

  return (
    <View className="gap-4">
      <ShowcaseStage
        label="GROUPED FORM"
        caption="适合设置页与轻量编辑"
        contentClassName="overflow-hidden p-0">
        <FieldRow label="菜名">
          <TextField value={name} onChange={setName} label="菜名" />
        </FieldRow>
        <FieldRow label="份数" hint="1–9">
          <TextField
            value={servings}
            onChange={setServings}
            inputMode="numeric"
            label="份数"
            className="max-w-[64px]"
          />
        </FieldRow>
        <FieldRow label="分类">
          <TextField value={empty} onChange={setEmpty} placeholder="选择分类" label="分类" />
        </FieldRow>
      </ShowcaseStage>
      <ShowcaseStage label="SEARCH" caption="输入后可一键清除" tone="paper">
        <View className="gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="搜索菜谱" />
          <View className="flex-row flex-wrap gap-2">
            {searchSuggestions.map((suggestion) => (
              <Pill key={suggestion} size="sm" onPress={() => setQuery(suggestion)}>
                {suggestion}
              </Pill>
            ))}
          </View>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="TEXT AREA" caption="多行说明">
        <View className="gap-2">
          <TextArea value={note} onChange={setNote} rows={4} label="做法" />
          <Caption size="text-[11px]" className="text-right">
            {note.length} 字
          </Caption>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="VALIDATION" caption="空态、错误与禁用" tone="tint">
        <View className="gap-3">
          <View className="bg-card rounded-group px-4">
            <FieldRow label="空态">
              <TextField value={empty} onChange={setEmpty} placeholder="未填写" label="空态" />
            </FieldRow>
            <FieldRow label="出错" hint="至少为 1">
              <TextField
                value={invalid}
                onChange={setInvalid}
                inputMode="numeric"
                error
                label="出错示例"
                className="max-w-[64px]"
              />
            </FieldRow>
            <FieldRow label="禁用">
              <TextField value="不可编辑" onChange={() => {}} editable={false} label="禁用示例" />
            </FieldRow>
          </View>
          <SearchField value="" onChange={() => {}} editable={false} placeholder="禁用搜索" />
        </View>
      </ShowcaseStage>
    </View>
  );
}
