import type { KnowledgeChunk } from "./types.js";

/**
 * Exercise knowledge corpus — the "documents" for RAG.
 *
 * Each exercise gets 6 chunks covering different aspects.
 * These chunks are embedded and stored in pgvector for
 * similarity search when users ask questions.
 */
export const EXERCISE_KNOWLEDGE: KnowledgeChunk[] = [
  // ── Barbell Back Squat ──────────────────────────
  {
    exerciseId: "barbell-back-squat",
    chunkType: "overview",
    title: "Barbell Back Squat - Overview",
    content:
      "The barbell back squat is a compound lower-body exercise and one of the three powerlifting competition lifts. The lifter places a loaded barbell across the upper back (either high-bar on the traps or low-bar on the rear delts), unracks it, and descends by bending the hips and knees until the hip crease drops below the top of the knee. Equipment needed: barbell, squat rack, and weight plates. A belt is optional for heavier loads. Difficulty: intermediate. The back squat is considered the king of leg exercises because it loads the entire lower body and core under heavy weight, making it one of the most effective movements for building overall strength and muscle mass.",
  },
  {
    exerciseId: "barbell-back-squat",
    chunkType: "muscles",
    title: "Barbell Back Squat - Target Muscles",
    content:
      "Primary muscles: quadriceps (rectus femoris, vastus lateralis, vastus medialis, vastus intermedius) and gluteus maximus. Secondary muscles: adductors (adductor magnus, longus, brevis), hamstrings (biceps femoris, semitendinosus, semimembranosus). Stabilizers: erector spinae, transverse abdominis, obliques, and calves (gastrocnemius, soleus). High-bar squats emphasize the quads more due to a more upright torso. Low-bar squats shift more load to the posterior chain (glutes and hamstrings) because of the greater forward lean.",
  },
  {
    exerciseId: "barbell-back-squat",
    chunkType: "form",
    title: "Barbell Back Squat - Form Cues",
    content:
      "Setup: Position the bar at mid-chest height on the rack. Step under the bar and place it across your upper traps (high bar) or rear delts (low bar). Grip the bar with hands slightly wider than shoulder width. Brace your core by taking a deep breath into your belly. Unrack and take 2-3 steps back. Feet should be shoulder-width apart or slightly wider, toes pointed out 15-30 degrees. Descent: Initiate by pushing your hips back and bending your knees simultaneously. Keep your chest up and maintain a neutral spine. Track your knees over your toes — they should not cave inward. Descend until your hip crease is below the top of your kneecap. Ascent: Drive through your full foot (not just heels), push your back into the bar, and stand up by extending hips and knees together. Exhale at the top. Breathing: Take a deep belly breath at the top, hold it through the descent and initial drive, exhale once past the sticking point.",
  },
  {
    exerciseId: "barbell-back-squat",
    chunkType: "mistakes",
    title: "Barbell Back Squat - Common Mistakes",
    content:
      "Knee cave (valgus): Knees collapsing inward during the ascent. Fix by cueing 'spread the floor' with your feet and strengthening hip abductors. Butt wink: Excessive posterior pelvic tilt at the bottom, rounding the lower back. Fix by improving ankle and hip mobility, or reducing depth slightly. Rising hips first (good-morning squat): Hips shoot up before the chest, turning it into a good morning. Fix by cueing 'chest up' and driving your back into the bar. Heels rising: Indicates tight ankles. Fix with ankle mobility work or squat shoes with a raised heel. Not hitting depth: Often caused by tight hips or ankles. Use box squats or goblet squats to train proper depth. Forward lean: Excessive torso lean, especially on high-bar. Strengthen upper back and improve thoracic mobility.",
  },
  {
    exerciseId: "barbell-back-squat",
    chunkType: "alternatives",
    title: "Barbell Back Squat - Alternatives & Substitutes",
    content:
      "Front squat: Bar held on the front delts. More quad-dominant, requires less hip mobility but more wrist and thoracic mobility. Goblet squat: Holding a dumbbell or kettlebell at chest height. Great for beginners learning squat mechanics. Hack squat (machine): Fixed path removes balance demands. Good for isolating quads with less spinal loading. Leg press: Similar muscle recruitment without axial spinal loading. Good for those with back issues. Bulgarian split squat: Unilateral exercise that builds single-leg strength and addresses imbalances. Safety bar squat: Uses a specialty bar that reduces shoulder and wrist stress. Belt squat: Loads the hips directly via a belt, completely removing spinal compression.",
  },
  {
    exerciseId: "barbell-back-squat",
    chunkType: "programming",
    title: "Barbell Back Squat - Programming Notes",
    content:
      "Strength: 3-6 sets of 1-5 reps at 80-95% 1RM. Rest 3-5 minutes between sets. Hypertrophy: 3-4 sets of 6-12 reps at 65-80% 1RM. Rest 2-3 minutes. Endurance: 2-3 sets of 15-20 reps at 50-65% 1RM. Rest 60-90 seconds. Frequency: Most lifters benefit from squatting 2-3 times per week, varying intensity and volume across sessions. Progression: Add 2.5-5 lbs per session for beginners (linear progression). Intermediate lifters should use weekly or block periodization. The back squat should typically be the first exercise in a session due to its high neural demand. Warm up with 2-3 progressively heavier sets before working sets.",
  },

  // ── Hack Squat ──────────────────────────────────
  {
    exerciseId: "hack-squat",
    chunkType: "overview",
    title: "Hack Squat - Overview",
    content:
      "The hack squat is a machine-based lower-body exercise where the lifter stands on a platform with their back and shoulders against angled pads, then squats down along a fixed track. The machine handles balance and stabilization, allowing the lifter to focus entirely on leg drive. Equipment needed: hack squat machine. Difficulty: beginner to intermediate. It's an excellent choice for building quad size and strength without the spinal loading demands of a free-weight squat. The fixed path makes it safer for training close to failure.",
  },
  {
    exerciseId: "hack-squat",
    chunkType: "muscles",
    title: "Hack Squat - Target Muscles",
    content:
      "Primary muscles: quadriceps — the hack squat is one of the most quad-dominant squat variations due to the upright torso angle. Secondary muscles: gluteus maximus and adductors. Minimal stabilizer demand because the machine handles balance. Foot placement changes emphasis: feet low and close together increases quad activation; feet high and wide shifts more load to the glutes and hamstrings. The machine track removes most of the erector spinae and core demand compared to free-weight squats.",
  },
  {
    exerciseId: "hack-squat",
    chunkType: "form",
    title: "Hack Squat - Form Cues",
    content:
      "Setup: Position your back flat against the pad and shoulders firmly under the shoulder pads. Place your feet about shoulder-width apart on the platform, toes slightly pointed out. Release the safety handles. Descent: Lower yourself by bending at the hips and knees, keeping your back pressed into the pad throughout. Descend until your thighs are at least parallel to the platform. Ascent: Drive through your full foot to push the sled back up. Avoid locking out your knees completely at the top to maintain tension. Keep your head neutral against the pad — don't look down. Control the descent for 2-3 seconds; don't let gravity pull you down.",
  },
  {
    exerciseId: "hack-squat",
    chunkType: "mistakes",
    title: "Hack Squat - Common Mistakes",
    content:
      "Heels lifting off the platform: Indicates the feet are placed too low or ankle mobility is limited. Move feet slightly higher on the platform. Knees caving inward: Push knees out in line with toes throughout the movement. Lower back lifting off the pad: Usually from going too deep without adequate hip mobility. Only go as deep as you can while keeping your back flat against the pad. Bouncing out of the bottom: Using momentum instead of controlled muscle contraction. Pause briefly at the bottom. Locking out knees aggressively: Can stress the knee joint. Stop just short of full lockout.",
  },
  {
    exerciseId: "hack-squat",
    chunkType: "alternatives",
    title: "Hack Squat - Alternatives & Substitutes",
    content:
      "Barbell hack squat: A free-weight variation where the barbell is held behind the legs. More challenging for balance. Leg press: Similar quad focus with a different angle of resistance. Allows heavier loading. Front squat: Free-weight quad-dominant squat but requires more stabilization and mobility. Smith machine squat: Fixed path like the hack squat but in a vertical plane. V-squat machine: Similar to hack squat but with a different force angle. Pendulum squat: A newer machine design that provides a more natural squat arc. Sissy squat: Bodyweight quad isolation that mimics the knee-dominant pattern.",
  },
  {
    exerciseId: "hack-squat",
    chunkType: "programming",
    title: "Hack Squat - Programming Notes",
    content:
      "Best used as a primary or secondary quad exercise after free-weight squats. Hypertrophy: 3-4 sets of 8-12 reps. The machine allows safe training to failure, making it ideal for high-effort sets. Strength: 4-5 sets of 5-8 reps with heavier loads. Since balance isn't a factor, you can push heavier than free-weight squats in some cases. The hack squat responds well to intensity techniques like drop sets, rest-pause sets, and slow eccentrics. Program it 1-2 times per week. Pair it with a hip-dominant exercise like hip thrusts or Romanian deadlifts for balanced leg development.",
  },

  // ── Deadlift ────────────────────────────────────
  {
    exerciseId: "deadlift",
    chunkType: "overview",
    title: "Deadlift - Overview",
    content:
      "The deadlift is a compound full-body exercise and one of the three powerlifting competition lifts. The lifter picks a loaded barbell up from the floor to a standing lockout position. It is one of the simplest yet most demanding exercises: grab the bar and stand up. Equipment needed: barbell and weight plates. A belt, chalk, and lifting straps are optional accessories. Difficulty: intermediate to advanced. The deadlift is arguably the best overall test of full-body strength because it engages virtually every muscle from the hands to the feet.",
  },
  {
    exerciseId: "deadlift",
    chunkType: "muscles",
    title: "Deadlift - Target Muscles",
    content:
      "Primary muscles: posterior chain — erector spinae (entire back), gluteus maximus, and hamstrings. The deadlift is the ultimate posterior chain builder. Secondary muscles: quadriceps (especially off the floor), trapezius, rhomboids, latissimus dorsi, and forearms (grip). Stabilizers: core (transverse abdominis, obliques), hip adductors. Conventional deadlifts emphasize the back and hamstrings more. Sumo deadlifts shift more work to the quads, adductors, and glutes due to the wider stance and more upright torso.",
  },
  {
    exerciseId: "deadlift",
    chunkType: "form",
    title: "Deadlift - Form Cues",
    content:
      "Setup: Walk to the bar so it's over the middle of your foot (about 1 inch from your shins). Feet hip-width apart. Bend over and grip the bar just outside your knees with a double overhand or mixed grip. Push your hips back, bend your knees until your shins touch the bar. Flatten your back by lifting your chest — imagine showing the logo on your shirt to someone in front of you. Arms should be straight, hanging vertically. Pull: Take a deep breath, brace your core hard, and push the floor away with your legs. The bar should drag up your shins and thighs — keep it in contact with your body. Your hips and shoulders should rise at the same rate. Once the bar passes your knees, drive your hips forward to lockout. Lockout: Stand tall with your hips fully extended and shoulders pulled back. Don't hyperextend your back. Lower the bar by hinging at the hips first, then bending your knees once the bar passes them.",
  },
  {
    exerciseId: "deadlift",
    chunkType: "mistakes",
    title: "Deadlift - Common Mistakes",
    content:
      "Rounding the lower back: The most dangerous and common error. Fix by bracing harder, lifting your chest before pulling, and potentially reducing the weight. Hips rising first: The hips shoot up and the lift becomes a stiff-leg deadlift. Fix by cueing 'push the floor away' and keeping the chest up. Bar drifting away from the body: Increases the moment arm on the lower back. Fix by engaging your lats (cue: 'protect your armpits') and dragging the bar up your legs. Jerking the bar off the floor: Can cause bicep tears with a mixed grip. Take the slack out of the bar before pulling — apply gradual tension. Hyperextending at lockout: Leaning back at the top stresses the lumbar spine. Simply stand tall. Looking up: Can strain the neck. Keep your head neutral, eyes on a spot 6-10 feet ahead on the floor.",
  },
  {
    exerciseId: "deadlift",
    chunkType: "alternatives",
    title: "Deadlift - Alternatives & Substitutes",
    content:
      "Romanian deadlift (RDL): Starts from the top, focuses on the eccentric hamstring stretch. Great for hamstring hypertrophy. Trap bar (hex bar) deadlift: Handles at your sides reduce lower back stress and allow a more upright posture. Excellent for athletes. Sumo deadlift: Wider stance, more upright torso. Better for lifters with long torsos or limited hip mobility. Block pulls or rack pulls: Partial range of motion deadlift from an elevated starting point. Good for lockout strength. Deficit deadlift: Standing on a small platform increases the range of motion and builds strength off the floor. Kettlebell deadlift: Lighter, great for beginners learning the hip hinge pattern. Barbell hip hinge with bands: Teaches the hinge pattern without axial loading.",
  },
  {
    exerciseId: "deadlift",
    chunkType: "programming",
    title: "Deadlift - Programming Notes",
    content:
      "Strength: 3-5 sets of 1-5 reps at 80-95% 1RM. Rest 3-5 minutes. The deadlift is very taxing on the nervous system, so keep volume moderate. Hypertrophy: 3-4 sets of 6-10 reps at 65-80% 1RM. Higher reps on deadlifts are very fatiguing — technique often breaks down, so consider RDLs for hypertrophy work instead. Frequency: 1-2 times per week is sufficient for most lifters. Unlike squats, deadlifts are harder to recover from due to the eccentric loading on the back. Progression: Beginners can add 5-10 lbs per session. Intermediates should use weekly undulation (heavy/light days). Always deadlift early in your session when you're fresh. Never deadlift heavy when fatigued — the injury risk to the lower back is too high.",
  },

  // ── Back Extension ──────────────────────────────
  {
    exerciseId: "back-extension",
    chunkType: "overview",
    title: "Back Extension - Overview",
    content:
      "The back extension (also called hyperextension) is an isolation exercise for the posterior chain performed on a specialized bench. The lifter hinges at the hips over the pad, lowering the torso and then extending back up. Equipment needed: 45-degree back extension bench or GHD (glute-ham developer). Can be loaded with a plate, dumbbell, or barbell held against the chest. Difficulty: beginner. Despite its name, the back extension is primarily a hip extension exercise when performed correctly, making it an excellent glute and hamstring builder.",
  },
  {
    exerciseId: "back-extension",
    chunkType: "muscles",
    title: "Back Extension - Target Muscles",
    content:
      "Primary muscles: erector spinae (spinalis, longissimus, iliocostalis), gluteus maximus, and hamstrings. The relative emphasis depends on execution: rounding and extending the spine emphasizes the erectors; keeping a flat back and hinging at the hips emphasizes the glutes and hamstrings. Secondary muscles: adductors. Stabilizers: core musculature. The GHD version also engages the calves as stabilizers. This exercise is excellent for building the lower back endurance needed for heavy squats and deadlifts.",
  },
  {
    exerciseId: "back-extension",
    chunkType: "form",
    title: "Back Extension - Form Cues",
    content:
      "Setup: Adjust the pad so it sits at your hip crease, allowing your torso to hinge freely. Lock your feet under the foot pads. Cross your arms over your chest or hold a weight plate against your chest for added resistance. Descent: Hinge at the hips and lower your torso in a controlled manner. Keep a neutral spine throughout — don't round your back. Lower until you feel a stretch in your hamstrings (typically 60-90 degrees of hip flexion). Ascent: Squeeze your glutes and hamstrings to raise your torso back to a straight line with your legs. Don't hyperextend past neutral — your body should form a straight line at the top. Control the tempo: 2-3 seconds down, pause briefly at the bottom, 1-2 seconds up.",
  },
  {
    exerciseId: "back-extension",
    chunkType: "mistakes",
    title: "Back Extension - Common Mistakes",
    content:
      "Hyperextending at the top: Going past a straight body line puts excessive stress on the lumbar spine. Stop when your body is in a straight line. Rounding the back excessively: While some spinal flexion/extension can target the erectors, excessive rounding under load is risky. Keep a neutral spine for safety. Using momentum: Swinging up quickly reduces muscle activation. Use a controlled tempo. Going too fast on the descent: Letting gravity pull you down. Control the eccentric. Holding the weight behind the head: Increases the lever arm on the neck. Hold weight against the chest instead. Pad positioned too high: If the pad is above the hip crease, it restricts hip movement and turns it into pure spinal extension.",
  },
  {
    exerciseId: "back-extension",
    chunkType: "alternatives",
    title: "Back Extension - Alternatives & Substitutes",
    content:
      "Reverse hyperextension: Torso stays fixed while the legs move. Great for decompressing the spine while working the glutes. Good morning: Barbell on the back, hinging at the hips. Free-weight version of the back extension. Romanian deadlift: Standing hip hinge with a barbell. Heavier loading possible. Glute-ham raise (GHR): More advanced — combines hip extension and knee flexion. Builds hamstrings and glutes simultaneously. Bird dog: Bodyweight core and posterior chain exercise. Good for rehab and warm-ups. Superman hold: Floor-based back extension. Bodyweight only, good for beginners. Cable pull-through: Standing hip hinge with cable resistance.",
  },
  {
    exerciseId: "back-extension",
    chunkType: "programming",
    title: "Back Extension - Programming Notes",
    content:
      "Typically used as an accessory exercise after main compound lifts. Hypertrophy: 3-4 sets of 10-15 reps. Add load progressively by holding a plate or dumbbell. Endurance: 2-3 sets of 15-25 reps with bodyweight. Great for building work capacity in the lower back. The back extension is excellent as a warm-up movement (2 sets of 15 with bodyweight) before heavy squats or deadlifts to activate the posterior chain. Program it 2-3 times per week. It recovers quickly because it doesn't create much eccentric damage. It pairs well with ab work as a superset (back extensions + hanging leg raises).",
  },

  // ── Lunges ──────────────────────────────────────
  {
    exerciseId: "lunges",
    chunkType: "overview",
    title: "Lunges - Overview",
    content:
      "The lunge is a unilateral lower-body exercise where the lifter steps forward (or backward, or to the side) and lowers until both knees are bent to approximately 90 degrees. Lunges can be performed with bodyweight, dumbbells, a barbell, or kettlebells. Difficulty: beginner to intermediate. Lunges are one of the most functional exercises because they train single-leg strength, balance, and coordination in a pattern that mimics walking, running, and climbing. They also reveal and correct strength imbalances between legs.",
  },
  {
    exerciseId: "lunges",
    chunkType: "muscles",
    title: "Lunges - Target Muscles",
    content:
      "Primary muscles: quadriceps and gluteus maximus of the front leg. The front leg does the majority of the work. Secondary muscles: hamstrings, adductors, and calves. Stabilizers: core (transverse abdominis, obliques), hip abductors (gluteus medius), and the ankle stabilizers. Longer strides emphasize the glutes and hamstrings more. Shorter strides emphasize the quads. Walking lunges add a dynamic balance component. Reverse lunges are generally easier on the knees because the shin stays more vertical.",
  },
  {
    exerciseId: "lunges",
    chunkType: "form",
    title: "Lunges - Form Cues",
    content:
      "Forward lunge: Stand tall with feet hip-width apart. Step forward about 2-3 feet (stride length depends on your height). As your foot lands, bend both knees to lower your body. Your front knee should track over your toes, and your back knee should hover just above the floor. Your front shin should be roughly vertical or slightly forward. Keep your torso upright — don't lean forward excessively. Push off your front foot to return to the starting position. Reverse lunge: Same mechanics, but step backward instead. This is easier on the knees and better for beginners. Walking lunge: Alternate legs while moving forward. Requires more balance and coordination. Hold dumbbells at your sides or a barbell on your back for added resistance.",
  },
  {
    exerciseId: "lunges",
    chunkType: "mistakes",
    title: "Lunges - Common Mistakes",
    content:
      "Front knee shooting past the toe excessively: While some knee travel is fine, extreme forward knee travel increases patellar stress. Fix by taking a longer step. Knee caving inward (valgus): The front knee collapsing inward. Cue 'push your knee out' and strengthen hip abductors. Leaning the torso forward: Shifts load to the lower back. Keep your chest up and core engaged. Stepping too narrow: Feet in a straight line (like a tightrope) makes balance very difficult. Keep a hip-width stance laterally. Not going deep enough: The back knee should nearly touch the floor for full range of motion. Pushing off the back foot: The front leg should do the work. The back leg is just for balance.",
  },
  {
    exerciseId: "lunges",
    chunkType: "alternatives",
    title: "Lunges - Alternatives & Substitutes",
    content:
      "Bulgarian split squat: Rear foot elevated on a bench. More stable than lunges, allows heavier loading and greater range of motion. Step-up: Stepping onto a box or bench. Similar unilateral pattern with less balance demand. Split squat: Static lunge position (feet don't move). Good for beginners who struggle with balance. Walking lunge: Dynamic variation that adds a conditioning element. Lateral lunge: Side-stepping lunge that targets adductors more. Curtsy lunge: Crossing the back leg behind for greater glute medius activation. Sled push/pull: Trains similar single-leg drive patterns without eccentric stress.",
  },
  {
    exerciseId: "lunges",
    chunkType: "programming",
    title: "Lunges - Programming Notes",
    content:
      "Lunges work well as a secondary or accessory exercise after bilateral compounds. Hypertrophy: 3 sets of 10-12 reps per leg. Use dumbbells at your sides for loading. Strength: 3-4 sets of 6-8 reps per leg with heavier load (barbell on back). Endurance/conditioning: 2-3 sets of 15-20 reps per leg or walking lunges for distance. Program lunges 1-2 times per week. They create significant eccentric damage (DOMS), especially walking lunges, so allow adequate recovery. Pair them with a bilateral exercise for balanced programming (e.g., squats + lunges). They're excellent for athletes because they develop single-leg power and stability used in running and cutting movements.",
  },

  // ── Upright Cable Rows ──────────────────────────
  {
    exerciseId: "upright-cable-rows",
    chunkType: "overview",
    title: "Upright Cable Rows - Overview",
    content:
      "The upright cable row is an upper-body pulling exercise performed by pulling a cable attachment straight up from waist height to chest or chin height with elbows leading the movement. Using a cable provides constant tension throughout the range of motion, unlike the barbell version where tension varies. Equipment needed: cable machine with a straight bar, EZ bar, or rope attachment. Difficulty: beginner to intermediate. This exercise primarily targets the shoulders and upper traps and is effective for building the lateral delts and creating wider-looking shoulders.",
  },
  {
    exerciseId: "upright-cable-rows",
    chunkType: "muscles",
    title: "Upright Cable Rows - Target Muscles",
    content:
      "Primary muscles: lateral deltoids and upper trapezius. The upright row is one of the few exercises that effectively targets the lateral delts with a pulling motion. Secondary muscles: anterior deltoids, biceps, forearms, and rhomboids. Stabilizers: core and lower trapezius. A wider grip (1.5x shoulder width) emphasizes the lateral delts more and is safer for the shoulder joint. A narrow grip increases upper trap activation but can cause shoulder impingement in some lifters. The cable version allows for slight variations in the pull path to find what feels best for your shoulder anatomy.",
  },
  {
    exerciseId: "upright-cable-rows",
    chunkType: "form",
    title: "Upright Cable Rows - Form Cues",
    content:
      "Setup: Set the cable pulley to the lowest position. Attach a straight bar or rope. Stand about one foot from the machine, feet shoulder-width apart. Grip the bar with hands slightly wider than shoulder width (wider is generally safer for shoulders). Pull: Lead with your elbows — imagine pulling your elbows up toward the ceiling. Pull the bar up to mid-chest height (not to your chin). Your elbows should always be higher than your wrists. Keep the bar close to your body throughout. Squeeze your delts at the top for a 1-second pause. Lower: Control the descent for 2-3 seconds. Don't let the weight stack slam. Keep a slight bend in your knees and avoid using body momentum to swing the weight up.",
  },
  {
    exerciseId: "upright-cable-rows",
    chunkType: "mistakes",
    title: "Upright Cable Rows - Common Mistakes",
    content:
      "Pulling too high: Pulling above mid-chest height causes shoulder internal rotation under load, which can lead to impingement. Stop at chest height. Using too narrow a grip: Narrows the space in the shoulder joint (subacromial space). Use at least shoulder-width grip. Wrists higher than elbows: Means you're curling the weight rather than rowing it. Keep elbows leading. Using momentum/body swing: Rocking the torso to get the weight up reduces shoulder activation. Stand firm and use strict form. Going too heavy: This exercise responds better to moderate weight and controlled reps than heavy loads. Shrugging at the top: Turning the row into a shrug by elevating the shoulders. Focus on leading with the elbows laterally.",
  },
  {
    exerciseId: "upright-cable-rows",
    chunkType: "alternatives",
    title: "Upright Cable Rows - Alternatives & Substitutes",
    content:
      "Barbell upright row: Free-weight version. Heavier loading possible but less constant tension. Dumbbell upright row: Allows independent arm movement and a more natural path. Lateral raises (dumbbell or cable): Isolates the lateral delt with less upper trap involvement. Face pulls: Cable exercise that hits the rear delts and external rotators. Better for shoulder health. Lu raises: Front raise to lateral raise combo that targets the entire deltoid. Dumbbell high pull: A dynamic pulling movement that targets similar muscles with more explosive movement. Band pull-apart: Light resistance band exercise for rear delts and shoulder health. Good warm-up.",
  },
  {
    exerciseId: "upright-cable-rows",
    chunkType: "programming",
    title: "Upright Cable Rows - Programming Notes",
    content:
      "Best used as an accessory exercise on shoulder or upper-body days. Hypertrophy: 3-5 sets of 8-12 reps. The cable provides constant tension, making this rep range especially effective for time under tension. Light/pump work: 2-3 sets of 15-20 reps at the end of a session for a shoulder pump. Program 1-2 times per week. This exercise pairs well with lateral raises and face pulls for complete deltoid development. If you experience any shoulder pain or clicking, switch to a wider grip, reduce the height of the pull, or substitute with lateral raises. Some lifters with shoulder impingement issues should avoid upright rows entirely and use lateral raises instead.",
  },

  // ── Hip Thrust ──────────────────────────────────
  {
    exerciseId: "hip-thrust",
    chunkType: "overview",
    title: "Hip Thrust - Overview",
    content:
      "The hip thrust is a glute-focused exercise where the lifter sits on the floor with their upper back against a bench, places a loaded barbell across their hips, and drives the hips upward until fully extended. Popularized by researcher Bret Contreras, the hip thrust has become the gold standard for glute development. Equipment needed: flat bench, barbell, weight plates, and a barbell pad or thick towel for comfort. Difficulty: beginner to intermediate. The hip thrust uniquely maximizes glute activation at the top of the movement (full hip extension), where the glutes are fully shortened — something squats and deadlifts don't do as effectively.",
  },
  {
    exerciseId: "hip-thrust",
    chunkType: "muscles",
    title: "Hip Thrust - Target Muscles",
    content:
      "Primary muscles: gluteus maximus — the hip thrust produces the highest glute EMG activation of any exercise studied. It targets both the upper and lower glute fibers. Secondary muscles: hamstrings (biceps femoris, semitendinosus, semimembranosus), quadriceps, and adductors. Stabilizers: core musculature and erector spinae (minimal compared to squats). The hip thrust is unique because it provides peak resistance at full hip extension, where the glutes are maximally contracted. Most other hip extension exercises (squats, deadlifts) have their hardest point at the bottom, where the glutes are stretched.",
  },
  {
    exerciseId: "hip-thrust",
    chunkType: "form",
    title: "Hip Thrust - Form Cues",
    content:
      "Setup: Sit on the floor with your upper back (bottom of your shoulder blades) against a bench. Roll the barbell over your legs to your hip crease. Use a barbell pad for comfort. Feet should be flat on the floor, about hip-width apart, positioned so that your shins are vertical at the top of the movement. Drive: Brace your core, tuck your chin slightly (look forward, not at the ceiling), and drive through your heels to push your hips up. Squeeze your glutes hard at the top — your body should form a straight line from shoulders to knees. Hold the top for 1-2 seconds. Lower: Control the descent, keeping tension on the glutes. The bar should move in a straight vertical line. Don't let your ribcage flare — keep your ribs down by engaging your abs.",
  },
  {
    exerciseId: "hip-thrust",
    chunkType: "mistakes",
    title: "Hip Thrust - Common Mistakes",
    content:
      "Hyperextending the lower back: Arching the lower back at the top instead of driving with the glutes. Fix by tucking your chin and engaging your abs — think of a posterior pelvic tilt at the top. Feet too close or too far: If feet are too close, quads dominate. If too far, hamstrings dominate. Shins should be vertical at the top position. Pushing through the toes: Shifts load to the quads. Drive through your heels. Bench too high or too low: The bench edge should be at the bottom of your shoulder blades. Too high restricts range of motion. Rising onto toes at the top: Keep feet planted flat. Rushing the reps: The hip thrust responds very well to a pause at the top. Hold each rep for 1-2 seconds.",
  },
  {
    exerciseId: "hip-thrust",
    chunkType: "alternatives",
    title: "Hip Thrust - Alternatives & Substitutes",
    content:
      "Glute bridge: Same movement but performed lying flat on the floor. Shorter range of motion. Great for beginners or as a warm-up. Single-leg hip thrust: Unilateral variation that addresses imbalances and increases difficulty without added weight. Cable pull-through: Standing hip hinge with cable resistance at the bottom. Targets similar muscles. Reverse hyperextension: Machine-based glute and hamstring exercise that also decompresses the spine. Frog pump: Feet together, knees out, thrusting from the floor. High glute activation with no equipment. Smith machine hip thrust: Easier setup than a barbell. The fixed path makes it simpler to learn. Banded hip thrust: Using a resistance band instead of a barbell. Good for home workouts.",
  },
  {
    exerciseId: "hip-thrust",
    chunkType: "programming",
    title: "Hip Thrust - Programming Notes",
    content:
      "The hip thrust can be used as a primary glute exercise or as an accessory. Strength: 4-5 sets of 5-8 reps at heavy loads. Rest 2-3 minutes. Hypertrophy: 3-4 sets of 8-12 reps with a 1-2 second pause at the top. This is the most common rep range for glute growth. Endurance/pump: 2-3 sets of 15-20 reps at lighter weight. Great finisher. Frequency: Glutes recover quickly and respond well to high frequency — 2-4 times per week is effective. The hip thrust pairs well with squats (which load the glutes in a stretched position) for complete glute development through the full range of motion. Progressive overload: Add 5-10 lbs when you can complete all reps with a full pause at the top.",
  },

  // ── Overhead Press ──────────────────────────────
  {
    exerciseId: "overhead-press",
    chunkType: "overview",
    title: "Overhead Press - Overview",
    content:
      "The overhead press (also called the military press or strict press) is a compound upper-body exercise where the lifter presses a barbell from shoulder height to full lockout overhead while standing. It was one of the original Olympic lifts until 1972. Equipment needed: barbell, squat rack for unracking. Can also be performed with dumbbells or kettlebells. Difficulty: intermediate. The overhead press is the best test of upper-body pressing strength and is essential for building strong, well-developed shoulders, triceps, and upper chest.",
  },
  {
    exerciseId: "overhead-press",
    chunkType: "muscles",
    title: "Overhead Press - Target Muscles",
    content:
      "Primary muscles: anterior deltoid, lateral deltoid, and triceps. The anterior delt does the majority of the work during the press, with the triceps handling the lockout. Secondary muscles: upper pectoralis major (clavicular head), upper trapezius, and serratus anterior. Stabilizers: core (entire midsection braces to prevent excessive back arch), erector spinae, gluteus maximus (standing variation requires full-body stability). The standing press demands more core and full-body stability than the seated variation, making it a more functional movement.",
  },
  {
    exerciseId: "overhead-press",
    chunkType: "form",
    title: "Overhead Press - Form Cues",
    content:
      "Setup: Unrack the bar at collarbone height with a grip slightly wider than shoulder width. Elbows should be slightly in front of the bar (not behind it). Feet shoulder-width apart. Squeeze your glutes and brace your core to create a stable base. Press: Take a deep breath, brace, and press the bar straight up. As the bar passes your forehead, push your head forward (through the window) so the bar travels in a straight vertical line over your mid-foot — not in an arc around your head. Lockout with arms fully extended, bar directly over your ears and mid-foot. Lower: Bring the bar back down to your collarbone in a controlled manner. Let your head move back as the bar passes. Reset your brace between reps. Don't lean back excessively — a slight lean is acceptable but turning it into an incline press is a common fault.",
  },
  {
    exerciseId: "overhead-press",
    chunkType: "mistakes",
    title: "Overhead Press - Common Mistakes",
    content:
      "Excessive back lean: Turning the overhead press into a standing incline press by arching the lower back. This is risky for the lumbar spine. Fix by squeezing glutes and bracing abs harder. Pressing the bar around the head: Bar path should be straight up, not arcing forward. Push your head through as the bar passes your forehead. Flared elbows: Elbows should be slightly in front of the bar, not flared out to the sides. Wide elbows reduce pressing power and stress the shoulder joint. Not locking out: Full lockout is important for shoulder stability and deltoid activation. Press until your arms are fully extended. Grip too wide: Reduces leverage. Grip should be just outside shoulder width. Using leg drive: In a strict press, the legs stay locked. If you're dipping your knees, it becomes a push press (a different exercise).",
  },
  {
    exerciseId: "overhead-press",
    chunkType: "alternatives",
    title: "Overhead Press - Alternatives & Substitutes",
    content:
      "Dumbbell overhead press: Greater range of motion and independent arm movement. Can be performed standing or seated. Push press: Uses leg drive to help get the bar moving. Allows heavier loads and develops power. Seated barbell press: Removes the lower body from the equation, isolating the shoulders and triceps more. Arnold press: Dumbbell press with a rotation component that hits all three delt heads. Landmine press: Pressing a barbell loaded in a landmine at an angle. Easier on the shoulders and good for those with overhead mobility limitations. Machine shoulder press: Fixed path, good for beginners or training to failure safely. Z-press: Seated on the floor with legs extended. Eliminates any leg drive and requires exceptional core stability.",
  },
  {
    exerciseId: "overhead-press",
    chunkType: "programming",
    title: "Overhead Press - Programming Notes",
    content:
      "The overhead press progresses slower than any other barbell lift. Be patient and use micro-loading (1.25 lb plates) when available. Strength: 3-5 sets of 3-6 reps at 75-90% 1RM. Rest 3-4 minutes. Hypertrophy: 3-4 sets of 8-12 reps at 65-75% 1RM. Rest 2-3 minutes. Frequency: 2-3 times per week works well, varying intensity. It pairs perfectly with pulling movements (rows, pull-ups) on the same day. Program it as the first pressing movement in your session. If you're stuck, add push press work (heavier than your strict press) and Z-press (forces strict form) as variations. A reasonable long-term goal is pressing your bodyweight overhead for a single rep.",
  },

  // ── Leg Press ───────────────────────────────────
  {
    exerciseId: "leg-press",
    chunkType: "overview",
    title: "Leg Press - Overview",
    content:
      "The leg press is a machine-based compound lower-body exercise where the lifter pushes a weighted sled away from their body using their legs while seated in a reclined position. It's one of the most popular gym machines for building leg size and strength. Equipment needed: 45-degree leg press machine or horizontal leg press machine. Difficulty: beginner. The leg press allows very heavy loading (often 2-4x what you can squat) without spinal compression, making it an excellent choice for building leg mass. It's also beginner-friendly because the machine handles balance and stabilization.",
  },
  {
    exerciseId: "leg-press",
    chunkType: "muscles",
    title: "Leg Press - Target Muscles",
    content:
      "Primary muscles: quadriceps (all four heads), gluteus maximus. Similar to the squat in muscle recruitment but with less core and stabilizer demand. Secondary muscles: hamstrings and adductors. The degree of engagement depends heavily on foot placement. Foot placement guide: Feet low on the platform = more quad emphasis. Feet high on the platform = more glute and hamstring emphasis. Feet narrow = more outer quad (vastus lateralis). Feet wide = more inner quad (vastus medialis) and adductors. The leg press removes almost all core and back demand compared to free-weight squats.",
  },
  {
    exerciseId: "leg-press",
    chunkType: "form",
    title: "Leg Press - Form Cues",
    content:
      "Setup: Sit in the machine with your back flat against the pad and head resting on the headrest. Place your feet about shoulder-width apart in the middle of the platform, toes slightly pointed out. Release the safety catches. Descent: Lower the sled by bending your knees toward your chest. Descend until your knees are bent to about 90 degrees — your thighs should be close to your chest but your lower back should NOT lift off the pad. Ascent: Push through your full foot to extend your legs. Don't lock out your knees completely — stop just short of full extension to maintain tension. Control the weight throughout — don't bounce at the bottom or slam the weight at the top.",
  },
  {
    exerciseId: "leg-press",
    chunkType: "mistakes",
    title: "Leg Press - Common Mistakes",
    content:
      "Lower back lifting off the pad (butt wink): Going too deep causes the pelvis to tuck under, rounding the lower back under heavy load. Extremely dangerous. Fix by reducing the range of motion to where your back stays flat. Locking out the knees: Full lockout under heavy load can hyperextend the knee joint. Stop just short of lockout. Knees caving inward: Push your knees out in line with your toes throughout the movement. Placing feet too low and pressing through toes: Can cause excessive knee stress. Keep feet in the middle of the platform and push through the full foot. Using too much weight with partial reps: Ego lifting with 2-inch range of motion. Use a full range with manageable weight. Bouncing at the bottom: Using the stretch reflex instead of controlled muscle contraction.",
  },
  {
    exerciseId: "leg-press",
    chunkType: "alternatives",
    title: "Leg Press - Alternatives & Substitutes",
    content:
      "Hack squat: Similar machine-based quad exercise with a more squat-like pattern. Barbell back squat: Free-weight alternative that also trains the core and stabilizers. Front squat: Free-weight quad-dominant squat with high core demand. Smith machine squat: Fixed path squat with some stabilization removed. Belt squat: Loads the hips via a belt, zero spinal loading. Goblet squat: Lighter but effective for beginners who can't access a leg press. Single-leg leg press: Press with one foot for unilateral development. Builds balance between legs.",
  },
  {
    exerciseId: "leg-press",
    chunkType: "programming",
    title: "Leg Press - Programming Notes",
    content:
      "The leg press is best used as a secondary quad exercise after free-weight squats, or as a primary exercise for those who can't squat due to back issues. Hypertrophy: 3-4 sets of 8-15 reps. The machine allows safe training to failure, making higher rep ranges very effective. Strength: 4-5 sets of 5-8 reps. You can load this very heavy. Volume/pump: 2-3 sets of 20-30 reps at lighter weight for a quad pump. The leg press responds exceptionally well to intensity techniques: drop sets (strip a plate after failure, continue), rest-pause, and 1.5 reps (full rep + half rep = 1). Program 1-2 times per week. It recovers faster than free-weight squats because it produces less systemic fatigue.",
  },

  // ── Adduction ───────────────────────────────────
  {
    exerciseId: "adduction",
    chunkType: "overview",
    title: "Adduction Machine - Overview",
    content:
      "The hip adduction machine (also called the inner thigh machine) is an isolation exercise where the lifter squeezes their legs together against padded resistance. The lifter sits with their legs spread apart and brings them together in a controlled manner. Equipment needed: hip adduction machine. Difficulty: beginner. While often overlooked, the adductors are a large and important muscle group that contributes to squatting strength, athletic performance (sprinting, cutting), and hip stability. Training them directly can improve performance on compound lifts and reduce injury risk.",
  },
  {
    exerciseId: "adduction",
    chunkType: "muscles",
    title: "Adduction Machine - Target Muscles",
    content:
      "Primary muscles: adductor group — adductor magnus (the largest adductor and one of the largest muscles in the body), adductor longus, adductor brevis, pectineus, and gracilis. The adductor magnus is particularly important because it also functions as a hip extensor, making it a synergist in squats and deadlifts. Secondary muscles: minimal secondary involvement since this is an isolation exercise. Stabilizers: core musculature keeps the torso stable during the movement. Strong adductors contribute to knee stability and are critical for athletes who need to change direction quickly.",
  },
  {
    exerciseId: "adduction",
    chunkType: "form",
    title: "Adduction Machine - Form Cues",
    content:
      "Setup: Adjust the machine so your legs are spread to a comfortable starting width — you should feel a mild stretch but no pain. Sit with your back flat against the pad, core engaged. Place the inside of your knees or thighs against the pads. Grip the handles for stability. Squeeze: Bring your legs together in a controlled manner by contracting your inner thighs. Squeeze at the fully closed position for 1-2 seconds. Return: Slowly allow your legs to spread back to the starting position. Control the eccentric — don't let the weight pull your legs apart. Maintain an upright torso throughout. Don't use momentum or jerk the weight. Focus on feeling the inner thigh muscles working through the full range.",
  },
  {
    exerciseId: "adduction",
    chunkType: "mistakes",
    title: "Adduction Machine - Common Mistakes",
    content:
      "Setting the starting position too wide: Excessive starting stretch can strain the groin. Start at a comfortable width and progressively increase over time. Using momentum: Jerking the legs together instead of using controlled contraction. Leaning forward or rounding the back: Sit upright with back flat against the pad throughout. Going too heavy: The adductors respond better to moderate weight and higher reps than max loads. Not controlling the eccentric: Letting the weight slam the legs open. The eccentric (opening) phase is important for muscle development. Rushing through reps: Take 1-2 seconds to squeeze, hold 1 second, 2-3 seconds to open.",
  },
  {
    exerciseId: "adduction",
    chunkType: "alternatives",
    title: "Adduction Machine - Alternatives & Substitutes",
    content:
      "Copenhagen plank: Side plank variation with the top leg on a bench, bottom leg squeezing up. Excellent adductor strengthener and groin injury preventer. Sumo squat or sumo deadlift: Wide-stance compound movement that heavily involves the adductors. Cable adduction: Standing, pulling one leg inward against cable resistance. Greater range of motion than the machine. Side-lying adduction: Lying on your side, lifting the bottom leg. Bodyweight only. Lateral lunge: Stepping to the side and pushing back. Trains adductors through a dynamic stretch. Band squeeze: Squeezing a ball or band between your knees during glute bridges. Cossack squat: Deep single-leg squat with the other leg extended. Excellent adductor mobility and strength.",
  },
  {
    exerciseId: "adduction",
    chunkType: "programming",
    title: "Adduction Machine - Programming Notes",
    content:
      "The adduction machine is typically used as an accessory exercise at the end of a leg session. Hypertrophy: 2-3 sets of 12-20 reps. Higher rep ranges work well for this muscle group. The adductors respond well to higher volume and frequency. Prehab/rehab: 2-3 sets of 15-20 reps at light weight. Important for groin injury prevention, especially for athletes in sports with lateral movement (soccer, hockey, basketball). Program 2-3 times per week. The adductors recover quickly. Superset with abduction for time efficiency (adduction set, immediately followed by abduction set). For strength athletes: strong adductors improve squat performance, particularly out of the hole. Train them year-round, not just when they're injured.",
  },

  // ── Abduction ───────────────────────────────────
  {
    exerciseId: "abduction",
    chunkType: "overview",
    title: "Abduction Machine - Overview",
    content:
      "The hip abduction machine (also called the outer thigh machine) is an isolation exercise where the lifter pushes their legs outward against padded resistance. The lifter sits with their legs together and pushes them apart. Equipment needed: hip abduction machine (often the same machine as adduction, with an adjustment). Difficulty: beginner. The hip abductors are crucial for hip stability, knee health, and athletic performance. Weakness in the hip abductors — particularly the gluteus medius — is linked to knee valgus (caving) during squats, IT band syndrome in runners, and general lower-body instability.",
  },
  {
    exerciseId: "abduction",
    chunkType: "muscles",
    title: "Abduction Machine - Target Muscles",
    content:
      "Primary muscles: gluteus medius and gluteus minimus — these are the primary hip abductors located on the side of the hip. The tensor fasciae latae (TFL) also assists. The gluteus medius is critical for pelvic stability during single-leg activities (walking, running, lunging). Secondary muscles: the upper fibers of the gluteus maximus also assist with abduction, especially when the hip is flexed. Stabilizers: core musculature. Strengthening the hip abductors improves knee tracking during squats and reduces the risk of IT band syndrome, patellofemoral pain, and ACL injuries.",
  },
  {
    exerciseId: "abduction",
    chunkType: "form",
    title: "Abduction Machine - Form Cues",
    content:
      "Setup: Sit in the machine with your back flat against the pad. Place the outside of your knees or thighs against the pads, starting with legs together or slightly apart. Grip the handles for stability. Push: Push your legs outward against the pads by contracting your outer hips. Push to the full range of motion — as wide as you can comfortably go. Squeeze at the fully open position for 1-2 seconds. Return: Slowly bring your legs back to the starting position. Control the return — don't let the weight slam your legs together. Keep your torso upright and stationary throughout. You can lean slightly forward to increase gluteus maximus involvement, or sit upright to emphasize the gluteus medius.",
  },
  {
    exerciseId: "abduction",
    chunkType: "mistakes",
    title: "Abduction Machine - Common Mistakes",
    content:
      "Using too much weight: The hip abductors are smaller muscles. Excessive weight leads to compensations like rocking the torso. Using momentum: Jerking the legs open instead of controlled contraction. Not using full range of motion: Push to the full comfortable range. Partial reps reduce effectiveness. Leaning back too far: A slight forward lean can help, but leaning back excessively changes the exercise. Not controlling the eccentric: Letting the weight slam your legs together. The eccentric is important for strength gains. Holding your breath: Breathe continuously — exhale as you push out, inhale as you return. Ignoring this exercise: Many lifters skip abduction work, leading to weak glute medius and knee stability issues.",
  },
  {
    exerciseId: "abduction",
    chunkType: "alternatives",
    title: "Abduction Machine - Alternatives & Substitutes",
    content:
      "Banded lateral walk (monster walks): Walking sideways with a resistance band around the ankles or knees. Excellent glute medius activation. Clamshell: Lying on your side with knees bent, opening the top knee against band resistance. Great rehab exercise. Side-lying hip abduction: Lying on your side, lifting the top leg. Bodyweight isolation. Cable abduction: Standing, pushing one leg outward against cable resistance. Single-leg Romanian deadlift: While not an abduction exercise, it demands significant glute medius stability. Fire hydrant: On hands and knees, lifting the leg laterally. Band-around-knees squat: Performing squats with a band around the knees forces constant glute medius activation to prevent knee cave. Lateral band walk: Walking sideways with a mini band. Excellent warm-up.",
  },
  {
    exerciseId: "abduction",
    chunkType: "programming",
    title: "Abduction Machine - Programming Notes",
    content:
      "Best used as an accessory or warm-up exercise. Hypertrophy: 2-3 sets of 12-20 reps. The abductors respond well to higher rep ranges. Warm-up/activation: 2 sets of 15-20 reps with light weight before squats or deadlifts. Activating the glute medius before compound lifts improves knee tracking and squat performance. Prehab: 2-3 sets of 15-20 reps, 2-3 times per week. Essential for runners and athletes to prevent IT band and knee issues. Program 2-3 times per week. Superset with adduction for efficiency. For lifters with knee cave issues during squats: do 2 sets of abduction as part of your squat warm-up, then put a light band around your knees during warm-up squat sets. This teaches the knees to track outward.",
  },
];
