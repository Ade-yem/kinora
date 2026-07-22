Based on an analysis of the **Functional Fitness Exercise Data** table, which contains over 3,200 exercises across 31 detailed attributes, here are the most important filters to use as parameters for your LLM tool.

To safely and effectively select exercises based on a user's physical condition, injuries, fitness level, and constraints, you should categorize and prioritize your parameters into three tiers:-----### Tier 1: Safety & Physical Limitations (Most Critical)These parameters ensure the LLM generates a routine that accommodates injuries, joint pain, or mobility restrictions.  * **`Posture`** (e.g., *Standing, Supine, Prone, Seated, Hanging*)
      * **Why it matters:** This is vital for users with specific physical limitations. For example, a user with severe lower back pain or vertigo may need to avoid *Standing* loaded exercises and instead focus on *Supine* (lying on back) or *Seated* movements.
  * **`Movement Pattern #1`** (e.g., *Knee Dominant, Hip Hinge, Rotational, Vertical Push*)
      * **Why it matters:** If a user has a specific joint issue (e.g., bad knees), the LLM can filter out *Knee Dominant* movements. If they have an acute lower back disc issue, the LLM should filter out *Rotational* or heavy *Hip Hinge* patterns to protect the spine.
  * **`Target Muscle Group` / `Body Region`** (e.g., *Quadriceps, Shoulders, Abdominals* / *Core, Lower Body, Upper Body*)
      * **Why it matters:** If a user is recovering from an injury (e.g., a rotator cuff tear), the LLM must be able to completely exclude specific target groups like *Shoulders* or entire regions like *Upper Body*, or conversely, focus entirely on *Core* for rehabilitation.### Tier 2: Fitness & Experience LevelThis parameter ensures the routine matches the user's current physical capability, preventing overexertion or injury from overly complex movements.  * **`Difficulty Level`** (e.g., *Novice, Beginner, Intermediate, Advanced, Expert*)
      * **Why it matters:** The dataset heavily categorizes exercises by difficulty (with *Novice* and *Intermediate* making up the majority of the rows). For a user who is deconditioned or returning from a long hiatus, the LLM must strictly filter for *Novice* or *Beginner* to avoid prescribing high-risk, complex movements.### Tier 3: Environmental & Structural ConstraintsThese parameters help tailor the workout to the user's immediate environment and specific structural training goals.  * **`Primary Equipment`** (e.g., *Kettlebell, Dumbbell, Barbell, Bodyweight, Sliders*)
      * **Why it matters:** A user's "condition" often includes their environment (e.g., working out from a hotel room or at home during rehab). Filtering by *Bodyweight* or *Dumbbell* ensures the tool only provides actionable exercises.
  * **`Laterality`** (e.g., *Unilateral, Bilateral, Contralateral*)
      * **Why it matters:** Highly valuable for physical therapy and rehabilitation. If a user is recovering from an injury on one side of their body, or has a significant strength imbalance, the LLM can prioritize *Unilateral* (single-sided) exercises to rebuild symmetry safely.-----### Recommended LLM Tool Implementation MappingTo make your LLM tool highly effective, you should programmatically map common user conditions to these specific table filters:1.  **User reports "Knee Pain":** Tool passes a filter to exclude `Movement Pattern #1 = Knee Dominant`.
2.  **User reports "Low Back Pain":** Tool filters for `Posture = Supine` or `Seated`, and avoids `Movement Pattern #1 = Rotational`.
3.  **User is a "Complete Beginner":** Tool strictly sets `Difficulty Level = Novice` or `Beginner`.
4.  **User reports "No Equipment / At Home":** Tool sets `Primary Equipment = Bodyweight`.

### Unique values of each available filter in the db
```
Column - Posture
[
  "Supine",
  "Bridge",
  "Quadruped",
  "Seated Floor",
  "Hanging",
  "Prone",
  "Knee Hover Quadruped",
  "Side Plank",
  "Kneeling",
  "Seated",
  "Standing",
  "L Sit",
  "Half Kneeling",
  "Staggered Stance",
  "Inverted",
  "Single Leg Bridge",
  "Side Lying",
  "Walking",
  "Wall Sit",
  "Single Leg Standing Bent Knee",
  "Tall Kneeling",
  "Split Squat",
  "Single Leg Standing",
  "Single Leg Supported",
  "Knee Over Toe Split Squat",
  "Tuck L Sit",
  "Other",
  "V Sit Seated",
  "Isometric Split Squat",
  "March",
  "Shin Box Seated",
  "Horse Stance",
  "Knee Supported",
  "Running"
]
Column - Target Muscle Group
[
  "Abdominals",
  "Glutes",
  "Chest",
  "Hip Flexors",
  "Shoulders",
  "Back",
  "Biceps",
  "Quadriceps",
  "Hamstrings",
  "Abductors",
  "Trapezius",
  "Triceps",
  "Forearms",
  "Calves",
  "Adductors",
  "Shins"
]
Column - Body Region
[
  "Core",
  "Lower Body",
  "Upper Body",
  "Full Body"
]
Column - Difficulty Level
[
  "Beginner",
  "Intermediate",
  "Novice",
  "Advanced",
  "Expert",
  "Grand Master",
  "Master",
  "Legendary"
]
Column - Primary Equipment
[
  "Stability Ball",
  "Bodyweight",
  "Gymnastic Rings",
  "Parallette Bars",
  "Slam Ball",
  "Dumbbell",
  "Ab Wheel",
  "Cable",
  "Medicine Ball",
  "Suspension Trainer",
  "Barbell",
  "Miniband",
  "Sliders",
  "Pull Up Bar",
  "EZ Bar",
  "Landmine",
  "Superband",
  "Kettlebell",
  "Resistance Band",
  "Weight Plate",
  "Macebell",
  "Indian Club",
  "Clubbell",
  "Tire",
  "Trap Bar",
  "Battle Ropes",
  "Bulgarian Bag",
  "Heavy Sandbag",
  "Sandbag",
  "Wall Ball",
  "Sled",
  "Climbing Rope"
]
Column - Laterality
[
  "Contralateral",
  "Bilateral",
  "Unilateral",
  "Ipsilateral"
]
Column - Movement Pattern #1
[
  "Anti-Extension",
  "Hip Extension",
  "Anti-Rotational",
  "Rotational",
  "Spinal Flexion",
  "Horizontal Push",
  "Hip Flexion",
  "Lateral Flexion",
  "Anti-Lateral Flexion",
  "Horizontal Pull",
  "Locomotion",
  "Isometric Hold",
  "Vertical Pull",
  "Shoulder External Rotation",
  "Hip External Rotation",
  "Knee Dominant",
  "Vertical Push",
  "Hip Hinge",
  "Hip Abduction",
  "Scapular Elevation",
  "Elbow Flexion",
  "Elbow Extension",
  "Spinal Extension",
  "Loaded Carry",
  "Shoulder Flexion",
  "Other",
  "Shoulder Abduction",
  "Hip Dominant",
  "Ankle Plantar Flexion",
  "Hip Adduction",
  "Ankle Dorsiflexion",
  "Wrist Flexion",
  "Horizontal Adduction",
  "Wrist Extension",
  "Shoulder Internal Rotation",
  "Shoulder Scapular Plane Elevation",
  "Anti-Flexion",
  "Lateral Locomotion"
]
```