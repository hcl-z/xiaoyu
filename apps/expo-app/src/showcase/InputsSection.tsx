/** 输入：以真实表单、搜索与校验状态展示 */
import { useState } from 'react';
import { View } from 'react-native';

import { FormGroup, FormRow, Pill, SearchField, TextArea, TextField } from '@/components';
import { Icon } from '@/components/icon';
import { Body, Caption } from '@/components/text';
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
    <View className="gap-5">
      <ShowcaseStage label="TEXT FIELDS" caption="填充行 · 聚焦只加描边">
        <FormGroup className="px-0">
          <TextField value={name} onChange={setName} label="菜名" />
          <TextField
            value={servings}
            onChange={setServings}
            inputMode="numeric"
            label="份数"
            placeholder="2"
          />
          <TextField value={empty} onChange={setEmpty} placeholder="选择分类" label="分类" />
          <TextField value={invalid} onChange={setInvalid} label="用时" placeholder="分钟" error />
        </FormGroup>
      </ShowcaseStage>

      <ShowcaseStage label="STATES" caption="默认 / 聚焦 / 出错 / 禁用">
        <FormGroup className="px-0">
          {/*
           * 这一组是状态对照表，不是真表单：不 autoFocus、不抢焦点，
           * 聚焦态直接用 FormRow 的 state 固定展示，否则这里永远看不到描边。
           */}
          <TextField value="" onChange={() => {}} placeholder="未填写" label="空态" />
          <FormRow label="聚焦" state="focus">
            <Body weight="font-medium">name@example.com</Body>
          </FormRow>
          <TextField value="格式不对" onChange={() => {}} label="出错" error />
          <TextField value="不可编辑" onChange={() => {}} label="禁用" editable={false} />
        </FormGroup>
      </ShowcaseStage>

      <ShowcaseStage label="SELECT ROWS" caption="同行形状，整行可点">
        <FormGroup className="px-0">
          <FormRow
            label="分类"
            onPress={() => {}}
            trailing={<Icon name="chevron-right" size="md" tone="muted" />}>
            <Body weight="font-medium">主食</Body>
          </FormRow>
          <FormRow
            label="收藏"
            onPress={() => {}}
            trailing={<Icon name="chevron-right" size="md" tone="muted" />}>
            <Body tone="muted">未收藏</Body>
          </FormRow>
        </FormGroup>
      </ShowcaseStage>

      <ShowcaseStage label="SEARCH" caption="与输入行同一套形状">
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

      <ShowcaseStage label="TEXT AREA" caption="随内容增高">
        <View className="gap-2">
          <TextArea value={note} onChange={setNote} rows={4} label="做法" />
          <Caption size="text-[11px]" className="text-right">
            {note.length} 字
          </Caption>
        </View>
      </ShowcaseStage>
    </View>
  );
}
