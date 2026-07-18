export const EMERGENCY_RESPONSE_TEXT =
  "If you are experiencing chest pain, shortness of breath, sudden severe pain, numbness, or think you may have passed out, please stop exercising immediately and call 911 or your local emergency services. Your safety is the priority; this app is not a medical provider and cannot diagnose or treat medical emergencies.";

const EMERGENCY_REGEXES: RegExp[] = [
  /chest\s+pain/i,
  /pain\s+in\s+(?:my\s+)?chest/i,
  /(?:can\s*not|can'?t)\s+breathe/i,
  /shortness\s+of\s+breath/i,
  /difficulty\s+breathing/i,
  /numbness\s+(?:down|in)\s+(?:my\s+)?(?:left\s+)?arm/i,
  /passed\s+out/i,
  /fainted/i,
  /lost\s+consciousness/i,
  /severe\s+sudden\s+pain/i,
  /sudden\s+severe\s+pain/i,
  /\b911\b/i,
  /\bambulance\b/i,
];

export function matchesEmergencyPattern(message: string): boolean {
  const normalized = message.trim();
  return EMERGENCY_REGEXES.some((regex) => regex.test(normalized));
}
