/**
 * Seed data (§5 of the build plan).
 *
 * Cô Linh's class "B1 – Sáng Thứ 7", 3 built units, 4 students, 1 parent.
 * The demo starts mid-story, not at zero, so the numbers on screen have
 * somewhere to move from.
 *
 * Run with:  npm run seed
 *
 * Deliberate starting state, tuned so §7 step 1 reads exactly as written
 * ("B1, 40% to B2, weakest input: grammar"):
 *   Unit 1  assigned, Minh 100% complete
 *   Unit 2  assigned, Minh 40% complete, exam submitted but NOT graded
 *   Unit 3  built but NOT assigned  -> the teacher assigns it live in step 2
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { addDays, isoDate } from "../src/lib/progression";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in .env.local");
}

const db = createClient(url, key, { auth: { persistSession: false } });

// ---------------------------------------------------------------- fixed ids
const U = (prefix: string, n: number) =>
  `${prefix}-0000-4000-8000-${n.toString().padStart(12, "0")}`;

const TEACHER = U("aaaaaaaa", 1);
const STUDENTS = {
  minh: U("bbbbbbbb", 1),
  an: U("bbbbbbbb", 2),
  bao: U("bbbbbbbb", 3),
  chi: U("bbbbbbbb", 4),
};
const PARENT = U("cccccccc", 1);
const CLASS = U("dddddddd", 1);
const TOPIC = [U("eeeeeeee", 1), U("eeeeeeee", 2), U("eeeeeeee", 3)];

const vocabId = (n: number) => U("f0000001", n);
const grammarId = (n: number) => U("f0000002", n);
const exerciseId = (n: number) => U("f0000003", n);
const examId = (n: number) => U("f0000004", n);
const avatarId = (n: number) => U("f0000005", n);

const TODAY = isoDate();

// ---------------------------------------------------------------- curriculum
type VocabSeed = { term: string; meaning: string; example: string };
type GrammarSeed = { name: string; explanation: string };

const UNITS: Array<{
  title: string;
  subtitle: string;
  vocab: VocabSeed[];
  grammar: GrammarSeed[];
}> = [
  {
    title: "Unit 1: Greetings",
    subtitle: "Everyday life & greetings",
    vocab: [
      { term: "greet", meaning: "chào hỏi", example: "She greeted me with a warm smile." },
      { term: "introduce", meaning: "giới thiệu", example: "Let me introduce my friend Nam." },
      { term: "polite", meaning: "lịch sự", example: "It is polite to say thank you." },
      { term: "formal", meaning: "trang trọng", example: "We use formal language in a job interview." },
      { term: "informal", meaning: "thân mật, suồng sã", example: '"Hi" is an informal greeting.' },
      { term: "welcome", meaning: "chào mừng", example: "Welcome to our school!" },
      { term: "farewell", meaning: "lời tạm biệt", example: "They said farewell at the airport." },
      { term: "acquaintance", meaning: "người quen", example: "He is an acquaintance, not a close friend." },
    ],
    grammar: [
      {
        name: "Present Simple",
        explanation:
          "Thì hiện tại đơn — dùng cho thói quen và sự thật hiển nhiên. S + V(s/es). Ví dụ: She works in Hanoi.",
      },
      {
        name: "Wh- questions",
        explanation:
          "Câu hỏi với What / Where / When / Who / How. Cấu trúc: Wh- + trợ động từ + S + V? Ví dụ: Where do you live?",
      },
    ],
  },
  {
    title: "Unit 2: Family",
    subtitle: "Family & relationships",
    vocab: [
      { term: "relative", meaning: "họ hàng", example: "All our relatives came to the wedding." },
      { term: "sibling", meaning: "anh chị em ruột", example: "I have two siblings, a brother and a sister." },
      { term: "household", meaning: "hộ gia đình", example: "There are five people in our household." },
      { term: "generation", meaning: "thế hệ", example: "Three generations live in this house." },
      { term: "supportive", meaning: "biết ủng hộ, hỗ trợ", example: "My parents are very supportive of my studies." },
      { term: "strict", meaning: "nghiêm khắc", example: "My father is strict about homework." },
      { term: "raise", meaning: "nuôi dạy", example: "They raised four children in the countryside." },
      { term: "resemble", meaning: "trông giống", example: "She resembles her grandmother." },
    ],
    grammar: [
      {
        name: "Possessives",
        explanation:
          "Sở hữu — tính từ sở hữu (my, your, his, her, our, their) + danh từ; hoặc 's với người. Ví dụ: Minh's sister.",
      },
      {
        name: "Comparative adjectives",
        explanation:
          "So sánh hơn — tính từ ngắn + -er + than; tính từ dài dùng more + adj + than. Ví dụ: taller than / more supportive than.",
      },
    ],
  },
  {
    title: "Unit 3: Daily Routine",
    subtitle: "School & daily routines",
    vocab: [
      { term: "routine", meaning: "thói quen hằng ngày", example: "My morning routine starts at six." },
      { term: "commute", meaning: "đi lại (đi học, đi làm)", example: "I commute to school by bus." },
      { term: "chore", meaning: "việc vặt trong nhà", example: "Washing dishes is my least favourite chore." },
      { term: "errand", meaning: "việc vặt bên ngoài", example: "I ran a few errands after class." },
      { term: "schedule", meaning: "lịch trình", example: "My schedule is full on Saturdays." },
      { term: "leisure", meaning: "thời gian rảnh rỗi", example: "I read comics in my leisure time." },
      { term: "punctual", meaning: "đúng giờ", example: "Please be punctual for the exam." },
      { term: "postpone", meaning: "hoãn lại", example: "We postponed the trip until next month." },
    ],
    grammar: [
      {
        name: "Adverbs of frequency",
        explanation:
          "Trạng từ tần suất — always, usually, often, sometimes, never. Đứng trước động từ thường, sau động từ to be.",
      },
      {
        name: "Present Continuous",
        explanation:
          "Thì hiện tại tiếp diễn — S + am/is/are + V-ing, cho hành động đang xảy ra lúc nói. Ví dụ: I am studying now.",
      },
    ],
  },
];

/** MCQ / fill-blank / matching per unit, tied to that unit's grammar points. */
const PRACTICE: Array<
  Array<
    | { type: "MCQ"; grammar: number; content: Record<string, unknown> }
    | { type: "FILL_BLANK"; grammar: number; content: Record<string, unknown> }
    | { type: "MATCHING"; content: Record<string, unknown> }
  >
