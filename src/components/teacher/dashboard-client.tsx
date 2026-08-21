"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Award, Users, AlertTriangle, Settings2, Info } from "lucide-react";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StudentAvatar } from "@/components/student-avatar";
import { StreakPill } from "@/components/streak-pill";
import { LevelBar } from "@/components/level-bar";
import { StatusBadge } from "@/components/teacher/badges";
import { PageHeader } from "@/components/teacher/page-header";
import type { StudentSummary } from "@/lib/queries";
import type { EquippedItem, PeepConfig } from "@/lib/peeps";

export type CefrDist = { band: string; count: number };
export type TimelinePoint = { date: string; avgScore: number };

export function DashboardClient({
  teacherId,
  className,
  roster,
  cefrDist,
  timeline,
}: {
  teacherId: string;
  className: string;
  roster: StudentSummary[];
  cefrDist: CefrDist[];
  timeline: TimelinePoint[];
}) {
  const [activeTab, setActiveTab] = useState("class");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [attentionThreshold, setAttentionThreshold] = useState(40);

  const scored = roster.filter((s) => s.level);
  const classAverage =
    scored.length === 0
      ? 0
      : Math.round(
          (scored.reduce((sum, s) => sum + s.level!.compositeScore, 0) /
            scored.length) *
            10,
        ) / 10;

  const needsAttention = useMemo(
    () =>
      roster.filter(
        (s) =>
          s.streakState !== "ACTIVE_TODAY" ||
          (s.level?.compositeScore ?? 0) < attentionThreshold,
      ),
    [roster, attentionThreshold],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan lớp học"
        description={`Lớp ${className} · Theo dõi tình hình học tập và tiến bộ.`}
        action={
          <>
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings2 size={14} /> Tuỳ chỉnh
                  </Button>
                }
              />
              <PopoverContent>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="attention-threshold" className="text-xs">
                      Ngưỡng điểm &quot;cần chú ý&quot;
                    </Label>
                    <Input
                      id="attention-threshold"
                      type="number"
                      min={0}
                      max={100}
                      value={attentionThreshold}
                      onChange={(e) => setAttentionThreshold(Number(e.target.value) || 0)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Học sinh có điểm composite dưới ngưỡng này sẽ hiện trong danh sách cần chú ý.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Link
              href={`/teacher/${teacherId}/roster`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--persona)] hover:underline"
            >
              Xem toàn bộ danh sách →
            </Link>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="class">Theo lớp</TabsTrigger>
          <TabsTrigger value="compare">So sánh các lớp</TabsTrigger>
          <TabsTrigger value="timeline">Theo thời gian</TabsTrigger>
        </TabsList>

        {/* TAB 1: THEO LỚP */}
        <TabsContent value="class" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <span>Điểm trung bình</span>
                  <TooltipProvider>
                    <UiTooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-sky-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Công thức: (Tổng điểm Composite của tất cả học sinh đã đánh giá) / (Số học sinh có điểm). Điểm Composite được tính weight trung bình từ 5 kỹ năng: Hours (20%), Vocab (20%), Exam (20%), Coverage (20%), Grammar (20%).
                      </TooltipContent>
                    </UiTooltip>
                  </TooltipProvider>
                </CardTitle>
                <Award className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[var(--persona)]">
                  {classAverage} / 100
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dựa trên {scored.length}/{roster.length} học sinh có điểm
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <span>Cần chú ý</span>
                  <TooltipProvider>
                    <UiTooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-amber-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Công thức: Đếm số học sinh thỏa mãn ít nhất 1 trong 2 điều kiện: (1) Streak = 0 hôm nay (không làm bài trước 24h), HOẶC (2) Điểm Composite &lt; {attentionThreshold} điểm.
                      </TooltipContent>
                    </UiTooltip>
                  </TooltipProvider>
                </CardTitle>
                <AlertTriangle className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {needsAttention.length}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Học sinh chưa học hôm nay hoặc điểm &lt; {attentionThreshold}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Học sinh cần chú ý
                </CardTitle>
                <AlertTriangle className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {needsAttention.length}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chưa luyện tập hôm nay hoặc điểm &lt; 40
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sĩ số lớp
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{roster.length}</div>
                <p className="mt-1 text-xs text-muted-foreground">Học sinh đang theo học</p>
              </CardContent>
            </Card>
          </div>

          {/* CEFR Distribution Chart */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Phân bố trình độ CEFR
                </CardTitle>
                <CardDescription>
                  Số lượng học sinh theo từng bậc trình độ A1 – C2
                </CardDescription>
              </div>
              <Select value={chartType} onValueChange={(v) => v && setChartType(v as "bar" | "line")}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Biểu đồ cột</SelectItem>
                  <SelectItem value="line">Biểu đồ đường</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={cefrDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="band" tickLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--persona)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={cefrDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="band" tickLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        borderRadius: "6px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--persona)"
                      strokeWidth={2}
                      dot={{ fill: "var(--persona)", r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Needs Attention Roster List */}
          {needsAttention.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-amber-600">
                  Danh sách học sinh cần nhắc nhở
                </CardTitle>
                <CardDescription>
                  Điểm dưới {attentionThreshold}/100 hoặc chưa luyện tập hôm nay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {needsAttention.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <StudentAvatar
                        seed={s.avatarSeed}
                        overrides={s.overrides}
                        items={s.items}
                        size={36}
                      />
                      <div>
                        <p className="font-semibold text-sm">{s.name}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <StreakPill streak={s.streak} state={s.streakState} />
                          <StatusBadge score={s.level?.compositeScore ?? 0} streak={s.streak} />
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/teacher/${teacherId}/student/${s.id}`}
                      className="text-xs font-medium text-[var(--persona)] hover:underline"
                    >
                      Nhắc nhở →
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* TAB 2: SO SÁNH CÁC LỚP */}
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">So sánh các lớp</CardTitle>
              <CardDescription>
                So sánh điểm trung bình và tiến độ giữa các lớp bạn đang giảng dạy
              </CardDescription>
            </CardHeader>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p className="text-sm font-medium text-foreground">
                Bạn hiện tại đang phụ trách 1 lớp ({className}).
              </p>
              <p className="mt-1 text-xs">
                Khi thêm các lớp mới, biểu đồ so sánh giữa các lớp sẽ xuất hiện tại đây.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: THEO THỜI GIAN */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Xu hướng điểm composite theo thời gian
              </CardTitle>
              <CardDescription>
                Lịch sử tăng trưởng điểm trung bình của lớp theo từng tuần
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--persona)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--persona)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tickLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "6px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgScore"
                    stroke="var(--persona)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
