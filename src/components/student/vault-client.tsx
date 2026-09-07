"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  FileText,
  Flame,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
} from "lucide-react";
import { MASTERY_THRESHOLD } from "@/lib/level-engine";
import {
  BlockButton,
  Mono,
  PageIntro,
  PageTitle,
  PageTitleSmall,
  SectionLabel,
  StatusChip,
  Tile,
} from "@/components/student/ui";

export type VaultTabKey = "materials" | "vocab" | "grammar" | "this_week" | "scores";

export type VocabItemData = {
  id: string;
  topic_id: string;
  term: string;
  meaning: string;
  example: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  masteryScore: number;
  lastReviewedAt: string | null;
};

export type GrammarPointData = {
  id: string;
  topic_id: string;
  name: string;
  explanation: string;
  audio_url?: string | null;
  masteryScore: number;
  lastReviewedAt: string | null;
};

export type ScoreData = {
  id: string;
  examId: string;
  examTitle: string;
  score: number | null;
  submittedAt: string;
};

export type TopicData = {
  id: string;
  title: string;
  subtitle: string | null;
};

const TABS: { key: VaultTabKey; label: string; Icon: typeof BookOpen }[] = [
  { key: "materials", label: "Materials", Icon: BookOpen },
  { key: "vocab", label: "My Vocab", Icon: FileText },
  { key: "grammar", label: "My Grammar", Icon: Sparkles },
  { key: "this_week", label: "This Week", Icon: Calendar },
  { key: "scores", label: "Scores", Icon: CheckCircle },
];