> = [
  [
    {
      type: "MCQ",
      grammar: 0,
      content: {
        prompt: "She ____ to school every morning.",
        options: ["go", "goes", "going", "is go"],
        answerIndex: 1,
        explanation: "Hiện tại đơn với chủ ngữ số ít: thêm -es.",
      },
    },
    {
      type: "MCQ",
      grammar: 1,
      content: {
        prompt: "____ do you live?",
        options: ["What", "Who", "Where", "When"],
        answerIndex: 2,
        explanation: "Hỏi về nơi chốn dùng Where.",
      },
    },
    {
      type: "MCQ",
      grammar: 0,
      content: {
        prompt: 'Which greeting is the most formal?',
        options: ["Hey!", "Hi there", "Good morning, sir", "What's up"],
        answerIndex: 2,
        explanation: "Good morning, sir là cách chào trang trọng nhất.",
      },
    },
    {
      type: "FILL_BLANK",
      grammar: 0,
      content: {
        prompt: "My name ___ Minh. Nice to meet you.",
        answer: "is",
        hint: "động từ to be, ngôi thứ ba số ít",
      },
    },
    {
      type: "FILL_BLANK",
      grammar: 1,
      content: {
        prompt: "___ is your English teacher?",
        answer: "Who",
        hint: "hỏi về người",
      },
    },
    {
      type: "MATCHING",
      content: {
        instructions: "Nối từ với nghĩa tiếng Việt.",
        pairs: [
          { left: "greet", right: "chào hỏi" },
          { left: "polite", right: "lịch sự" },
          { left: "farewell", right: "lời tạm biệt" },
          { left: "acquaintance", right: "người quen" },
        ],
      },
    },
  ],
  [
    {
      type: "MCQ",
      grammar: 0,
      content: {
        prompt: "This is ____ sister. Her name is Lan.",
        options: ["I", "me", "my", "mine"],
        answerIndex: 2,
        explanation: "Trước danh từ dùng tính từ sở hữu: my.",
      },
    },
    {
      type: "MCQ",
      grammar: 1,
      content: {
        prompt: "My brother is ____ than me.",
        options: ["tall", "taller", "tallest", "more tall"],
        answerIndex: 1,
        explanation: "Tính từ ngắn: thêm -er + than.",
      },
    },
    {
      type: "MCQ",
      grammar: 1,
      content: {
        prompt: "My mother is ____ than my father.",
        options: ["supportiver", "more supportive", "most supportive", "supportive"],
        answerIndex: 1,
        explanation: "Tính từ dài dùng more + adj + than.",
      },
    },
    {
      type: "FILL_BLANK",
      grammar: 0,
      content: {
        prompt: "My mother is very ___ of my studies.",
        answer: "supportive",
        hint: "tính từ: biết ủng hộ, hỗ trợ",
      },
    },
    {
      type: "FILL_BLANK",
      grammar: 1,
      content: {
        prompt: "Three ___ live in this house: grandparents, parents and children.",
        answer: "generations",
        hint: "số nhiều của generation",
      },
    },
    {
      type: "MATCHING",
      content: {
        instructions: "Nối từ với nghĩa tiếng Việt.",
        pairs: [
          { left: "sibling", right: "anh chị em ruột" },
          { left: "strict", right: "nghiêm khắc" },
          { left: "raise", right: "nuôi dạy" },
          { left: "resemble", right: "trông giống" },
        ],
      },
    },
  ],
  [
    {
      type: "MCQ",
      grammar: 0,
      content: {
        prompt: "I ____ get up at 6 a.m.",
        options: ["usually", "am usually", "usually am", "be usually"],
        answerIndex: 0,
        explanation: "Trạng từ tần suất đứng trước động từ thường.",
      },
    },
    {
      type: "MCQ",
      grammar: 1,
      content: {
        prompt: "Look! She ____ her homework right now.",
        options: ["does", "do", "is doing", "doing"],
        answerIndex: 2,
        explanation: "Hành động đang xảy ra: hiện tại tiếp diễn.",
      },
    },
    {
      type: "MCQ",
      grammar: 0,
      content: {
        prompt: "He is ____ late for class.",
        options: ["never", "never be", "be never", "nevers"],
        answerIndex: 0,
        explanation: "Sau động từ to be, trạng từ tần suất đứng ngay sau.",
      },
    },
    {
      type: "FILL_BLANK",
      grammar: 1,
      content: {
        prompt: "We ___ studying English at the moment.",
        answer: "are",
        hint: "to be với chủ ngữ we",
      },
    },
    {
      type: "FILL_BLANK",
      grammar: 0,
      content: {
        prompt: "I ___ commute by bus, about four times a week.",
        answer: "usually",
        hint: "trạng từ tần suất, khoảng 80%",
      },
    },
    {
      type: "MATCHING",
      content: {
        instructions: "Nối từ với nghĩa tiếng Việt.",
        pairs: [
          { left: "commute", right: "đi lại hằng ngày" },
          { left: "chore", right: "việc vặt trong nhà" },
          { left: "punctual", right: "đúng giờ" },
          { left: "postpone", right: "hoãn lại" },
        ],
      },
    },
  ],
];

