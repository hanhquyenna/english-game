import { describe, expect, it } from "vitest";

export function validateSubmissionFile(type: "text" | "audio" | "image" | "video" | "file", sizeBytes?: number, durationSec?: number): { valid: boolean; error?: string } {
  if (type === "image" && sizeBytes && sizeBytes > 10 * 1024 * 1024) {
    return { valid: false, error: "Ảnh vượt quá giới hạn 10MB." };
  }
  if (type === "video") {
    if (sizeBytes && sizeBytes > 50 * 1024 * 1024) {
      return { valid: false, error: "Video vượt quá giới hạn 50MB." };
    }
    if (durationSec && durationSec > 120) {
      return { valid: false, error: "Video vượt quá 2 phút." };
    }
  }
  if (type === "file" && sizeBytes && sizeBytes > 20 * 1024 * 1024) {
    return { valid: false, error: "Tệp tin vượt quá giới hạn 20MB." };
  }
  return { valid: true };
}

describe("submission-validation & multiformat rules", () => {
  it("enforces image 10MB limit", () => {
    expect(validateSubmissionFile("image", 5 * 1024 * 1024).valid).toBe(true);
    expect(validateSubmissionFile("image", 12 * 1024 * 1024).valid).toBe(false);
  });

  it("enforces video 50MB and 2-minute limits", () => {
    expect(validateSubmissionFile("video", 30 * 1024 * 1024, 60).valid).toBe(true);
    expect(validateSubmissionFile("video", 60 * 1024 * 1024, 60).valid).toBe(false);
    expect(validateSubmissionFile("video", 30 * 1024 * 1024, 180).valid).toBe(false);
  });

  it("enforces file 20MB limit", () => {
    expect(validateSubmissionFile("file", 15 * 1024 * 1024).valid).toBe(true);
    expect(validateSubmissionFile("file", 25 * 1024 * 1024).valid).toBe(false);
  });
});
