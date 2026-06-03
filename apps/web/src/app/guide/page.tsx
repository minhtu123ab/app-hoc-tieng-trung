'use client';

import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Brain,
  Dumbbell,
  MessageCircle,
  BarChart3,
  CircleHelp,
  ArrowRight,
} from 'lucide-react';

const sections = [
  { id: 'bat-dau', label: '1. Bắt đầu' },
  { id: 'tong-quan', label: '2. Tổng quan' },
  { id: 'sinh-tu', label: '3. Sinh từ AI' },
  { id: 'bo-tu', label: '4. Bộ từ vựng' },
  { id: 'srs', label: '5. Ôn tập SRS' },
  { id: 'luyen-tap', label: '6. Luyện tập' },
  { id: 'gia-su', label: '7. Gia sư AI' },
  { id: 'thong-ke', label: '8. Thống kê' },
  { id: 'quy-trinh', label: '9. Quy trình học gợi ý' },
  { id: 'xu-ly-loi', label: '10. Xử lý lỗi thường gặp' },
];

function GuideSection({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-red-50 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
          {children}
        </div>
      </Card>
    </section>
  );
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start gap-3">
        <CircleHelp className="mt-1 h-8 w-8 shrink-0 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Hướng dẫn sử dụng LinguaFlow AI</h1>
          <p className="mt-1 text-muted">
            Tài liệu chi tiết giúp bạn biết từng mục dùng để làm gì và cách học hiệu quả.
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardTitle>Mục lục</CardTitle>
        <nav className="mt-3 grid gap-1 sm:grid-cols-2">
          {sections.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>
      </Card>

      <div className="mt-8 space-y-6">
        <GuideSection id="bat-dau" icon={CircleHelp} title="1. Bắt đầu — Đăng nhập & tài khoản">
          <p>
            LinguaFlow AI là nền tảng học tiếng Trung cá nhân hóa. Bạn cần đăng nhập để lưu tiến
            trình học, bộ từ và thống kê.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Đăng ký:</strong> vào trang Đăng ký, nhập họ tên, email, mật khẩu (tối thiểu
              6 ký tự) và chọn trình độ HSK ban đầu.
            </li>
            <li>
              <strong>Đăng nhập:</strong> dùng email và mật khẩu đã tạo.
            </li>
            <li>
              <strong>Tài khoản demo:</strong> email{' '}
              <code className="rounded bg-slate-100 px-1">demo@linguaflow.ai</code>, mật khẩu{' '}
              <code className="rounded bg-slate-100 px-1">demo123456</code> — đã có sẵn bộ từ HSK1
              để thử ngay.
            </li>
          </ul>
          <p>
            Sau khi đăng nhập, menu bên trái hiển thị đầy đủ chức năng. Nút <strong>Đăng xuất</strong>{' '}
            nằm cuối sidebar.
          </p>
        </GuideSection>

        <GuideSection id="tong-quan" icon={LayoutDashboard} title="2. Tổng quan (Dashboard)">
          <p>
            Trang đầu tiên sau đăng nhập, giúp nắm nhanh tình hình học hôm nay.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Cần ôn hôm nay:</strong> số từ đến hạn ôn theo thuật toán SRS — bấm để vào
              Ôn tập SRS.
            </li>
            <li>
              <strong>Chuỗi ngày học:</strong> số ngày liên tiếp bạn có hoạt động học (ôn tập hoặc
              luyện tập).
            </li>
            <li>
              <strong>Đã thành thạo / Đang học:</strong> thống kê nhanh về từ vựng theo trạng thái.
            </li>
          </ul>
          <p>
            Khối <strong>Bắt đầu nhanh</strong> là lối tắt tới các tính năng chính: Ôn tập, Sinh
            từ AI, Luyện tập, Gia sư AI.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mt-2">
              Mở Tổng quan <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </GuideSection>

        <GuideSection id="sinh-tu" icon={Sparkles} title="3. Sinh từ AI">
          <p>
            Dùng Google Gemini để tạo bộ từ vựng mới theo chủ đề và trình độ HSK — không giới hạn
            nội dung cố định như sách giáo khoa.
          </p>
          <p className="font-medium">Cách dùng:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Chọn <strong>chủ đề</strong> (Du lịch, Công nghệ, Game, …) hoặc nhập chủ đề tùy chỉnh.</li>
            <li>Chọn <strong>trình độ HSK</strong> (HSK1 → HSK6 hoặc Nâng cao).</li>
            <li>Kéo thanh trượt chọn <strong>số lượng từ</strong> (5–50 từ mỗi lần sinh).</li>
            <li>Bấm <strong>Sinh X từ</strong> — AI tạo hanzi, pinyin, nghĩa tiếng Việt và câu ví dụ.</li>
            <li>Sau khi sinh xong, bạn được chuyển tới trang chi tiết bộ từ vừa tạo.</li>
          </ol>
          <p>
            Mỗi từ sinh ra <strong>tự động được thêm vào tiến trình học</strong> của bạn, nên có thể
            ôn SRS và luyện tập ngay mà không cần thao tác thêm.
          </p>
          <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
            <strong>Lưu ý:</strong> cần cấu hình <code className="rounded bg-amber-100 px-1">GEMINI_API_KEY</code>{' '}
            trong file <code className="rounded bg-amber-100 px-1">apps/api/.env</code>. Nếu báo
            lỗi quota, đổi model sang <code className="rounded bg-amber-100 px-1">gemini-2.5-flash-lite</code>.
          </p>
          <Link href="/generate">
            <Button variant="outline" size="sm" className="mt-2">
              Mở Sinh từ AI <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </GuideSection>

        <GuideSection id="bo-tu" icon={BookOpen} title="4. Bộ từ vựng">
          <p>Quản lý tất cả bộ từ đã tạo (AI hoặc có sẵn).</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Mỗi thẻ hiển thị: tên bộ, chủ đề, cấp HSK, số từ, nguồn (AI / Thủ công).</li>
            <li>Bấm vào bộ từ để xem <strong>flashcard</strong> từng từ.</li>
            <li>
              <strong>Flashcard:</strong> bấm thẻ để lật xem nghĩa tiếng Việt, pinyin và câu ví dụ.
            </li>
            <li>
              Nút <strong>loa</strong> phát âm tiếng Trung (Web Speech API trình duyệt, miễn phí).
            </li>
          </ul>
          <Link href="/decks">
            <Button variant="outline" size="sm" className="mt-2">
              Mở Bộ từ <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </GuideSection>

        <GuideSection id="srs" icon={Brain} title="5. Ôn tập SRS (Spaced Repetition)">
          <p>
            Hệ thống ôn tập thông minh — từ xuất hiện đúng lúc sắp quên, giúp nhớ lâu hơn học
            thuộc lòng một lần.
          </p>
          <p className="font-medium">Cách ôn:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Vào <strong>Ôn tập SRS</strong> — chỉ thấy từ <strong>đến hạn</strong> hôm nay.</li>
            <li>Đọc chữ Hán (bấm loa nếu cần nghe).</li>
            <li>Bấm <strong>Hiện đáp án</strong> để xem nghĩa và câu ví dụ.</li>
            <li>Đánh giá mức nhớ:</li>
          </ol>
          <ul className="ml-5 list-disc space-y-1 pl-5">
            <li><strong>Quên (Again):</strong> không nhớ — từ sẽ ôn lại sớm.</li>
            <li><strong>Khó (Hard):</strong> nhớ mơ hồ — khoảng cách ôn ngắn.</li>
            <li><strong>Đúng (Good):</strong> nhớ được — khoảng cách ôn tăng bình thường.</li>
            <li><strong>Dễ (Easy):</strong> quá dễ — khoảng cách ôn dài hơn.</li>
          </ul>
          <p>
            Trạng thái từ: <strong>Mới → Đang học → Đang quên → Thành thạo</strong> (tùy số lần ôn
            và kết quả).
          </p>
          <Link href="/review">
            <Button variant="outline" size="sm" className="mt-2">
              Mở Ôn tập SRS <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </GuideSection>

        <GuideSection id="luyen-tap" icon={Dumbbell} title="6. Luyện tập — 6 chế độ">
          <p>
            Luyện kỹ năng đọc, viết, nghe qua nhiều dạng bài. Từ lấy từ <strong>toàn bộ từ đang
            học</strong> (AI + demo + các bộ đã thêm), trộn ngẫu nhiên.
          </p>

          <p className="font-medium">Cấu hình số từ:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Ở đầu trang Luyện tập, chọn nhanh 10 / 20 / 30 / 50 / 100 từ hoặc nhập số tùy ý (1–500).</li>
            <li>Lựa chọn được lưu tự động cho lần sau.</li>
            <li>Nếu chọn 50 từ nhưng chỉ có 15 từ đang học → luyện 15 từ.</li>
          </ul>

          <p className="mt-3 font-medium">Các chế độ:</p>
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Việt → Hán</p>
              <p>Hiện nghĩa tiếng Việt → bạn gõ chữ Hán (vd: &quot;Táo&quot; → 苹果).</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Hán → Việt</p>
              <p>Hiện chữ Hán → chọn hoặc nhập nghĩa tiếng Việt đúng trong 4 lựa chọn.</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Nghe và gõ</p>
              <p>Bấm <strong>Phát âm</strong> nghe tiếng Trung → gõ lại chữ Hán vừa nghe.</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Điền từ</p>
              <p>Câu có chỗ trống ___ → điền từ Hán còn thiếu (vd: 我___学生 → 是).</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Sắp xếp câu</p>
              <p>Bấm các mảnh từ theo thứ tự đúng để ghép thành câu hoàn chỉnh.</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Hội thoại AI</p>
              <p>Chuyển sang trang Gia sư AI (tab Hội thoại) để luyện giao tiếp bằng text.</p>
            </div>
          </div>

          <p className="mt-3">
            Sau mỗi câu bấm <strong>Kiểm tra</strong> → xem đúng/sai → <strong>Câu tiếp</strong>.
            Kết quả cập nhật tiến trình SRS và thống kê.
          </p>
          <Link href="/practice">
            <Button variant="outline" size="sm" className="mt-2">
              Mở Luyện tập <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </GuideSection>

        <GuideSection id="gia-su" icon={MessageCircle} title="7. Gia sư AI">
          <p>Trò chuyện với AI như gia sư riêng, hỏi ngữ pháp hoặc luyện hội thoại.</p>

          <p className="font-medium">Tab Giải thích:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Nhập câu hỏi tiếng Việt (vd: &quot;Khác nhau giữa 会 và 能?&quot;).</li>
            <li>AI trả lời giải thích ngữ pháp, có ví dụ minh họa.</li>
          </ul>

          <p className="mt-2 font-medium">Tab Hội thoại:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Chọn vai AI: Giáo viên, Bạn bè, Khách hàng, Người bán hàng.</li>
            <li>Nhắn tin bằng tiếng Trung hoặc Việt — AI phản hồi kèm pinyin và dịch khi cần.</li>
            <li>Lịch sử chat được lưu trong phiên học.</li>
          </ul>
          <Link href="/tutor">
            <Button variant="outline" size="sm" className="mt-2">
              Mở Gia sư AI <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </GuideSection>

        <GuideSection id="thong-ke" icon={BarChart3} title="8. Thống kê">
          <p>Theo dõi tiến bộ học tập theo thời gian.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Đã học / Thành thạo / Đang quên:</strong> số từ theo trạng thái SRS.</li>
            <li><strong>Chuỗi ngày:</strong> duy trì thói quen học hàng ngày.</li>
            <li><strong>Độ chính xác theo chế độ:</strong> biểu đồ % đúng từng loại luyện tập.</li>
            <li><strong>Tiến bộ 30 ngày:</strong> số lượt ôn và số câu trả lời đúng theo ngày.</li>
          </ul>
          <Link href="/stats">
            <Button variant="outline" size="sm" className="mt-2">
              Mở Thống kê <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </GuideSection>

        <GuideSection id="quy-trinh" icon={ArrowRight} title="9. Quy trình học gợi ý">
          <p>Luồng học hiệu quả với LinguaFlow AI:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>Sinh từ AI</strong> theo chủ đề bạn quan tâm (20–30 từ/lần) hoặc dùng bộ demo
              HSK1.
            </li>
            <li>
              <strong>Xem flashcard</strong> trong Bộ từ — làm quen hanzi, pinyin, nghĩa, nghe phát âm.
            </li>
            <li>
              <strong>Ôn tập SRS</strong> mỗi ngày — ưu tiên số &quot;Cần ôn hôm nay&quot; trên Dashboard.
            </li>
            <li>
              <strong>Luyện tập</strong> 1–2 chế độ (vd: Việt→Hán + Nghe gõ) với 20–30 từ/phiên.
            </li>
            <li>
              <strong>Gia sư AI</strong> khi gặp cấu trúc khó hoặc muốn luyện hội thoại thực tế.
            </li>
            <li>
              <strong>Thống kê</strong> cuối tuần — xem chế độ nào yếu để tập trung thêm.
            </li>
          </ol>
          <p className="rounded-lg bg-red-50 p-3 text-red-900">
            Mẹo: học 15–20 phút/ngày ổn định hiệu quả hơn học 2 giờ một lần/tuần. Duy trì chuỗi
            ngày trên Dashboard!
          </p>
        </GuideSection>

        <GuideSection id="xu-ly-loi" icon={CircleHelp} title="10. Xử lý lỗi thường gặp">
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Sinh từ AI báo lỗi quota / 429</p>
              <p>
                API Gemini hết lượt free. Đổi <code className="rounded bg-slate-100 px-1">GEMINI_MODEL=gemini-2.5-flash-lite</code>{' '}
                trong <code className="rounded bg-slate-100 px-1">apps/api/.env</code>, restart API, hoặc đợi quota reset.
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">&quot;Chưa có từ để luyện&quot;</p>
              <p>
                Chưa có từ trong tiến trình học. Hãy sinh từ AI hoặc đăng nhập tài khoản demo có sẵn
                bộ HSK1.
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Không nghe được phát âm</p>
              <p>
                Cần trình duyệt hỗ trợ Web Speech (Chrome, Edge, Safari). Bật loa và thử reload trang.
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Trang web lỗi 500 / trắng màn hình</p>
              <p>
                Xóa cache Next.js: <code className="rounded bg-slate-100 px-1">rm -rf apps/web/.next</code>{' '}
                rồi chạy lại <code className="rounded bg-slate-100 px-1">pnpm dev:web</code>. Đảm bảo API
                đang chạy (<code className="rounded bg-slate-100 px-1">pnpm dev:api</code>).
              </p>
            </div>
          </div>
        </GuideSection>
      </div>
    </div>
  );
}
