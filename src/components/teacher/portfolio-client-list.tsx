"use client";

import Link from "next/link";
import { StudentAvatar } from "@/components/student-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mic, Star, CheckCircle, ChevronRight } from "lucide-react";
import type { StudentSummary } from "@/lib/queries";

export interface PortfolioSummary {
  student: StudentSummary;
  journals: any[];
  speakings: any[];
  pendingCount: number;
}

export function PortfolioClientList({
  teacherId,
  portfolios,
}: {
  teacherId: string;
  portfolios: PortfolioSummary[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {portfolios.map(({ student, journals, speakings, pendingCount }) => {
        const latestJournal = journals[0];
        const latestSpeaking = speakings[0];

        return (
          <Card key={student.id} className="border-2 border-st-fg shadow-sm" style={{ backgroundColor: "var(--st-card)" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-st-muted">
              <div className="flex items-center gap-3">
                <StudentAvatar
                  seed={student.avatarSeed}
                  overrides={student.overrides}
                  items={student.items}
                  size={42}
                />
                <div>
                  <CardTitle className="text-base font-bold text-st-fg">{student.name}</CardTitle>
                  <p className="text-xs text-st-muted-fg">
                    {journals.length} bài viết · {speakings.length} bài nói
                  </p>
                </div>
              </div>

              {pendingCount > 0 ? (
                <Badge className="bg-st-peach text-st-fg font-bold border border-st-fg">
                  {pendingCount} chờ duyệt
                </Badge>
              ) : (
                <Badge className="bg-st-mint text-st-fg font-bold border border-st-fg">
                  Đã duyệt hết
                </Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-3 pt-3">
              {/* Latest Journal preview */}
              {latestJournal ? (
                <div className="p-2.5 border-2 border-st-fg rounded-lg text-xs space-y-1" style={{ backgroundColor: "var(--st-bg)" }}>
                  <div className="flex items-center justify-between text-st-primary font-bold">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Nhật ký mới nhất
                    </span>
                    <span className="text-[10px] text-st-muted-fg">
                      {new Date(latestJournal.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-st-fg italic">
                    &ldquo;{latestJournal.text}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="p-2.5 border border-st-muted rounded-lg text-xs text-st-muted-fg" style={{ backgroundColor: "var(--st-bg)" }}>
                  Chưa nộp bài viết nhật ký nào.
                </div>
              )}

              {/* Latest Speaking preview */}
              {latestSpeaking ? (
                <div className="p-2.5 border-2 border-st-fg rounded-lg text-xs flex items-center justify-between font-bold" style={{ backgroundColor: "var(--st-bg)" }}>
                  <span className="flex items-center gap-1.5 text-st-primary">
                    <Mic className="w-3.5 h-3.5" /> Ghi âm bài nói
                  </span>
                  {latestSpeaking.overall_score !== null ? (
                    <span className="font-extrabold text-emerald-700">
                      {latestSpeaking.overall_score} điểm
                    </span>
                  ) : (
                    <span className="text-st-primary font-bold">Chưa chấm</span>
                  )}
                </div>
              ) : null}

              <Link
                href={`/teacher/${teacherId}/portfolio/${student.id}`}
                className="w-full mt-2 flex items-center justify-center gap-1 py-2 font-bold text-xs rounded-lg border-2 border-st-fg transition-opacity active:opacity-80"
                style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
              >
                <span>Xem chi tiết Portfolio</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
