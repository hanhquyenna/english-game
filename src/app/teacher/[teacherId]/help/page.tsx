import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/teacher/page-header";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Trợ giúp và Hướng dẫn"
        description="Trung tâm hỗ trợ sử dụng hệ thống Beeblast dành cho giáo viên."
      />

      <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="size-5 text-[var(--persona)]" />
              Hướng dẫn giảng dạy
            </CardTitle>
            <CardDescription>
              Cách giao bài học, tạo đề kiểm tra và theo dõi tiến độ CEFR của học sinh.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Mỗi đơn vị bài học được giao sẽ tự động recompute điểm trình độ cho cả lớp.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageCircle className="size-5 text-[var(--persona)]" />
              Hỗ trợ kỹ thuật
            </CardTitle>
            <CardDescription>
              Liên hệ bộ phận kỹ thuật Beeblast để giải đáp thắc mắc hoặc báo lỗi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Email: hotro@beeblast.edu.vn · Hotline: 1900 6868
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
