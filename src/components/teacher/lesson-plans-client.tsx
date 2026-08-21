"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FileText, Plus, Printer, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/teacher/empty-state";
import { PageHeader } from "@/components/teacher/page-header";
import { createLessonPlan } from "@/lib/actions/lesson-plans";

export type LessonPlanData = {
  id: string;
  topicTitle: string | null;
  title: string;
  objectives: string;
  materials: string;
  activities: string;
  homework: string;
  createdAt: string;
};

export function LessonPlansClient({
  teacherId,
  teacherName,
  className,
  topics,
  lessonPlans,
}: {
  teacherId: string;
  teacherName: string;
  className: string;
  topics: { id: string; title: string }[];
  lessonPlans: LessonPlanData[];
}) {
  const [selectedPlan, setSelectedPlan] = useState<LessonPlanData | null>(lessonPlans[0] ?? null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [objectives, setObjectives] = useState("");
  const [materials, setMaterials] = useState("");
  const [activities, setActivities] = useState("");
  const [homework, setHomework] = useState("");
  const [pending, start] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    start(async () => {
      try {
        await createLessonPlan({
          teacherId,
          topicId: topicId || null,
          title: title.trim(),
          objectives: objectives.trim(),
          materials: materials.trim(),
          activities: activities.trim(),
          homework: homework.trim(),
        });
        toast.success(`Đã tạo giáo án "${title}"`);
        setTitle("");
        setObjectives("");
        setMaterials("");
        setActivities("");
        setHomework("");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Tạo thất bại");
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kế hoạch bài dạy (Giáo án)"
        description="Soạn giáo án theo mẫu chuẩn của Bộ Giáo dục và Đào tạo, xuất bản bản in."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button size="sm" className="gap-1.5 bg-[var(--persona)] text-white hover:opacity-90">
                <Plus size={15} /> Soạn giáo án mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Soạn Kế hoạch bài dạy mới</DialogTitle>
              <DialogDescription>
                Điền đầy đủ thông tin để khởi tạo giáo án chuẩn mực.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 pt-2">
              <div>
                <Label htmlFor="lp-title">Tên bài dạy / Tên giáo án</Label>
                <Input
                  id="lp-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Lesson Plan 1 - Greetings & Introduction"
                />
              </div>
              <div>
                <Label htmlFor="lp-topic">Bài học liên quan</Label>
                <Select
                  value={topicId || "none"}
                  onValueChange={(v) => setTopicId(v === "none" || !v ? "" : v)}
                >
                  <SelectTrigger id="lp-topic" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(Không chọn)</SelectItem>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lp-obj">I. Mục tiêu bài học (Objectives)</Label>
                <Textarea
                  id="lp-obj"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="Kiến thức, kỹ năng, thái độ mà học sinh đạt được…"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="lp-mat">II. Thiết bị dạy học &amp; Học liệu (Materials)</Label>
                <Textarea
                  id="lp-mat"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="Máy chiếu, flashcard, phần mềm Beeblast, bài đọc…"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="lp-act">III. Tiến trình dạy học (Activities)</Label>
                <Textarea
                  id="lp-act"
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="1. Khởi động (Warm-up)&#10;2. Khám phá (Presentation)&#10;3. Luyện tập (Practice)&#10;4. Vận dụng (Production)"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="lp-hw">IV. Hướng dẫn về nhà (Homework)</Label>
                <Textarea
                  id="lp-hw"
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  placeholder="Bài tập về nhà trên ứng dụng Beeblast…"
                  rows={2}
                />
              </div>
              <Button type="submit" disabled={pending || !title.trim()} className="w-full mt-2">
                Lưu giáo án
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Saved Plans Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Danh sách giáo án ({lessonPlans.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lessonPlans.length === 0 ? (
              <EmptyState icon={FileText} text="Chưa có giáo án nào được tạo." />
            ) : (
              lessonPlans.map((plan) => {
                const active = selectedPlan?.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`flex cursor-pointer items-center justify-between rounded-md border p-3 transition-all ${
                      active ? "border-2 border-[var(--persona)] bg-[var(--persona-soft)]" : "hover:border-[var(--persona-border)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{plan.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.topicTitle ? `Bài: ${plan.topicTitle}` : "Giáo án chung"}
                      </p>
                    </div>
                    <FileText className="size-4 text-[var(--persona)] shrink-0" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Plan Preview & Printable Layout */}
        <Card className="lg:col-span-2">
          {selectedPlan ? (
            <div>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-lg font-bold">{selectedPlan.title}</CardTitle>
                  <CardDescription>
                    Giáo viên: {teacherName} · Lớp: {className}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Printer size={15} /> In giáo án (PDF)
                </Button>
              </CardHeader>

              {/* Standard Printable Template */}
              <CardContent className="p-6 space-y-5 text-sm">
                <div className="border-b pb-3 text-center">
                  <h2 className="text-base font-bold uppercase tracking-wide">
                    KẾ HOẠCH BÀI DẠY (LESSON PLAN)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Môn: Tiếng Anh · Lớp: {className} · Giáo viên: {teacherName}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-xs mb-1">
                    I. MỤC TIÊU BÀI HỌC (OBJECTIVES)
                  </h3>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedPlan.objectives || "Chưa nhập mục tiêu bài học."}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-xs mb-1">
                    II. THIẾT BỊ DẠY HỌC &amp; HỌC LIỆU (MATERIALS)
                  </h3>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedPlan.materials || "Chưa nhập thiết bị và học liệu."}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-xs mb-1">
                    III. TIẾN TRÌNH DẠY HỌC (ACTIVITIES)
                  </h3>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedPlan.activities || "Chưa nhập tiến trình dạy học."}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-xs mb-1">
                    IV. HƯỚNG DẪN VỀ NHÀ (HOMEWORK)
                  </h3>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedPlan.homework || "Chưa nhập hướng dẫn về nhà."}
                  </p>
                </div>
              </CardContent>
            </div>
          ) : (
            <CardContent className="py-16">
              <EmptyState icon={BookOpen} text="Chọn hoặc khởi tạo một giáo án để xem bản xem trước." />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
