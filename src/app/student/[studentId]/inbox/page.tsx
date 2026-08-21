import { notFound } from "next/navigation";
import { getClassForStudent, getRoster, getStudentSummary, getUser } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  InboxClient,
  type ClassMember,
  type ClassPostCommentData,
  type ClassPostData,
  type DirectMessage,
} from "@/components/student/inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  params,
}: PageProps<"/student/[studentId]/inbox">) {
  const { studentId } = await params;

  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForStudent(studentId),
  ]);
  if (!student || !klass) notFound();

  const [teacher, roster] = await Promise.all([
    getUser(klass.teacher_id),
    getRoster(klass.id),
  ]);

  const teacherName = teacher?.name ?? "Cô Linh";
  const teacherId = klass.teacher_id;

  const classMembers: ClassMember[] = [
    { id: teacherId, name: teacherName, role: "TEACHER" },
    ...roster
      .filter((s) => s.id !== studentId)
      .map((s) => ({ id: s.id, name: s.name, role: "STUDENT" as const })),
  ];

  const db = createServerSupabase();

  const [{ data: messagesRaw }, { data: postsRaw }, { data: commentsRaw }, { data: usersRaw }] =
    await Promise.all([
      db
        .from("messages")
        .select("*")
        .eq("class_id", klass.id)
        .eq("student_id", studentId)
        .order("created_at", { ascending: true }),
      db
        .from("class_posts")
        .select("*")
        .eq("class_id", klass.id)
        .order("created_at", { ascending: false }),
      db
        .from("class_post_comments")
        .select("*")
        .order("created_at", { ascending: true }),
      db.from("users").select("id, name, role"),
    ]);

  const userMap = new Map((usersRaw ?? []).map((u) => [u.id, u]));

  const messages: DirectMessage[] = (messagesRaw ?? []).map((m) => {
    const sender = userMap.get(m.sender_id);
    return {
      id: m.id,
      senderId: m.sender_id,
      senderName: sender?.name ?? "User",
      isTeacher: sender?.role === "TEACHER",
      body: m.body,
      createdAt: m.created_at,
    };
  });

  const commentsByPost = new Map<string, ClassPostCommentData[]>();
  for (const c of commentsRaw ?? []) {
    const author = userMap.get(c.author_id);
    const list = commentsByPost.get(c.class_post_id) ?? [];
    list.push({
      id: c.id,
      authorName: author?.name ?? "Student",
      isMe: c.author_id === studentId,
      body: c.body,
      createdAt: c.created_at,
    });
    commentsByPost.set(c.class_post_id, list);
  }

  const classPosts: ClassPostData[] = (postsRaw ?? []).map((p) => ({
    id: p.id,
    text: p.text,
    teacherName: teacherName,
    createdAt: p.created_at,
    comments: commentsByPost.get(p.id) ?? [],
  }));

  return (
    <InboxClient
      studentId={studentId}
      teacherName={teacherName}
      classId={klass.id}
      teacherId={teacherId}
      classMembers={classMembers}
      messages={messages}
      classPosts={classPosts}
    />
  );
}