export function VaultClient({
  studentId,
  topics,
  vocab,
  grammar,
  scores,
  openUnitId,
}: {
  studentId: string;
  topics: TopicData[];
  vocab: VocabItemData[];
  grammar: GrammarPointData[];
  scores: ScoreData[];
  openUnitId?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<VaultTabKey>("materials");
  const [vocabFilter, setVocabFilter] = useState<"all" | "mastered" | "learning">("all");
  const [grammarFilter, setGrammarFilter] = useState<"all" | "mastered" | "learning">("all");

  // Modal State for Vocab/Grammar Card Modal (A1 & RubeeShine §2.1 Visual Learning)
  const [selectedCard, setSelectedCard] = useState<{
    type: "vocab" | "grammar";
    title: string;
    meaning: string;
    example?: string | null;
    audio_url?: string | null;
    image_url?: string | null;
    id: string;
  } | null>(null);
  const [modalError, setModalError] = useState<boolean>(false);
  const lastClickedId = useRef<string | null>(null);

  const openTopic = openUnitId ? topics.find((t) => t.id === openUnitId) : null;

  const handleCardClick = (
    item: { id: string; title: string; meaning: string; example?: string | null; audio_url?: string | null; image_url?: string | null },
    type: "vocab" | "grammar",
  ) => {
    lastClickedId.current = item.id;
    setModalError(false);

    // Ensure content matches the latest clicked item (A1 requirement 3)
    setTimeout(() => {
      if (lastClickedId.current === item.id) {
        setSelectedCard({
          type,
          id: item.id,
          title: item.title,
          meaning: item.meaning,
          example: item.example,
          audio_url: item.audio_url,
          image_url: item.image_url,
        });
      }
    }, 50);
  };

  const playAudio = (audioUrl?: string | null) => {
    if (!audioUrl) return;
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {});
    } catch {
      // Ignore audio error
    }
  };

  // Unit detail view inside Materials tab
  if (openTopic) {
    const words = vocab.filter((v) => v.topic_id === openTopic.id);
    const rules = grammar.filter((g) => g.topic_id === openTopic.id);

    return (
      <div className="px-5 pb-[125px] pt-[18px]">
        <Link
          href={`/student/${studentId}/vault`}
          className="mb-2 flex min-h-[36px] items-center transition-opacity active:opacity-70"
        >
          <ArrowLeft size={19} style={{ color: "var(--st-primary)" }} />
          <PageTitleSmall>{openTopic.title}</PageTitleSmall>
        </Link>

        <Tile
          className="mb-[14px] p-[15px]"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          <div className="mb-[11px] flex items-center justify-between">
            <span className="st-display text-[14px] text-st-fg">Vocabulary</span>
            <Mono className="text-st-muted-fg">{words.length} words</Mono>
          </div>
          <div className="flex flex-wrap gap-[7px]">
            {words.map((w) => {
              const mastered = w.masteryScore >= MASTERY_THRESHOLD;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() =>
                    handleCardClick(
                      { id: w.id, title: w.term, meaning: w.meaning, example: w.example, audio_url: w.audio_url },
                      "vocab",
                    )
                  }
                  className="px-2.5 py-[7px] rounded text-left transition-transform active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: mastered ? "var(--st-mint)" : "var(--st-lavender)",
                  }}
                >
                  <Mono style={{ color: mastered ? "var(--st-fg)" : "var(--st-primary)" }}>
                    {w.term}
                  </Mono>
                </button>
              );
            })}
          </div>
        </Tile>

        <Tile
          className="mb-[14px] p-[15px]"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          <div className="mb-[11px] flex items-center justify-between">
            <span className="st-display text-[14px] text-st-fg">Grammar</span>
            <Mono className="text-st-muted-fg">
              {rules.length} {rules.length === 1 ? "rule" : "rules"}
            </Mono>
          </div>
          <div className="flex flex-wrap gap-[7px]">
            {rules.length === 0 ? (
              <Mono className="text-st-muted-fg">—</Mono>
            ) : (
              rules.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    handleCardClick(
                      { id: g.id, title: g.name, meaning: g.explanation, audio_url: g.audio_url },
                      "grammar",
                    )
                  }
                  className="px-2.5 py-[7px] rounded text-left transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: "var(--st-lavender)" }}
                >
                  <Mono style={{ color: "var(--st-primary)" }}>{g.name}</Mono>
                </button>
              ))
            )}
          </div>
        </Tile>

        {/* Modal for Card Detail (A1) */}
        {selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-st-card border-2 border-st-fg text-st-fg p-5 rounded-2xl w-full max-w-sm shadow-2xl relative">
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="absolute top-3 right-3 text-st-muted-fg hover:text-st-fg p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              {modalError ? (
                <div className="py-6 text-center space-y-4">
                  <p className="text-st-destructive font-medium">Không thể tải chi tiết thẻ bài.</p>
                  <button
                    type="button"
                    onClick={() => setModalError(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-st-muted border border-st-input rounded-lg text-sm font-bold text-st-fg hover:bg-st-input"
                  >
                    <RotateCcw className="w-4 h-4" /> Thử lại
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-st-input pb-3">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-st-primary">
                      {selectedCard.type === "vocab" ? "Từ vựng" : "Ngữ pháp"}
                    </span>
                    {selectedCard.audio_url ? (
                      <button
                        type="button"
                        onClick={() => playAudio(selectedCard.audio_url)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-st-primary hover:bg-st-primary/80 text-st-primary-fg font-bold rounded-lg text-xs transition-colors"
                      >
                        <Volume2 className="w-4 h-4" /> Phát âm
                      </button>
                    ) : (
                      <span
                        className="flex items-center gap-1 px-3 py-1.5 bg-st-muted text-st-muted-fg rounded-lg text-xs font-semibold cursor-not-allowed"
                        title="Chưa có audio"
                      >
                        <VolumeX className="w-4 h-4" /> Chưa có audio
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-st-accent">{selectedCard.title}</h3>
                    <p className="text-st-fg mt-2 text-base leading-relaxed font-medium">
                      {selectedCard.meaning}
                    </p>
                    {selectedCard.example && (
                      <div className="mt-3 p-3 bg-st-muted/80 rounded-xl border border-st-input/60">
                        <span className="block text-[11px] text-st-muted-fg uppercase font-bold">Ví dụ:</span>
                        <p className="text-xs italic text-st-muted-fg mt-0.5">&ldquo;{selectedCard.example}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Filtered Vocab
  const filteredVocab = vocab.filter((w) => {
    if (vocabFilter === "mastered") return w.masteryScore >= MASTERY_THRESHOLD;
    if (vocabFilter === "learning") return w.masteryScore < MASTERY_THRESHOLD;
    return true;
  });

  // Filtered Grammar
  const filteredGrammar = grammar.filter((g) => {
    if (grammarFilter === "mastered") return g.masteryScore >= MASTERY_THRESHOLD;
    if (grammarFilter === "learning") return g.masteryScore < MASTERY_THRESHOLD;
    return true;
  });

  // This Week items
  const now = new Date().getTime();
  const weekMs = 7 * 86400 * 1000;
  const thisWeekVocab = vocab.filter(
    (w) => w.lastReviewedAt && now - new Date(w.lastReviewedAt).getTime() <= weekMs,
  );
  const thisWeekGrammar = grammar.filter(
    (g) => g.lastReviewedAt && now - new Date(g.lastReviewedAt).getTime() <= weekMs,
  );

  return (
    <div className="pb-[125px] pt-2 space-y-4">
      {/* FEATURE HEADER WITH QUIT TO MAP BUTTON */}
      <div className="flex items-center justify-between border-b-2 border-st-fg pb-4">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-[34px] items-center justify-center rounded-[2px]"
            style={{ backgroundColor: "var(--st-fg)" }}
            aria-hidden
          >
            <Archive size={18} style={{ color: "var(--st-primary-fg)" }} />
          </span>
          <div>
            <PageTitle>Vault Bank</PageTitle>
            <PageIntro>
              All saved vocabulary words, grammar rules, and exam scores.
            </PageIntro>
          </div>
        </div>

        <Link href={`/student/${studentId}`}>
          <button className="flex items-center gap-2 rounded-xl border-2 border-st-fg bg-st-primary px-4 py-2 text-xs font-black uppercase text-st-primary-fg shadow-md transition-transform active:scale-95">
            <span>QUIT TO MAP</span>
          </button>
        </Link>
      </div>

      {/* SRS Review Banner CTA */}
      <Tile className="mb-[17px] p-4" style={{ backgroundColor: "var(--st-peach)" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="st-display block text-[16px] text-st-fg">Flashcard Spaced Review</span>
            <Mono className="mt-0.5 block text-st-primary font-bold">
              +20 Gems Reward
            </Mono>
          </div>
          <Link href={`/student/${studentId}/vault/review`}>
            <BlockButton tone="primary" className="min-h-[42px] px-4 text-[11px]">
              <Flame size={15} aria-hidden /> Review Now
            </BlockButton>
          </Link>
        </div>
      </Tile>

      {/* A2 Tabs Row: overflow-x-auto on mobile, flex-wrap on md+ screens */}
      <div className="flex gap-[7px] overflow-x-auto md:flex-wrap pb-[17px] scrollbar-none">
        {TABS.map((t) => {
          const on = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
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

      {/* TAB CONTENT */}
      {activeTab === "materials" && (
        <>
          {topics.length === 0 ? (
            <Mono className="block py-8 text-center text-st-muted-fg">
              Kho sẽ tự động lấp đầy khi giáo viên giao các bài học mới.
            </Mono>
          ) : (
            topics.map((t, i) => {
              const words = vocab.filter((v) => v.topic_id === t.id);
              const rules = grammar.filter((g) => g.topic_id === t.id);
              return (
                <Link
                  key={t.id}
                  href={`/student/${studentId}/vault?unit=${t.id}`}
                  className="mb-2.5 flex min-h-[72px] items-center gap-3 rounded-[2px] border-2 border-st-fg p-[13px] transition-opacity active:opacity-70"
                  style={{ backgroundColor: "var(--st-card)" }}
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-[2px]"
                    style={{ backgroundColor: "var(--st-lavender)" }}
                    aria-hidden
                  >
                    <Mono style={{ color: "var(--st-primary)" }}>U{i + 1}</Mono>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="st-display mb-[3px] block truncate text-[14px] text-st-fg">
                      {t.title}
                    </span>
                    <Mono className="block text-st-muted-fg">
                      {words.length} từ · {rules.length} mẫu ngữ pháp
                    </Mono>
                  </span>
                  <ChevronRight
                    size={18}
                    style={{ color: "var(--st-muted-fg)" }}
                    aria-hidden
                  />
                </Link>
              );
            })
          )}
        </>
      )}

      {activeTab === "vocab" && (
        <div>
          <div className="mb-3 flex gap-2">
            {(["all", "mastered", "learning"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setVocabFilter(f)}
                className="px-2.5 py-1 text-[11px] font-bold uppercase transition-opacity"
                style={{
                  backgroundColor: vocabFilter === f ? "var(--st-fg)" : "var(--st-muted)",
                  color: vocabFilter === f ? "var(--st-card)" : "var(--st-fg)",
                }}
              >
                {f === "all" ? "Tất cả" : f === "mastered" ? "Đã thuộc" : "Đang học"}
              </button>
            ))}
          </div>
          {filteredVocab.length === 0 ? (
            <Mono className="block py-6 text-center text-st-muted-fg">Không có từ vựng phù hợp bộ lọc</Mono>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredVocab.map((w) => {
                const mastered = w.masteryScore >= MASTERY_THRESHOLD;
                return (
                  <Tile
                    key={w.id}
                    onClick={() =>
                      handleCardClick(
                        { id: w.id, title: w.term, meaning: w.meaning, example: w.example, audio_url: w.audio_url },
                        "vocab",
                      )
                    }
                    className="p-3 cursor-pointer hover:border-st-primary transition-colors"
                    style={{ backgroundColor: "var(--st-card)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="st-display text-[15px] text-st-fg">{w.term}</span>
                      <StatusChip status={mastered ? "DONE" : "PENDING"} />
                    </div>
                    <Mono className="mt-1 block text-st-muted-fg">{w.meaning}</Mono>
                    {w.example && (
                      <p className="mt-1 text-[12px] italic text-st-fg">&ldquo;{w.example}&rdquo;</p>
                    )}
                  </Tile>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "grammar" && (
        <div>
          <div className="mb-3 flex gap-2">
            {(["all", "mastered", "learning"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setGrammarFilter(f)}
                className="px-2.5 py-1 text-[11px] font-bold uppercase transition-opacity"
                style={{
                  backgroundColor: grammarFilter === f ? "var(--st-fg)" : "var(--st-muted)",
                  color: grammarFilter === f ? "var(--st-card)" : "var(--st-fg)",
                }}
              >
                {f === "all" ? "Tất cả" : f === "mastered" ? "Đã thuộc" : "Đang học"}
              </button>
            ))}
          </div>
          {filteredGrammar.length === 0 ? (
            <Mono className="block py-6 text-center text-st-muted-fg">Không có mẫu ngữ pháp phù hợp</Mono>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredGrammar.map((g) => {
                const mastered = g.masteryScore >= MASTERY_THRESHOLD;
                return (
                  <Tile
                    key={g.id}
                    onClick={() =>
                      handleCardClick(
                        { id: g.id, title: g.name, meaning: g.explanation, audio_url: g.audio_url },
                        "grammar",
                      )
                    }
                    className="p-3 cursor-pointer hover:border-st-primary transition-colors"
                    style={{ backgroundColor: "var(--st-card)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="st-display text-[15px] text-st-fg">{g.name}</span>
                      <StatusChip status={mastered ? "DONE" : "PENDING"} />
                    </div>
                    <p className="mt-1 text-[12px] text-st-fg">{g.explanation}</p>
                  </Tile>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "this_week" && (
        <div>
          <SectionLabel>Từ vựng đã ôn tuần này ({thisWeekVocab.length})</SectionLabel>
          {thisWeekVocab.length === 0 ? (
            <Mono className="block py-3 text-st-muted-fg">Chưa có từ vựng nào được ôn tuần này.</Mono>
          ) : (
            <div className="mb-4 flex flex-col gap-2">
              {thisWeekVocab.map((w) => (
                <Tile key={w.id} className="p-2.5" style={{ backgroundColor: "var(--st-card)" }}>
                  <div className="flex items-center justify-between">
                    <span className="st-display text-[14px] text-st-fg">{w.term}</span>
                    <Mono className="text-st-primary font-bold">{w.masteryScore}% thành thạo</Mono>
                  </div>
                </Tile>
              ))}
            </div>
          )}

          <SectionLabel>Ngữ pháp đã ôn tuần này ({thisWeekGrammar.length})</SectionLabel>
          {thisWeekGrammar.length === 0 ? (
            <Mono className="block py-3 text-st-muted-fg">Chưa có ngữ pháp nào được ôn tuần này.</Mono>
          ) : (
            <div className="flex flex-col gap-2">
              {thisWeekGrammar.map((g) => (
                <Tile key={g.id} className="p-2.5" style={{ backgroundColor: "var(--st-card)" }}>
                  <div className="flex items-center justify-between">
                    <span className="st-display text-[14px] text-st-fg">{g.name}</span>
                    <Mono className="text-st-primary font-bold">{g.masteryScore}% thành thạo</Mono>
                  </div>
                </Tile>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "scores" && (
        <div>
          {scores.length === 0 ? (
            <Mono className="block py-8 text-center text-st-muted-fg">
              Chưa có lịch sử làm bài kiểm tra nào.
            </Mono>
          ) : (
            <div className="flex flex-col gap-2.5">
              {scores.map((s) => (
                <Tile key={s.id} className="p-3.5" style={{ backgroundColor: "var(--st-card)" }}>
                  <div className="flex items-center justify-between">
                    <span className="st-display text-[15px] text-st-fg">{s.examTitle}</span>
                    <StatusChip status={s.score !== null ? "DONE" : "PENDING"} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Mono className="text-st-muted-fg">
                      {new Date(s.submittedAt).toLocaleDateString("vi-VN")}
                    </Mono>
                    <Mono className="font-extrabold text-st-primary text-[14px]">
                      {s.score !== null ? `Điểm: ${s.score}%` : "Chờ chấm điểm"}
                    </Mono>
                  </div>
                </Tile>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for Card Detail (A1) */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-st-card border-2 border-st-fg text-st-fg p-5 rounded-2xl w-full max-w-sm shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="absolute top-3 right-3 text-st-muted-fg hover:text-st-fg p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {modalError ? (
              <div className="py-6 text-center space-y-4">
                <p className="text-st-destructive font-medium">Không thể tải chi tiết thẻ bài.</p>
                <button
                  type="button"
                  onClick={() => setModalError(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-st-muted border border-st-input rounded-lg text-sm font-bold text-st-fg hover:bg-st-input"
                >
                  <RotateCcw className="w-4 h-4" /> Thử lại
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-st-input pb-3">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-st-primary">
                    {selectedCard.type === "vocab" ? "Từ vựng" : "Ngữ pháp"}
                  </span>
                  {selectedCard.audio_url ? (
                    <button
                      type="button"
                      onClick={() => playAudio(selectedCard.audio_url)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-st-primary hover:bg-st-primary/80 text-st-primary-fg font-bold rounded-lg text-xs transition-colors"
                    >
                      <Volume2 className="w-4 h-4" /> Phát âm
                    </button>
                  ) : (
                    <span
                      className="flex items-center gap-1 px-3 py-1.5 bg-st-muted text-st-muted-fg rounded-lg text-xs font-semibold cursor-not-allowed"
                      title="Chưa có audio"
                    >
                      <VolumeX className="w-4 h-4" /> Chưa có audio
                    </span>
                  )}
                </div>

                <div>
                  {selectedCard.image_url && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-st-fg bg-st-muted flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedCard.image_url}
                        alt={selectedCard.title}
                        className="max-h-40 w-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-2xl font-black text-st-accent">{selectedCard.title}</h3>
                  <p className="text-st-fg mt-2 text-base leading-relaxed font-medium">
                    {selectedCard.meaning}
                  </p>
                  {selectedCard.example && (
                    <div className="mt-3 p-3 bg-st-muted/80 rounded-xl border border-st-input/60">
                      <span className="block text-[11px] text-st-muted-fg uppercase font-bold">Ví dụ:</span>
                      <p className="text-xs italic text-st-muted-fg mt-0.5">&ldquo;{selectedCard.example}&rdquo;</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
