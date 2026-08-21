import { Badge } from "@/components/ui/badge";

export type ExerciseSkill = "VOCAB" | "GRAMMAR" | "READING" | "LISTENING" | "WRITING" | "SPEAKING";

export const SKILL_LABELS: Record<ExerciseSkill, string> = {
  VOCAB: "Từ vựng",
  GRAMMAR: "Ngữ pháp",
  READING: "Đọc",
  LISTENING: "Nghe",
  WRITING: "Viết",
  SPEAKING: "Nói",
};

export function CefrBadge({ level }: { level: string }) {
  return <Badge variant="brand">{level}</Badge>;
}

export function SkillBadge({ skill }: { skill: ExerciseSkill | string }) {
  const label = SKILL_LABELS[skill as ExerciseSkill] ?? skill;
  return <Badge variant="secondary">{label}</Badge>;
}

export function StatusBadge({ score, streak }: { score: number; streak: number }) {
  const isWeak = score < 40;
  const lostStreak = streak === 0;

  if (isWeak || lostStreak) {
    return (
      <div className="flex flex-wrap gap-1">
        {isWeak && <Badge variant="danger">Điểm yếu</Badge>}
        {lostStreak && <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold">Mất streak</Badge>}
      </div>
    );
  }

  if (score < 60) return <Badge variant="warning">Cần chú ý</Badge>;
  return <Badge variant="success">Tốt</Badge>;
}
