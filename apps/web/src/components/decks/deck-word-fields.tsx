'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DeckWordDraft } from '@/lib/deck-import';
import { Plus, Trash2 } from 'lucide-react';

interface DeckWordFieldsProps {
  drafts: DeckWordDraft[];
  onChange: (drafts: DeckWordDraft[]) => void;
  showOptional?: boolean;
  /** Nút «Thêm từ» — tắt khi đặt ở thanh action ngoài */
  showAddButton?: boolean;
}

export function DeckWordFields({
  drafts,
  onChange,
  showOptional = true,
  showAddButton = true,
}: DeckWordFieldsProps) {
  const update = (index: number, patch: Partial<DeckWordDraft>) => {
    onChange(drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const remove = (index: number) => {
    onChange(drafts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {drafts.map((draft, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card-solid/50 p-4 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              Từ {index + 1}
            </span>
            {drafts.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                aria-label="Xóa từ"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="Chữ Hán *"
              value={draft.hanzi}
              onChange={(e) => update(index, { hanzi: e.target.value })}
              className="chinese-text"
            />
            <Input
              placeholder="Pinyin *"
              value={draft.pinyin}
              onChange={(e) => update(index, { pinyin: e.target.value })}
            />
            <Input
              placeholder="Nghĩa tiếng Việt *"
              value={draft.meaningVi}
              onChange={(e) => update(index, { meaningVi: e.target.value })}
            />
          </div>
          {showOptional && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Từ loại (tùy chọn)"
                value={draft.partOfSpeech}
                onChange={(e) => update(index, { partOfSpeech: e.target.value })}
              />
              <Input
                placeholder="Ví dụ Hán (tùy chọn)"
                value={draft.exampleHanzi}
                onChange={(e) => update(index, { exampleHanzi: e.target.value })}
                className="chinese-text"
              />
              <Input
                placeholder="Ví dụ pinyin (tùy chọn)"
                value={draft.examplePinyin}
                onChange={(e) => update(index, { examplePinyin: e.target.value })}
              />
              <Input
                placeholder="Ví dụ tiếng Việt (tùy chọn)"
                value={draft.exampleVi}
                onChange={(e) => update(index, { exampleVi: e.target.value })}
              />
            </div>
          )}
        </div>
      ))}
      {showAddButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...drafts,
              {
                hanzi: '',
                pinyin: '',
                meaningVi: '',
                partOfSpeech: '',
                exampleHanzi: '',
                examplePinyin: '',
                exampleVi: '',
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          Thêm từ
        </Button>
      )}
    </div>
  );
}
