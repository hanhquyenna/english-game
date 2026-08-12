import Link from "next/link";
import { getUsers, getLatestLevels } from "@/lib/queries";
import { PERSONA_BY_ROLE, PERSONAS, homeFor } from "@/lib/personas";
import { StudentAvatar } from "@/components/student-avatar";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RolePicker() {
  const users = await getUsers();
  const db = createServerSupabase();

  const students = users.filter((u) => u.role === "STUDENT");
  const [levels, { data: avatars }] = await Promise.all([
    getLatestLevels(students.map((s) => s.id)),
    db.from("student_avatars").select("student_id, base_avatar_seed"),
  ]);
  const seedFor = new Map(
    (avatars ?? []).map((a) => [a.student_id, a.base_avatar_seed]),
  );

  const groups = (["teacher", "student", "parent"] as const).map((persona) => ({
    persona,
    users: users.filter((u) => PERSONA_BY_ROLE[u.role] === persona),
  }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">
          BEEBLAST
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Chọn người dùng để bắt đầu
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Luyện tập tiếng Anh mỗi ngày theo đúng chương trình cô giáo dạy trên
          lớp. Trình độ CEFR là một con số thật, minh bạch — và cả ba vai đều
          nhìn thấy nó thay đổi cùng lúc.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Mẹo cho buổi demo: mở ba tab cạnh nhau — Cô Linh, Minh và Chị Hoa —
          rồi thao tác ở một tab và xem hai tab kia tự cập nhật.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {groups.map(({ persona, users: list }) => (
          <section
            key={persona}
            data-persona={persona}
            className="rounded-xl border bg-card p-5 shadow-sm"
            style={{ borderColor: "var(--persona-border)" }}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: "var(--persona)" }}
              />
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--persona)" }}
              >
                {PERSONAS[persona].label}
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {PERSONAS[persona].blurb}
            </p>

            <ul className="space-y-2">
              {list.map((u) => {
                const level = levels.get(u.id);
                return (
                  <li key={u.id}>
                    <Link
                      href={homeFor(persona, u.id)}
                      className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 transition-colors hover:bg-[var(--persona-soft)]"
                    >
                      {persona === "student" ? (
                        <StudentAvatar
                          seed={seedFor.get(u.id) ?? u.id}
                          size={36}
                          ring="var(--persona)"
                        />
                      ) : (
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: "var(--persona)" }}
                        >
                          {u.name.slice(0, 1)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {u.name}
                        </span>
                        {level ? (
                          <span className="block text-xs text-muted-foreground">
                            {level.cefrBand} · {level.compositeScore}/100
                          </span>
                        ) : null}
                      </span>
                      <span aria-hidden className="text-muted-foreground">
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-10 text-xs text-muted-foreground">
        Bản demo — không có đăng nhập, dữ liệu là dữ liệu mẫu.
      </footer>
    </main>
  );
}
