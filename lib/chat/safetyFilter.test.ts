import { describe, it, expect } from "vitest";
import { matchesEmergencyPattern } from "./safetyFilter";

describe("matchesEmergencyPattern", () => {
  it("should match positive emergency cases", () => {
    expect(matchesEmergencyPattern("chest pain")).toBe(true);
    expect(matchesEmergencyPattern("I have severe pain in my chest")).toBe(true);
    expect(matchesEmergencyPattern("can't breathe")).toBe(true);
    expect(matchesEmergencyPattern("cannot breathe, help")).toBe(true);
    expect(matchesEmergencyPattern("I passed out for a second")).toBe(true);
    expect(matchesEmergencyPattern("I fainted")).toBe(true);
    expect(matchesEmergencyPattern("I feel numbness down my left arm")).toBe(true);
    expect(matchesEmergencyPattern("sudden severe pain in my shoulder")).toBe(true);
    expect(matchesEmergencyPattern("call 911")).toBe(true);
    expect(matchesEmergencyPattern("need an ambulance")).toBe(true);
  });

  it("should not match negative non-emergency cases", () => {
    expect(matchesEmergencyPattern("my legs hurt from yesterday's workout")).toBe(false);
    expect(matchesEmergencyPattern("knee pain when squatting")).toBe(false);
    expect(matchesEmergencyPattern("shoulder a bit sore")).toBe(false);
    expect(matchesEmergencyPattern("I want to build a routine")).toBe(false);
    expect(matchesEmergencyPattern("hi coach")).toBe(false);
  });
});
