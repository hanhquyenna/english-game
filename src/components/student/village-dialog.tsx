"use client";

import React from "react";
import { X } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import type { MapNode, MapLandmark, MapMate } from "@/lib/class-map";

interface VillageDialogProps {
  selectedNode: MapNode | null;
  selectedLandmark: MapLandmark | null;
  classmatesAtNode: MapMate[];
  arenaUnlocked: boolean;
  arenaLockedReason: string | null;
  onClose: () => void;
  onAction: () => void;
}

export function VillageDialog({
  selectedNode,
  selectedLandmark,
  classmatesAtNode,
  arenaUnlocked,
  arenaLockedReason,
  onClose,
  onAction,
}: VillageDialogProps) {
  if (!selectedNode && !selectedLandmark) return null;

  let title = "";
  let sub = "";
  let body = "";
  let ctaText = "";
  let isLocked = false;
  let npcSeed = "teacher-npc";
  let npcPose = "idle";

  if (selectedLandmark) {
    title = selectedLandmark.label;
    sub = "Địa điểm làng";
    if (selectedLandmark.id === "vault") {
      body = "Kho lưu trữ từ vựng đã học và các thẻ flashcards Spaced-Repetition ôn luyện hàng ngày.";
      ctaText = "Vào Kho từ";
      npcSeed = "vault-npc";
      npcPose = "think";
    } else if (selectedLandmark.id === "shop") {
      body = "Cửa hàng trang bị nhân vật Toon, mũ vương miện, nón phù thuỷ và huy hiệu thành tích.";
      ctaText = "Vào Cửa hàng";
      npcSeed = "shop-npc";
      npcPose = "cheer0";
    } else {
      body = "Bảng vàng vinh danh những học sinh chăm chỉ nhất tuần theo nhóm trình độ CEFR.";
      ctaText = "Xem Bảng vàng";
      npcSeed = "rank-npc";
      npcPose = "cheer1";
    }
  } else if (selectedNode) {
    const isArena = selectedNode.track === "arena";
    if (selectedNode.isBoss) {
      title = `Trùm cuối: ${selectedNode.name}`;
      npcSeed = "boss-npc";
    } else if (selectedNode.isArenaFinal) {
      title = `Đấu trường: ${selectedNode.name}`;
      npcSeed = "arena-npc";
    } else {
      title = isArena
        ? `Chặng Đấu ${selectedNode.index + 1}: ${selectedNode.name}`
        : `Thử thách ${selectedNode.index + 1}: ${selectedNode.name}`;
      npcSeed = isArena ? "trainer-npc" : "teacher-npc";
    }

    if (selectedNode.isArenaFinal && !arenaUnlocked) {
      isLocked = true;
      sub = "Chưa mở Đấu trường";
      body = arenaLockedReason || "Luyện tập 1 hôm để mở Đấu trường.";
      ctaText = "Chưa mở";
      npcPose = "think";
    } else if (selectedNode.status === "locked") {
      isLocked = true;
      sub = "Chưa mở";
      body = selectedNode.lockedReason || (selectedNode.isBoss
        ? "Xong cả 8 thử thách thì cửa trùm mới mở."
        : "Xong thử thách trước là mở được chỗ này.");
      ctaText = "Chưa mở";
      npcPose = "think";
    } else if (selectedNode.status === "done") {
      sub = "Đã xong";
      body = "Em đã hoàn thành thử thách này. Vào lại để ôn luyện thêm!";
      ctaText = "Ôn lại";
      npcPose = "cheer0";
    } else {
      sub = "Đang mở";
      body = selectedNode.isBoss
        ? "Cửa trùm đã mở. Chinh phục bài kiểm tra để hoàn thành Unit!"
        : selectedNode.isArenaFinal
        ? "Đấu trường Arena đã sẵn sàng. Tranh tài cùng bảng xếp hạng lớp!"
        : "Có 8 câu hỏi ở đây. Làm xong em bước tiếp một chặng trên bản đồ.";
      ctaText = selectedNode.isArenaFinal ? "Vào Đấu trường" : "Vào thử thách";
      npcPose = "talk";
    }
  }

  return (
    <div
      id="dlg"
      className="on absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(320px,88vw)] bg-st-card border-2 border-st-fg rounded-sm shadow-[4px_4px_0_0_var(--st-fg)] z-40 animate-in fade-in zoom-in-95 duration-150 font-sans"
    >
      <div className="flex gap-2.5 p-3 border-b-2 border-st-fg bg-st-peach items-center">
        <div className="w-12 h-12 border-2 border-st-fg rounded-sm bg-st-card overflow-hidden shrink-0 flex items-center justify-center">
          <StudentAvatar seed={npcSeed} size={40} noFrame pose={npcPose} />
        </div>
        <div className="flex-1 min-w-0">
          <div id="dTtl" className="text-sm font-extrabold text-st-fg truncate">
            {title}
          </div>
          <div
            id="dSub"
            className="text-[10px] font-bold text-st-muted-fg tracking-wider uppercase"
          >
            {sub}
          </div>
        </div>
        <button
          id="dNo"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center border-2 border-st-fg rounded-sm bg-st-card text-st-fg hover:bg-st-peach active:translate-x-0.5 active:translate-y-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 text-xs leading-relaxed text-st-fg">
        <p id="dBody">{body}</p>
        {selectedNode && (
          <div id="dWho" className="mt-2 text-[10px] text-st-muted-fg font-medium">
            {classmatesAtNode.length > 0
              ? `${classmatesAtNode.length} bạn đang ở đây: ${classmatesAtNode
                  .slice(0, 5)
                  .map((m) => m.name)
                  .join(", ")}${classmatesAtNode.length > 5 ? "…" : ""}`
              : "Chưa có bạn nào ở đây."}
          </div>
        )}
      </div>

      <div className="p-3 pt-0 flex gap-2">
        <button
          id="dGo"
          disabled={isLocked}
          onClick={onAction}
          className={`flex-1 py-2 px-3 text-xs font-bold tracking-wider uppercase border-2 border-st-fg rounded-sm shadow-[2px_2px_0_0_var(--st-fg)] transition-transform ${
            isLocked
              ? "bg-st-muted text-st-muted-fg cursor-not-allowed opacity-75 shadow-none"
              : "bg-st-primary text-st-primary-fg hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5"
          }`}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}
