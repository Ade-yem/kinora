import { vi, describe, it, expect } from "vitest";

// Mock the LLM client module to avoid OpenAI missing credentials error on initialization
vi.mock("@/lib/llm", () => ({
  llmClient: {},
  DEEPSEEK_MODEL: "test-model",
}));

import { normalizeMuscleGroup, extractJson } from "@/lib/chat/generator";
import { TargetMuscleGroup } from "@/app/generated/prisma/client";

describe("Generator Helpers", () => {
  describe("normalizeMuscleGroup", () => {
    it("should correctly normalize various common muscle group strings", () => {
      expect(normalizeMuscleGroup("chest")).toBe(TargetMuscleGroup.CHEST);
      expect(normalizeMuscleGroup("quads")).toBe(TargetMuscleGroup.QUADRICEPS);
      expect(normalizeMuscleGroup("quadriceps")).toBe(TargetMuscleGroup.QUADRICEPS);
      expect(normalizeMuscleGroup("Shoulder ")).toBe(TargetMuscleGroup.SHOULDERS);
      expect(normalizeMuscleGroup("shoulders")).toBe(TargetMuscleGroup.SHOULDERS);
      expect(normalizeMuscleGroup("abs")).toBe(TargetMuscleGroup.ABDOMINALS);
      expect(normalizeMuscleGroup("abdominals")).toBe(TargetMuscleGroup.ABDOMINALS);
      expect(normalizeMuscleGroup("back")).toBe(TargetMuscleGroup.BACK);
      expect(normalizeMuscleGroup("glutes")).toBe(TargetMuscleGroup.GLUTES);
      expect(normalizeMuscleGroup("biceps")).toBe(TargetMuscleGroup.BICEPS);
      expect(normalizeMuscleGroup("triceps")).toBe(TargetMuscleGroup.TRICEPS);
      expect(normalizeMuscleGroup("calves")).toBe(TargetMuscleGroup.CALVES);
      expect(normalizeMuscleGroup("hamstrings")).toBe(TargetMuscleGroup.HAMSTRINGS);
      expect(normalizeMuscleGroup("forearm")).toBe(TargetMuscleGroup.FOREARMS);
      expect(normalizeMuscleGroup("traps")).toBe(TargetMuscleGroup.TRAPEZIUS);
    });

    it("should return null for invalid muscle groups", () => {
      expect(normalizeMuscleGroup("invalid_muscle")).toBeNull();
      expect(normalizeMuscleGroup("")).toBeNull();
    });
  });

  describe("extractJson", () => {
    it("should extract JSON from clean markdown json codeblocks", () => {
      const text = "```json\n{\n  \"hello\": \"world\"\n}\n```";
      expect(extractJson(text)).toEqual({ hello: "world" });
    });

    it("should extract JSON even if codeblock tags are missing but object braces exist", () => {
      const text = "Some introductory text here...\n{\n  \"foo\": \"bar\"\n}\nAnd some footer text.";
      expect(extractJson(text)).toEqual({ foo: "bar" });
    });

    it("should parse raw JSON without blocks", () => {
      const text = "{\"key\": \"val\"}";
      expect(extractJson(text)).toEqual({ key: "val" });
    });

    it("should throw an error for malformed JSON", () => {
      const text = "{\"key\": malformed}";
      expect(() => extractJson(text)).toThrow();
    });
  });
});
