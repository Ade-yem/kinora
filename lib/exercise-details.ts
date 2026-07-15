export interface ExerciseDetail {
  description: string;
  steps: string[];
  note: string;
  tip: string;
}

export const EXERCISE_DETAILS: Record<string, ExerciseDetail> = {
  "glute-bridge": {
    description:
      "A floor-based hip hinge that isolates the glutes and teaches you to fire them without your lower back taking over.",
    steps: [
      "Lie on your back, knees bent, feet flat under your knees.",
      "Squeeze your glutes and drive your hips up toward the ceiling.",
      "Pause at the top with your body in a straight line, hips to shoulders.",
      "Lower with control back to the floor.",
    ],
    note: "Don't overextend at the top — stop when hips and shoulders line up. Keep ribs down.",
    tip: "Drive through your heels, not your toes — it keeps the glutes doing the work.",
  },
  "wall-sit": {
    description:
      "An isometric quad burner. No reps, no momentum — just time under tension in a squat position against a wall.",
    steps: [
      "Back flat against a wall, slide down until knees are at 90°.",
      "Keep knees stacked over ankles, weight in your heels.",
      "Hold the position for the full set.",
      "Push through your heels to slide back up when done.",
    ],
    note: "If knees track past your toes, walk your feet further from the wall.",
    tip: "Breathe steadily — holding your breath makes the last 10 seconds feel twice as long.",
  },
  "reverse-lunge": {
    description:
      "A single-leg move that builds quad and glute strength while being kinder on the knees than a forward lunge.",
    steps: [
      "Stand tall, step one foot back and lower until both knees hit ~90°.",
      "Keep your front shin vertical and chest upright.",
      "Push through the front heel to return to standing.",
      "Alternate legs each rep.",
    ],
    note: "Don't let the front knee cave inward — track it over your second toe.",
    tip: "A slightly longer step targets the glutes more; a shorter step shifts more to the quads.",
  },
  "goblet-squat": {
    description:
      "A front-loaded squat variation that builds quad and glute strength while reinforcing an upright torso — great for beginners learning squat mechanics.",
    steps: [
      "Hold dumbbell vertically at chest, elbows tucked.",
      "Hinge hips back and bend knees, chest tall.",
      "Lower until thighs are parallel to floor.",
      "Drive through heels back to standing.",
    ],
    note: "Keep knees tracking over toes — don't let them cave in. Avoid rounding your lower back at the bottom.",
    tip: "Pause 1 second at the bottom to kill momentum — it's the fastest way to build real strength here.",
  },
  "plank-hold": {
    description:
      "A full-body isometric hold that builds core stability — the foundation for keeping your spine safe under load elsewhere.",
    steps: [
      "Forearms on the floor, elbows under shoulders.",
      "Extend legs back, body in one straight line.",
      "Brace your core and squeeze your glutes.",
      "Hold, breathing steadily, without letting hips sag or pike.",
    ],
    note: "Sagging hips is the #1 form breakdown — if you feel it in your lower back, reset.",
    tip: "Think 'push the floor away' — actively pressing through your forearms keeps your upper back engaged.",
  },
  "step-up": {
    description:
      "A single-leg strength builder using a step or bench — closer to real-world movement than a squat, and easy to scale.",
    steps: [
      "Place one foot fully on a sturdy step or bench.",
      "Drive through that heel to stand up on the step.",
      "Control the descent back down with the same leg.",
      "Finish all reps on one side before switching.",
    ],
    note: "Avoid pushing off the bottom leg — the working leg on the step should do the lifting.",
    tip: "A taller step means more glute; a lower step shifts the emphasis toward the quad.",
  },
  "bird-dog": {
    description:
      "A core and spine-stability drill that trains you to move your limbs without your torso rotating — a safer strength-builder than heavy spinal loading.",
    steps: [
      "Start on hands and knees, spine neutral.",
      "Extend one arm and the opposite leg straight out.",
      "Hold briefly, keeping hips and shoulders square to the floor.",
      "Return with control and switch sides.",
    ],
    note: "If your lower back arches or hips rock, shorten the reach until you can keep it stable.",
    tip: "Move slowly — this one's about control, not speed.",
  },
};
