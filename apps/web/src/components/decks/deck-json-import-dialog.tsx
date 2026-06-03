'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { DECK_JSON_EXAMPLE_STRING } from '@/lib/deck-import';
import { FileJson, Copy, Check } from 'lucide-react';

interface DeckJsonImportDialogProps {
  open: boolean;
  onClose: () => void;
  onPickFile: () => void;
  /** Thêm từ vào bộ có sẵn — copy hướng dẫn ngắn hơn */
  mode?: 'new-deck' | 'add-words';
}

export function DeckJsonImportDialog({
  open,
  onClose,
  onPickFile,
  mode = 'new-deck',
}: DeckJsonImportDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyExample = async () => {
    await navigator.clipboard.writeText(DECK_JSON_EXAMPLE_STRING);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handlePick = () => {
    onClose();
    onPickFile();
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" labelledBy="deck-json-import-title">
      <ModalHeader
        title="Import JSON"
        description={
          mode === 'add-words'
            ? 'Chọn file JSON để thêm từ vào bộ hiện tại. Có thể dùng mảng words hoặc file export đầy đủ.'
            : 'Chọn file JSON để tạo bộ từ mới (tên, chủ đề, HSK và danh sách từ).'
        }
        onClose={onClose}
        icon={<FileJson className="h-5 w-5" />}
        titleId="deck-json-import-title"
      />

      <ModalBody className="space-y-4">
        <div>
          <p className="font-medium text-foreground">Trường bắt buộc</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>
              <code className="rounded bg-black/[0.04] px-1 text-foreground">title</code>,{' '}
              <code className="rounded bg-black/[0.04] px-1 text-foreground">topic</code>,{' '}
              <code className="rounded bg-black/[0.04] px-1 text-foreground">hskLevel</code>
            </li>
            <li>
              <code className="rounded bg-black/[0.04] px-1 text-foreground">words</code> — mỗi từ
              cần <code className="rounded bg-black/[0.04] px-1 text-foreground">hanzi</code>,{' '}
              <code className="rounded bg-black/[0.04] px-1 text-foreground">pinyin</code>,{' '}
              <code className="rounded bg-black/[0.04] px-1 text-foreground">meaningVi</code>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground">Tùy chọn (mỗi từ)</p>
          <p className="mt-1 text-muted">
            partOfSpeech, exampleHanzi, examplePinyin, exampleVi, hskLevel
          </p>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">Ví dụ file JSON</p>
            <Button variant="outline" size="sm" type="button" onClick={copyExample}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Đã copy
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy ví dụ
                </>
              )}
            </Button>
          </div>
          <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-border bg-slate-50 p-3 font-mono text-xs leading-relaxed text-foreground">
            {DECK_JSON_EXAMPLE_STRING}
          </pre>
        </div>
      </ModalBody>

      <ModalFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" type="button" onClick={onClose}>
          Hủy
        </Button>
        <Button type="button" onClick={handlePick}>
          <FileJson className="h-4 w-4" />
          Chọn file JSON
        </Button>
      </ModalFooter>
    </Modal>
  );
}
