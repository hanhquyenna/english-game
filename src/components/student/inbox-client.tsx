"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, MessageSquare, Send, ShieldCheck, User, UserCheck, Users } from "lucide-react";
import { postClassComment, sendDirectMessage } from "@/lib/actions/chat";
import {
  BlockButton,
  Mono,
  PageIntro,
  PageTitle,
  SectionLabel,
  Tile,
} from "@/components/student/ui";

export type ClassMember = {
  id: string;
  name: string;
  role: "TEACHER" | "STUDENT";
};

export type DirectMessage = {
  id: string;
  senderId: string;
  senderName: string;
  isTeacher: boolean;
  body: string;
  createdAt: string;
};

export type ClassPostCommentData = {
  id: string;
  authorName: string;
  isMe: boolean;
  body: string;
  createdAt: string;
};

export type ClassPostData = {
  id: string;
  text: string;
  teacherName: string;
  createdAt: string;
  comments: ClassPostCommentData[];
};

export function InboxClient({
  studentId,
  teacherName,
  classId,
  teacherId,
  classMembers,
  messages: initialMessages,
  classPosts,
}: {
  studentId: string;
  teacherName: string;
  classId: string;
  teacherId: string;
  classMembers: ClassMember[];
  messages: DirectMessage[];
  classPosts: ClassPostData[];
}) {
  const [tab, setTab] = useState<"chat" | "class">("chat");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(teacherId);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<DirectMessage[]>(initialMessages);
  const [dmInput, setDmInput] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const activeMember = classMembers.find((m) => m.id === selectedMemberId) ?? {
    id: teacherId,
    name: teacherName,
    role: "TEACHER",
  };

  const isTeacher = activeMember.role === "TEACHER";

  function handleSendDm(e: React.FormEvent) {
    e.preventDefault();
    if (!dmInput.trim()) return;

    const text = dmInput.trim();
    setDmInput("");

    // Optimistic UI update
    const newMsg: DirectMessage = {
      id: `temp-${Date.now()}`,
      senderId: studentId,
      senderName: "You",
      isTeacher: false,
      body: text,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, newMsg]);

    start(async () => {
      try {
        await sendDirectMessage({
          classId,
          teacherId,
          studentId,
          senderId: studentId,
          body: text,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Send failed");
      }
    });
  }

  function handleSendComment(postId: string) {
    const text = commentInputs[postId] ?? "";
    if (!text.trim()) return;

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

    start(async () => {
      try {
        await postClassComment({
          classPostId: postId,
          authorId: studentId,
          body: text,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Comment failed");
      }
    });
  }

  return (
    <div className="px-5 pb-[125px] pt-[18px]">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-[34px] items-center justify-center rounded-[2px]"
          style={{ backgroundColor: "var(--st-primary)" }}
          aria-hidden
        >
          <MessageSquare size={18} style={{ color: "var(--st-primary-fg)" }} />
        </span>
        <PageTitle>Inbox &amp; Chat</PageTitle>
      </div>
      <PageIntro>
        Monitored class discussions &amp; direct chat with teachers and classmates.
      </PageIntro>

      {/* Main Tabs (1:1 Chat vs Class Posts) */}
      <div className="flex gap-[7px] pb-[15px]">
        {[
          { key: "chat", label: "Classmate & Teacher Chat", Icon: UserCheck },
          { key: "class", label: "Class Announcements", Icon: Users },
        ].map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as typeof tab)}
              className="flex min-h-[35px] shrink-0 items-center gap-[5px] rounded-[2px] border-2 border-st-fg px-[11px] transition-opacity active:opacity-70"
              style={{
                backgroundColor: on ? "var(--st-primary)" : "var(--st-card)",
              }}
            >
              <t.Icon
                size={14}
                aria-hidden
                style={{
                  color: on ? "var(--st-primary-fg)" : "var(--st-muted-fg)",
                }}
              />
              <Mono
                style={{
                  color: on ? "var(--st-primary-fg)" : "var(--st-muted-fg)",
                }}
              >
                {t.label}
              </Mono>
            </button>
          );
        })}
      </div>

      {tab === "chat" && (
        <div className="flex flex-col gap-3">
          {/* Member selector — Vertical Touch-friendly Dropdown */}
          <div className="relative">
            <Mono className="mb-1.5 block text-st-muted-fg font-extrabold uppercase">
              Người trò chuyện trong lớp:
            </Mono>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex min-h-[44px] items-center justify-between rounded-xl border-2 border-st-fg px-4 py-2.5 shadow-sm transition-transform active:scale-[0.99]"
                style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
              >
                <div className="flex items-center gap-2.5">
                  <User size={18} style={{ color: "var(--st-primary)" }} />
                  <span className="font-extrabold text-sm">
                    {activeMember.name} {activeMember.role === "TEACHER" ? "(Giáo viên)" : "(Học sinh)"}
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  style={{ color: "var(--st-fg)" }}
                />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 z-40 mt-1.5 max-h-60 overflow-y-auto rounded-xl border-2 border-st-fg shadow-2xl py-1 divide-y divide-st-muted"
                  style={{ backgroundColor: "var(--st-card)" }}
                >
                  {classMembers.map((m) => {
                    const active = m.id === selectedMemberId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(m.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex min-h-[44px] items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition-colors ${
                          active ? "bg-st-primary text-st-primary-fg" : "text-st-fg hover:bg-st-bg"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>{m.name}</span>
                        </div>
                        <span className="text-[11px] opacity-80">
                          {m.role === "TEACHER" ? "Giáo viên" : "Bạn cùng lớp"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Safety Monitor Banner */}
          <Tile className="p-3 bg-st-peach flex items-center gap-2">
            <ShieldCheck size={18} className="text-st-primary shrink-0" />
            <Mono className="text-st-fg font-bold">
              {isTeacher
                ? `Direct messages are strictly between you and ${activeMember.name}.`
                : `Monitored thread with ${activeMember.name} — Teacher ${teacherName} monitors all class interactions.`}
            </Mono>
          </Tile>

          {/* Messages list */}
          <div className="flex flex-col gap-2.5 min-h-[220px]">
            {localMessages.length === 0 ? (
              <Mono className="py-8 text-center text-st-muted-fg block">
                No messages yet in thread with {activeMember.name}. Send a message to start!
              </Mono>
            ) : (
              localMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.isTeacher ? "items-start" : "items-end"}`}
                >
                  <Mono className="mb-0.5 text-st-muted-fg text-[9px]">
                    {m.senderName} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Mono>
                  <Tile
                    className="max-w-[85%] p-3"
                    style={{
                      backgroundColor: m.isTeacher ? "var(--st-card)" : "var(--st-primary)",
                      color: m.isTeacher ? "var(--st-fg)" : "var(--st-primary-fg)",
                    }}
                  >
                    <p className="text-[13px] leading-snug">{m.body}</p>
                  </Tile>
                </div>
              ))
            )}
          </div>

          {/* Input bar */}
          <form onSubmit={handleSendDm} className="mt-2 flex gap-2">
            <input
              type="text"
              value={dmInput}
              onChange={(e) => setDmInput(e.target.value)}
              placeholder={`Message ${activeMember.name}…`}
              className="flex-1 rounded-[2px] border-2 border-st-fg bg-st-card px-3 py-2 text-[13px] text-st-fg focus:outline-none"
            />
            <BlockButton tone="primary" type="submit" disabled={pending} className="min-h-[42px] px-4">
              <Send size={15} aria-hidden />
            </BlockButton>
          </form>
        </div>
      )}

      {tab === "class" && (
        <div className="flex flex-col gap-4">
          {classPosts.length === 0 ? (
            <Mono className="py-8 text-center text-st-muted-fg block">
              No class announcements yet.
            </Mono>
          ) : (
            classPosts.map((post) => (
              <Tile key={post.id} className="p-4" style={{ backgroundColor: "var(--st-card)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="st-display text-[14px] text-st-fg font-bold">
                    {post.teacherName}
                  </span>
                  <Mono className="text-st-muted-fg">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Mono>
                </div>
                <p className="text-[13px] text-st-fg leading-relaxed mb-3">{post.text}</p>

                {/* Threaded Comments */}
                <div className="border-t-2 border-st-muted pt-3">
                  <SectionLabel>Comments ({post.comments.length})</SectionLabel>
                  <div className="flex flex-col gap-2 mb-3">
                    {post.comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-[2px] p-2 bg-st-peach border border-st-fg/20"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <Mono className="font-bold text-st-primary">{c.authorName}</Mono>
                          <Mono className="text-st-muted-fg text-[9px]">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Mono>
                        </div>
                        <p className="text-[12px] text-st-fg">{c.body}</p>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] ?? ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="Add a comment…"
                      className="flex-1 rounded-[2px] border-2 border-st-fg bg-st-bg px-2.5 py-1.5 text-[12px] text-st-fg focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleSendComment(post.id)}
                      className="st-mono px-3 py-1.5 rounded-[2px] border-2 border-st-fg bg-st-primary text-st-primary-fg text-[11px] font-black uppercase transition-opacity active:opacity-70"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </Tile>
            ))
          )}
        </div>
      )}
    </div>
  );
}
