# Exercise data spreadsheet schema

We are going to use this exercise sheet to seed our database for exercises so that agents can pull from them using tools to then recommend exercises for users

Exercise table headers

```json
["Exercise", "Short YouTube Demonstration", "In-Depth YouTube Explanation", "Difficulty Level", "Target Muscle Group", "Prime Mover Muscle", "Secondary Muscle",
 "Tertiary Muscle", "Primary Equipment", "# Primary Items", "Secondary Equipment", "# Secondary Items",
 "Posture", "Single or Double Arm", "Continuous or Alternating Arms", "Grip", "Load Position (Ending)",
 "Continuous or Alternating Legs", "Foot Elevation", "Combination Exercises", "Movement Pattern #1",
 "Movement Pattern #2", "Movement Pattern #3", "Plane Of Motion #1", "Plane Of Motion #2",
 "Plane Of Motion #3", "Body Region", "Force Type", "Mechanics", "Laterality", "Primary Exercise Classification", "Detailed Instructions"]
```

Schema for instructions
```json
{
    "setup": {
        "posture_and_alignment": "Lie on your back with your knees bent at 90 degrees and your lower back pressed gently into the floor. Your arms should be extended straight up towards the ceiling, perpendicular to your body.",
        "grip_and_stance": "Place a stability ball between your hands and grip it firmly, keeping your elbows slightly bent. Ensure the ball is centered between your hands."
    },
    "execution": {
        "phase_by_phase_steps": "1. Engage your core by drawing your belly button towards your spine. \n2. Simultaneously extend your right arm straight back towards the floor above your head and extend your left leg straight out, lowering both towards the floor. Only lower as far as you can maintain core stability and keep your lower back from arching.\n3. Return your right arm and left leg to the starting position with control.\n4. Repeat the movement with your left arm and right leg, extending them simultaneously.\n5. Continue alternating sides for the desired number of repetitions.",
        "range_of_motion": "Lower your opposite arm and leg until just before your lower back begins to arch or you lose core tension. Aim for a controlled descent, not necessarily touching the floor.",
        "tempo": "Perform the lowering phase (extension of arm and leg) over 2-3 seconds, and the return phase (bringing arm and leg back to start) over 1-2 seconds."
    },
    "breathing_technique": {
        "inhale": "Inhale deeply as you slowly lower your opposite arm and leg.",
        "exhale": "Exhale forcefully as you bring your arm and leg back to the starting position and engage your core.",
        "key_rule": "Never hold your breath; maintain continuous, controlled breathing throughout the exercise."
    },
    "safety_and_common_mistakes": [
        "What to Avoid: Allowing your lower back to arch off the floor; moving too quickly and losing control; letting the stability ball drop.",
        "Modifications: To make it easier, only extend one limb at a time (either an arm or a leg) or reduce the range of motion. To make it harder, increase the range of motion by extending the limbs further away from the body while maintaining core control, or hold a light weight in each hand."
    ]
}
```