// ---------------------------------------------------------------- helpers
/** One TRUNCATE ... CASCADE in the database — see 0003_reset_demo_data.sql. */
async function wipe() {
  const { error } = await db.rpc("reset_demo_data");
  if (error) throw new Error(`reset_demo_data: ${error.message}`);
}

function ok(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`);
  console.log(`  ✓ ${label}`);
}

// ---------------------------------------------------------------- main
async function main() {
  console.log("Clearing existing rows…");
  await wipe();

  console.log("Seeding…");

  // people
  ok(
    "users",
    (
      await db.from("users").insert([
        { id: TEACHER, name: "Cô Linh", role: "TEACHER" },
        { id: STUDENTS.minh, name: "Minh", role: "STUDENT" },
        { id: STUDENTS.an, name: "An", role: "STUDENT" },
        { id: STUDENTS.bao, name: "Bảo", role: "STUDENT" },
        { id: STUDENTS.chi, name: "Chi", role: "STUDENT" },
        { id: PARENT, name: "Chị Hoa", role: "PARENT" },
      ])
    ).error,
  );

  ok(
    "class",
    (
      await db.from("classes").insert({
        id: CLASS,
        name: "B1 – Sáng Thứ 7",
        teacher_id: TEACHER,
        cefr_level: "B1",
      })
    ).error,
  );

  ok(
    "enrollments",
    (
      await db.from("enrollments").insert(
        Object.values(STUDENTS).map((student_id) => ({
          student_id,
          class_id: CLASS,
        })),
      )
    ).error,
  );

  ok(
    "parent link",
    (
      await db
        .from("parent_links")
        .insert({ parent_id: PARENT, student_id: STUDENTS.minh })
    ).error,
  );

  // curriculum — Unit 3 is built but deliberately left unassigned
  ok(
    "topics",
    (
      await db.from("topics").insert(
        UNITS.map((u, i) => ({
          id: TOPIC[i],
          class_id: CLASS,
          title: u.title,
          subtitle: u.subtitle,
          order: i + 1,
          cefr_level: "B1",
          assigned_at: i < 2 ? new Date(Date.now() - 86400000 * 20).toISOString() : null,
        })),
      )
    ).error,
  );

  const vocabRows: Array<Record<string, unknown>> = [];
  const grammarRows: Array<Record<string, unknown>> = [];
  const exerciseRows: Array<Record<string, unknown>> = [];
  let vN = 0;
  let gN = 0;
  let eN = 0;

  // Index maps so exercises can point at the right vocab / grammar rows.
  const vocabIdsByTopic: string[][] = [[], [], []];
  const grammarIdsByTopic: string[][] = [[], [], []];
  const exerciseIdsByTopic: string[][] = [[], [], []];

  UNITS.forEach((unit, ti) => {
    unit.vocab.forEach((v) => {
      const id = vocabId(++vN);
      vocabIdsByTopic[ti].push(id);
      vocabRows.push({
        id,
        topic_id: TOPIC[ti],
        term: v.term,
        meaning: v.meaning,
        example: v.example,
        cefr_level: "B1",
      });
      // Every vocab item gets a flashcard exercise.
      const exId = exerciseId(++eN);
      exerciseIdsByTopic[ti].push(exId);
      exerciseRows.push({
        id: exId,
        topic_id: TOPIC[ti],
        type: "VOCAB_CARD",
        vocab_item_id: id,
        content: { term: v.term, meaning: v.meaning, example: v.example },
        created_by_teacher_id: TEACHER,
      });
    });

    unit.grammar.forEach((g) => {
      const id = grammarId(++gN);
      grammarIdsByTopic[ti].push(id);
      grammarRows.push({
        id,
        topic_id: TOPIC[ti],
        name: g.name,
        explanation: g.explanation,
        cefr_level: "B1",
      });
    });
  });

  ok("vocab items", (await db.from("vocab_items").insert(vocabRows)).error);
  ok("grammar points", (await db.from("grammar_points").insert(grammarRows)).error);

  PRACTICE.forEach((items, ti) => {
    items.forEach((item) => {
      const exId = exerciseId(++eN);
      exerciseIdsByTopic[ti].push(exId);
      exerciseRows.push({
        id: exId,
        topic_id: TOPIC[ti],
        type: item.type,
        grammar_point_id:
          "grammar" in item ? grammarIdsByTopic[ti][item.grammar] : null,
        content: item.content,
        created_by_teacher_id: TEACHER,
      });
    });
  });

  ok("exercises", (await db.from("exercises").insert(exerciseRows)).error);

  // ------------------------------------------------------------- avatars
  const rankFrames = [
    { band: "A1", color: "#94a3b8" },
    { band: "A2", color: "#38bdf8" },
    { band: "B1", color: "#534ab7" },
    { band: "B2", color: "#0f6e56" },
    { band: "C1", color: "#b45309" },
    { band: "C2", color: "#be123c" },
  ];
  // Items layered on the Open Peeps character. `image_url` is the filename
  // stem in public/assets/items; `slot` says where it sits on the figure.
  const accessories = [
    { label: "Mũ hề", icon: "jester-hat", slot: "hat", rule: "streak:3", cost: 0 },
    { label: "Mũ tốt nghiệp", icon: "study-cap", slot: "hat", rule: "streak:7", cost: 150 },
    { label: "Vương miện", icon: "crown", slot: "hat", rule: "streak:14", cost: 300 },
    { label: "Ngọn lửa 30 ngày", icon: "flame", slot: "badge", rule: "streak:30", cost: 0 },
    { label: "Huy chương", icon: "medal", slot: "badge", rule: "xp:250", cost: 100 },
    { label: "Ngọc quý", icon: "gem", slot: "badge", rule: "xp:500", cost: 200 },
  ];

  let aN = 0;
  const avatarRows = [
    // Explicit slot/cost: a bulk insert takes the union of every object's keys
    // and nulls anything missing, so column defaults never get a chance to apply.
    ...rankFrames.map((f) => ({
      id: avatarId(++aN),
      image_url: f.color,
      category: "RANK_FRAME" as const,
      label: `Khung ${f.band}`,
      unlock_rule: `cefr:${f.band}`,
      slot: null,
      cost: 0,
    })),
    ...accessories.map((a) => ({
      id: avatarId(++aN),
      image_url: a.icon,
      category: "ACCESSORY" as const,
      label: a.label,
      unlock_rule: a.rule,
      slot: a.slot,
      cost: a.cost,
    })),
  ];
  ok("avatars", (await db.from("avatars").insert(avatarRows)).error);

  const frameFor = (band: string) =>
    avatarRows.find((a) => a.unlock_rule === `cefr:${band}`)!.id;

  ok(
    "student avatars",
    (
      await db.from("student_avatars").insert([
        {
          student_id: STUDENTS.minh,
          base_avatar_seed: "minh-seed-01",
          gems: 340,
          current_rank_frame_id: frameFor("B1"),
          unlocked_accessory_ids: [],
          equipped_accessory_ids: [],
        },
        {
          student_id: STUDENTS.an,
          base_avatar_seed: "an-seed-02",
          gems: 520,
          current_rank_frame_id: frameFor("B1"),
          unlocked_accessory_ids: [],
          equipped_accessory_ids: [],
        },
        {
          student_id: STUDENTS.bao,
          base_avatar_seed: "bao-seed-03",
          gems: 60,
          current_rank_frame_id: frameFor("B1"),
          unlocked_accessory_ids: [],
          equipped_accessory_ids: [],
        },
        {
          student_id: STUDENTS.chi,
          base_avatar_seed: "chi-seed-04",
          gems: 210,
          current_rank_frame_id: frameFor("B1"),
          unlocked_accessory_ids: [],
          equipped_accessory_ids: [],
        },
      ])
    ).error,
  );

  // ------------------------------------------------------------- study history
  //
  // Streak states are chosen so the teacher dashboard has something real to
  // flag and so Minh's streak visibly resolves during the demo:
  //   Minh  12-day run ending YESTERDAY  -> AT_RISK, becomes 13 when he practises
  //   An    20-day run including TODAY   -> ACTIVE
  //   Chi    5-day run ending yesterday  -> AT_RISK
  //   Bảo   last practised 4 days ago    -> BROKEN
  const runs: Array<{ id: string; length: number; endOffset: number }> = [
    { id: STUDENTS.minh, length: 12, endOffset: -1 },
    { id: STUDENTS.an, length: 20, endOffset: 0 },
    { id: STUDENTS.chi, length: 5, endOffset: -1 },
    { id: STUDENTS.bao, length: 6, endOffset: -4 },
  ];

  const xpRows: Array<Record<string, unknown>> = [];
  const sessionRows: Array<Record<string, unknown>> = [];

  for (const run of runs) {
    for (let i = 0; i < run.length; i++) {
      const date = addDays(TODAY, run.endOffset - (run.length - 1 - i));
      const xp = 40 + ((i * 17) % 60); // varied but deterministic
      xpRows.push({
        student_id: run.id,
        date,
        xp,
        streak_count: i + 1,
      });
      sessionRows.push({
        student_id: run.id,
        started_at: `${date}T09:00:00Z`,
        minutes: run.id === STUDENTS.minh ? 30 : 22,
      });
    }
  }

  // The streak runs above only cover recent weeks. Each student also has
  // historical time-on-task, backfilled as one older session so the totals
  // reflect a real term of study rather than just the last fortnight.
  //   Minh 70h (the "70 giờ học" figure in §2's parent breakdown)
  //   An   60h, Chi 40h, Bảo 12h — Bảo is visibly behind, which is the point.
  const totalMinutes: Array<[string, number, number]> = [
    [STUDENTS.minh, 4200, 12 * 30],
    [STUDENTS.an, 3600, 20 * 22],
    [STUDENTS.chi, 2400, 5 * 22],
    [STUDENTS.bao, 720, 6 * 22],
  ];
  for (const [sid, target, alreadyLogged] of totalMinutes) {
    sessionRows.push({
      student_id: sid,
      started_at: `${addDays(TODAY, -60)}T09:00:00Z`,
      minutes: target - alreadyLogged,
    });
  }

  ok("xp events", (await db.from("xp_events").insert(xpRows)).error);
  ok("study sessions", (await db.from("study_sessions").insert(sessionRows)).error);

  // ------------------------------------------------------------- mastery + coverage
  const u1u2Vocab = [...vocabIdsByTopic[0], ...vocabIdsByTopic[1]]; // 16 items
  const u1u2Grammar = [...grammarIdsByTopic[0], ...grammarIdsByTopic[1]]; // 4 points

  const vocabMasteryRows: Array<Record<string, unknown>> = [];
  const grammarMasteryRows: Array<Record<string, unknown>> = [];

  // Minh: 6 of 16 vocab mastered (=37.5), 0 of 4 grammar mastered (=0).
  // The remaining rows carry real partial progress rather than being absent.
  u1u2Vocab.forEach((id, i) => {
    vocabMasteryRows.push({
      student_id: STUDENTS.minh,
      vocab_item_id: id,
      mastery_score: i < 6 ? 90 : i < 11 ? 55 : 20,
    });
  });
  u1u2Grammar.forEach((id) => {
    grammarMasteryRows.push({
      student_id: STUDENTS.minh,
      grammar_point_id: id,
      mastery_score: 45, // real progress, but below the 80 threshold
    });
  });

  // The other three, varied so the class dashboard is not uniform.
  const others: Array<[string, number, number]> = [
    [STUDENTS.an, 11, 2],
    [STUDENTS.bao, 3, 0],
    [STUDENTS.chi, 9, 2],
  ];
  for (const [sid, vMastered, gMastered] of others) {
    u1u2Vocab.forEach((id, i) => {
      vocabMasteryRows.push({
        student_id: sid,
        vocab_item_id: id,
        mastery_score: i < vMastered ? 88 : 35,
      });
    });
    u1u2Grammar.forEach((id, i) => {
      grammarMasteryRows.push({
        student_id: sid,
        grammar_point_id: id,
        mastery_score: i < gMastered ? 85 : 40,
      });
    });
  }

  ok("vocab mastery", (await db.from("vocab_mastery").insert(vocabMasteryRows)).error);
  ok("grammar mastery", (await db.from("grammar_mastery").insert(grammarMasteryRows)).error);

  // ----------------------------------------------------------- coverage
  //
  // The app derives topic_progress from real attempts (share of a topic's
  // exercises answered correctly at least once). So the seed has to lay down
  // the attempts too — writing a bare percentage here would look right until
  // the first live answer recomputed it from an empty history and collapsed it.
  //
  // Correct attempts per student, per assigned topic:
  const coverage: Array<[string, number, number]> = [
    //          student,          Unit 1, Unit 2  (out of 14 exercises each)
    [STUDENTS.minh, 14, 6], // 100% / 43% — 43% clears the 40% unlock gate
    [STUDENTS.an, 14, 12], // 100% / 86%
    [STUDENTS.bao, 6, 1], //  43% /  7% — visibly behind
    [STUDENTS.chi, 14, 8], // 100% / 57%
  ];

  const attemptRows: Array<Record<string, unknown>> = [];
  const progressRows: Array<Record<string, unknown>> = [];

  for (const [studentId, ...perTopic] of coverage) {
    perTopic.forEach((correctCount, ti) => {
      const ids = exerciseIdsByTopic[ti];
      ids.slice(0, correctCount).forEach((exId, i) => {
        attemptRows.push({
          student_id: studentId,
          exercise_id: exId,
          correct: true,
          attempted_at: `${addDays(TODAY, -(20 - (i % 18)))}T10:00:00Z`,
        });
      });
      progressRows.push({
        student_id: studentId,
        topic_id: TOPIC[ti],
        percent_complete: Math.round((correctCount / ids.length) * 100),
      });
    });
  }

  ok("exercise attempts", (await db.from("exercise_attempts").insert(attemptRows)).error);
  ok("topic progress", (await db.from("topic_progress").insert(progressRows)).error);

  // ------------------------------------------------------------- exams
  // Unit 1 exam: fully graded. Unit 2 exam: Minh's submission is UNGRADED,
  // which is what the teacher grades live in §7 step 6.
  const u1Exercises = exerciseRows
    .filter((e) => e.topic_id === TOPIC[0] && e.type === "MCQ")
    .map((e) => e.id);
  const u2Exercises = exerciseRows
    .filter((e) => e.topic_id === TOPIC[1] && e.type === "MCQ")
    .map((e) => e.id);

  ok(
    "exams",
    (
      await db.from("exams").insert([
        {
          id: examId(1),
          class_id: CLASS,
          topic_id: TOPIC[0],
          title: "Kiểm tra Unit 1: Greetings",
          exercise_ids: u1Exercises,
          published_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        },
        {
          id: examId(2),
          class_id: CLASS,
          topic_id: TOPIC[1],
          title: "Kiểm tra Unit 2: Family",
          exercise_ids: u2Exercises,
          published_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ])
    ).error,
  );

  ok(
    "submissions",
    (
      await db.from("submissions").insert([
        // Unit 1 — graded. Minh's 65 is what puts him at composite 48.0,
        // i.e. B1 exactly 40% of the way to B2 (§7 step 1).
        {
          exam_id: examId(1),
          student_id: STUDENTS.minh,
          answers: { [String(u1Exercises[0])]: 1, [String(u1Exercises[1])]: 2 },
          score: 65,
          graded_at: new Date(Date.now() - 86400000 * 12).toISOString(),
        },
        {
          exam_id: examId(1),
          student_id: STUDENTS.an,
          answers: {},
          score: 88,
          graded_at: new Date(Date.now() - 86400000 * 12).toISOString(),
        },
        {
          exam_id: examId(1),
          student_id: STUDENTS.bao,
          answers: {},
          score: 41,
          graded_at: new Date(Date.now() - 86400000 * 12).toISOString(),
        },
        {
          exam_id: examId(1),
          student_id: STUDENTS.chi,
          answers: {},
          score: 74,
          graded_at: new Date(Date.now() - 86400000 * 12).toISOString(),
        },
        // Unit 2 — submitted, NOT graded. This is the demo's grading step.
        {
          exam_id: examId(2),
          student_id: STUDENTS.minh,
          answers: {
            [String(u2Exercises[0])]: 2,
            [String(u2Exercises[1])]: 1,
            [String(u2Exercises[2])]: 1,
          },
          score: null,
        },
        {
          exam_id: examId(2),
          student_id: STUDENTS.chi,
          answers: {
            [String(u2Exercises[0])]: 2,
            [String(u2Exercises[1])]: 1,
            [String(u2Exercises[2])]: 0,
          },
          score: null,
        },
      ])
    ).error,
  );

  // ------------------------------------------------------------- engagement
  ok(
    "class posts",
    (
      await db.from("class_posts").insert([
        {
          class_id: CLASS,
          teacher_id: TEACHER,
          text: "Tuần này lớp mình học xong Unit 2 – Family. Các em nhớ ôn lại phần so sánh hơn nhé!",
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          class_id: CLASS,
          teacher_id: TEACHER,
          text: "Chúc mừng An đã đạt 88 điểm bài kiểm tra Unit 1. Cả lớp cố gắng nhé!",
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
      ])
    ).error,
  );

  ok(
    "kudos",
    (
      await db.from("kudos").insert([
        {
          student_id: STUDENTS.minh,
          teacher_id: TEACHER,
          tag: "PERSISTENCE",
          note: "Học đều 12 ngày liên tiếp, rất kiên trì!",
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          student_id: STUDENTS.an,
          teacher_id: TEACHER,
          tag: "HARD_WORK",
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ])
    ).error,
  );

  ok(
    "journal entries",
    (
      await db.from("journal_entries").insert([
        {
          student_id: STUDENTS.minh,
          topic_id: TOPIC[0],
          text: "My name is Minh. I am fifteen years old. Every morning I greet my grandmother before I go to school. She always says 'Have a good day'. I think it is polite to greet older people first in my family.",
          teacher_comment:
            "Rất tốt Minh! Chú ý: 'older people' — em dùng đúng rồi. Lần sau thử dùng thêm 'formal' và 'informal' nhé.",
          created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        },
      ])
    ).error,
  );

  ok(
    "notifications",
    (
      await db.from("notifications").insert([
        {
          user_id: PARENT,
          type: "KUDOS_RECEIVED",
          payload: {
            studentName: "Minh",
            tag: "PERSISTENCE",
            note: "Học đều 12 ngày liên tiếp, rất kiên trì!",
          },
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          user_id: PARENT,
          type: "CLASS_POST",
          payload: {
            text: "Tuần này lớp mình học xong Unit 2 – Family. Các em nhớ ôn lại phần so sánh hơn nhé!",
          },
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          user_id: STUDENTS.minh,
          type: "KUDOS_RECEIVED",
          payload: {
            tag: "PERSISTENCE",
            note: "Học đều 12 ngày liên tiếp, rất kiên trì!",
          },
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ])
    ).error,
  );

  console.log("\nSeed complete. Computing initial levels…");
  const { recomputeAll } = await import("./recompute");
  await recomputeAll();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
