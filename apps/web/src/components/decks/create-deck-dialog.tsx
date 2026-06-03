'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { DeckWordFields } from '@/components/decks/deck-word-fields';
import { HSK_LEVEL_OPTIONS } from '@/lib/select-options';
import {
  emptyWordDraft,
  validDrafts,
  type DeckWordDraft,
} from '@/lib/deck-import';
import type { DeckDto, HskLevel } from '@linguaflow/shared';
import { FolderPlus, Plus } from 'lucide-react';

interface CreateDeckDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (deck: DeckDto) => void;
  onOpenJsonHelp: () => void;
}

export function CreateDeckDialog({
  open,
  onClose,
  onSuccess,
  onOpenJsonHelp,
}: CreateDeckDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [hskLevel, setHskLevel] = useState<HskLevel>('HSK1' as HskLevel);
  const [wordDrafts, setWordDrafts] = useState<DeckWordDraft[]>([emptyWordDraft()]);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setTopic('');
    setHskLevel('HSK1' as HskLevel);
    setWordDrafts([emptyWordDraft()]);
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const words = validDrafts(wordDrafts);
      const { data } = await api.post<DeckDto>('/decks', {
        title: title.trim(),
        topic: topic.trim(),
        hskLevel,
        ...(words.length ? { words } : {}),
      });
      return data;
    },
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      onSuccess(deck);
      onClose();
    },
  });

  const appendWordDraft = () => {
    setWordDrafts((prev) => [...prev, emptyWordDraft()]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      labelledBy="create-deck-title"
      className="max-h-[min(calc(100dvh-2rem),44rem)]"
    >
      <ModalHeader
        titleId="create-deck-title"
        title="Tạo bộ từ thủ công"
        description="Nhập thông tin bộ từ và thêm từ (tùy chọn). Bộ rỗng vẫn tạo được."
        onClose={onClose}
        icon={<FolderPlus className="h-5 w-5" />}
      />

      <ModalBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Tên bộ từ *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Chủ đề *"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Select
            value={hskLevel}
            onChange={(v) => setHskLevel(v as HskLevel)}
            options={HSK_LEVEL_OPTIONS}
            className="sm:col-span-2 sm:max-w-xs"
          />
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Danh sách từ (tùy chọn)</p>
          <p className="mt-0.5 text-xs text-muted">
            Mỗi từ cần chữ Hán, pinyin và nghĩa tiếng Việt.
          </p>
          <div className="mt-3">
            <DeckWordFields
              drafts={wordDrafts}
              onChange={setWordDrafts}
              showAddButton={false}
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex w-full flex-nowrap items-center gap-2 sm:justify-between">
          <Button type="button" variant="outline" size="sm" onClick={appendWordDraft}>
            <Plus className="h-4 w-4 shrink-0" />
            Thêm từ
          </Button>
          <button
            type="button"
            className="shrink-0 whitespace-nowrap text-sm text-primary underline-offset-2 hover:underline"
            onClick={onOpenJsonHelp}
          >
            Định dạng JSON
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!title.trim() || !topic.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Đang tạo…' : 'Tạo bộ từ'}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
