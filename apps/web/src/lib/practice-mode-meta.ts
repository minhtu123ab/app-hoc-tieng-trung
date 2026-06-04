import { PracticeMode } from '@linguaflow/shared';

export const PRACTICE_MODE_TIPS: Record<PracticeMode, string[]> = {
  [PracticeMode.VIET_TO_HAN]: [
    'Nhìn nghĩa tiếng Việt, gõ chữ Hán (có thể bỏ dấu cách).',
    'Không nhớ pinyin vẫn được — ưu tiên nhớ nghĩa và chữ.',
    'Sai nhẹ vẫn được ghi SRS mềm, không reset mạnh.',
  ],
  [PracticeMode.HAN_TO_VIET]: [
    'Chọn đáp án đúng hoặc gõ nghĩa tiếng Việt.',
    'Đọc to chữ Hán trước khi chọn — tránh đoán mò.',
    'Bấm Nghe nếu cần nhắc phát âm.',
  ],
  [PracticeMode.LISTEN_TYPE]: [
    'Nghe kỹ rồi gõ chữ Hán — có thể dùng nút Nói (mic).',
    'Tự phát âm có thể bật trong Cài đặt.',
    'Enter để kiểm tra nhanh.',
  ],
  [PracticeMode.FILL_BLANK]: [
    'Điền từ Hán còn thiếu trong câu ví dụ.',
    'Chú ý ngữ cảnh câu để chọn đúng từ.',
  ],
  [PracticeMode.SENTENCE_ORDER]: [
    'Bấm từng mảnh để ghép câu — bấm lại để bỏ.',
    'Token trùng có thể chọn nhiều lần (theo thứ tự).',
  ],
  [PracticeMode.WORD_BANK]: [
    'Đọc nghĩa tiếng Việt, chọn các từ Hán để ghép câu.',
    'Có thêm từ nhiễu — chỉ chọn đủ từ cần thiết.',
    'Bấm Xóa để làm lại từ đầu.',
  ],
  [PracticeMode.MATCH_PAIRS]: [
    'Chọn một ô Hán rồi chọn ô nghĩa Việt tương ứng.',
    'Ghép đủ tất cả cặp rồi bấm Kiểm tra.',
  ],
  [PracticeMode.AI_CONVERSATION]: [
    'Trả lời bằng tiếng Trung theo tình huống.',
    'Có thể kèm pinyin trong ngoặc nếu cần.',
    'Dùng từ vựng trong gợi ý để luyện tự nhiên hơn.',
  ],
};

export const PRACTICE_MODE_DESC: Record<PracticeMode, string> = {
  [PracticeMode.VIET_TO_HAN]: 'Nhìn nghĩa tiếng Việt, gõ chữ Hán',
  [PracticeMode.HAN_TO_VIET]: 'Nhìn chữ Hán, chọn hoặc nhập nghĩa tiếng Việt',
  [PracticeMode.LISTEN_TYPE]: 'Nghe phát âm và gõ chữ Hán',
  [PracticeMode.FILL_BLANK]: 'Điền từ còn thiếu vào câu',
  [PracticeMode.SENTENCE_ORDER]: 'Sắp xếp các mảnh thành câu đúng',
  [PracticeMode.WORD_BANK]: 'Chọn từ Hán ghép thành câu từ nghĩa Việt',
  [PracticeMode.MATCH_PAIRS]: 'Ghép cặp chữ Hán với nghĩa tiếng Việt',
  [PracticeMode.AI_CONVERSATION]: 'Trả lời hội thoại theo tình huống',
};
