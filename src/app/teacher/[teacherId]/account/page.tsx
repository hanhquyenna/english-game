import { notFound } from "next/navigation";
import { getUser, getClassForTeacher } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/teacher/page-header";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: PageProps<"/teacher/[teacherId]/account">) {
  const { teacherId } = await params;
  const [teacher, klass] = await Promise.all([
    getUser(teacherId),
    getClassForTeacher(teacherId),
  ]);
  if (!teacher) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài khoản giáo viên"
        description="Thông tin cá nhân và phân công giảng dạy."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Hồ sơ cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm text-muted-foreground">Họ và tên</span>
            <span className="font-semibold text-sm">{teacher.name}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm text-muted-foreground">Vai trò</span>
            <Badge className="bg-[var(--persona)] text-white">Giáo viên</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lớp phụ trách</span>
            <span className="font-semibold text-sm">{klass?.name ?? "Chưa phân công"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
