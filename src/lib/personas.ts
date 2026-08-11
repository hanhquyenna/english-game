import type { Enums } from "@/lib/database.types";

export type Persona = "teacher" | "student" | "parent";

export const PERSONA_BY_ROLE: Record<Enums<"user_role">, Persona> = {
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
};

export const PERSONAS: Record<
  Persona,
  { label: string; accent: string; blurb: string }
> = {
  teacher: {
    label: "Giáo viên",
    accent: "#0f6e56",
    blurb: "Xây chương trình, giao bài, chấm điểm, theo dõi cả lớp",
  },
  student: {
    label: "Học sinh",
    accent: "#534ab7",
    blurb: "Luyện tập mỗi ngày, giữ streak, lên trình độ",
  },
  parent: {
    label: "Phụ huynh",
    accent: "#993c1d",
    blurb: "Xem con học mỗi ngày và tiến bộ thật đến đâu",
  },
};

export function homeFor(persona: Persona, userId: string) {
  return `/${persona}/${userId}`;
}

/** Vietnamese labels for the notification feed. */
export const NOTIFICATION_LABELS: Record<
  Enums<"notification_type">,
  { title: string; icon: string }
> = {
  NEW_ASSIGNMENT: { title: "Bài học mới được giao", icon: "📚" },
  EXAM_RESULT: { title: "Có kết quả bài kiểm tra", icon: "📝" },
  LEVEL_UP: { title: "Trình độ cập nhật", icon: "🎯" },
  STREAK_AT_RISK: { title: "Streak sắp mất", icon: "⏰" },
  STREAK_BROKEN: { title: "Streak đã mất", icon: "💔" },
  KUDOS_RECEIVED: { title: "Được tuyên dương", icon: "⭐" },
  CLASS_POST: { title: "Thông báo từ lớp", icon: "📣" },
};

export const KUDOS_LABELS: Record<Enums<"kudos_tag">, string> = {
  HARD_WORK: "Chăm chỉ",
  TEAMWORK: "Hợp tác",
  PERSISTENCE: "Kiên trì",
  ON_TASK: "Tập trung",
  CUSTOM: "Khác",
};

export const EXERCISE_LABELS: Record<Enums<"exercise_type">, string> = {
  MCQ: "Trắc nghiệm",
  FILL_BLANK: "Điền từ",
  MATCHING: "Nối từ",
  VOCAB_CARD: "Thẻ từ vựng",
};
