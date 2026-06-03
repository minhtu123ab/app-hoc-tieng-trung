'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { DeckWordFields } from '@/components/decks/deck-word-fields';
import {
  emptyWordDraft,
  validDrafts,
  type DeckWordDraft,
} from '@/lib/deck-import';
import { ListPlus, Plus } from 'lucide-react';

interface AddDeckWordsDialogProps {
  open: boolean;
  onClose: () => void;
  deckId: string;
  onOpenJsonHelp: () => void;
  onError?: (message: string) => void;
}

export function AddDeckWordsDialog({
  open,
  onClose,
  deckId,
  onOpenJsonHelp,
  onError,
}: AddDeckWordsDialogProps) {
  const queryClient = useQueryClient();
  const [wordDrafts, setWordDrafts] = useState<DeckWordDraft[]>([emptyWordDraft()]);

  useEffect(() => {
    if (!open) return;
    setWordDrafts([emptyWordDraft()]);
  }, [open]);

  const addWordsMutation = useMutation({
    mutationFn: async (words: ReturnType<typeof validDrafts>) => {
      await api.post(`/decks/${deckId}/words`, { words });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      onClose();
    },
  });

  const appendWordDraft = () => {
    setWordDrafts((prev) => [...prev, emptyWordDraft()]);
  };

  const handleSave = () => {
    const words = validDrafts(wordDrafts);
    if (!words.length) {
      onError?.('Cần ít nhất một từ có đủ Hán, pinyin và nghĩa');
      return;
    }
    addWordsMutation.mutate(words);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      labelledBy="add-deck-words-title"
      className="max-h-[min(calc(100dvh-2rem),44rem)]"
    >
      <ModalHeader
        titleId="add-deck-words-title"
        title="Thêm từ vào bộ"
        description="Nhập từng từ hoặc import file JSON (mảng words hoặc file export)."
        onClose={onClose}
        icon={<ListPlus className="h-5 w-5" />}
      />

      <ModalBody>
        <DeckWordFields
          drafts={wordDrafts}
          onChange={setWordDrafts}
          showAddButton={false}
        />
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
              disabled={addWordsMutation.isPending}
              onClick={handleSave}
            >
              {addWordsMutation.isPending ? 'Đang lưu…' : 'Lưu từ'}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
