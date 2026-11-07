# Idle Progression and Run Debrief — Integration Plan

**Status:** Phases 1–6 implementation slices are recorded below; Phase 6 generic pet systems are ready for player hands-on review. Individual crew/pet identities and designs remain deferred to separate, one-at-a-time approvals.  
**Last reviewed:** 2026-11-06  
**Purpose:** Single source of truth for the user-approved progression, inventory, turret, crew, pet, and debrief design. Use this plan during phased implementation and update it when the user changes a decision.

## Collaboration and implementation approach

- Work in small, reviewable phases. Before each phase, explain its purpose, code areas, behavior changes, save/persistence impact, and concrete review point in plain language.
- Keep the user involved at phase boundaries. Do not silently expand a phase into unrelated systems or make unresolved balance/story decisions on the user's behalf.
- Preserve existing game behavior and saves unless a change is explicitly part of the reviewed phase. Use migrations/defaults for old local saves.
- Prefer data-driven definitions for item types, crew roles/traits, pet assignments, incidents, and upgrades so content can expand without replacing core logic.
- Keep exact prices, probabilities, conversion rates, cooldowns, and strength values configurable/tunable until playtesting.
- The concepts below are planned designs, not claims that those mechanics are already implemented.

## Existing project facts relevant to the plan

- The project is an Expo 57 / React Native game with `App.tsx` as a large owner of game state and UI, and `mechanics.ts` holding the `Run`, scoring, and simulation types/functions.
- `Run` already records a sector, route atlas, territory/combat/pickup counters, run credits, pets, and multiple event arrays.
- A live run is saved periodically in AsyncStorage. Existing score records are normalized and limited to the top five; they store score, stage, territory, ball, pickup, and timestamp summary fields, but no full run report.
- Run end currently writes the compact score record and removes the active run save. The score screen is rendered in `App.tsx`.
- Therefore Captain's Log work must extend the existing record/save path and keep legacy score entries readable. Avoid creating a second competing run-history mechanism.
- Current untracked `.preview-*` files and `debug.log` were present before work on this plan and must not be altered, staged, or removed as part of these phases.

## Approved run progression loop

1. Start in a playable stage. The run begins with empty run cargo, baseline systems, current persistent unlocks, and the player's persistent named crew/pet rosters.
2. The stage's exterior vista remains fixed for that stage. Choosing and engaging a new beacon loads the next level and its corresponding vista/conditions.
3. Beacons are visible across the map; only reachable ones are interactive. Show connected paths from the current beacon and preserve the route atlas for the run.
4. A player clears a stage and collects its moving exit pickup. The game does not automatically jump. The player opens the map/navigation interface and selects a reachable beacon, reviews its preview, and explicitly engages the jump.
5. Beacon preview names should match the actual event (for example, Drift Swarm, Cinder, Engi Wreckage, or Elimination). Show all non-hidden effects and varied place-specific description. Hidden events remain concealed. Picture events show an image preview and unlock their vista only when the stage is cleared.
6. Beacon risk and negative effects should be balanced by resource rewards or score bonuses. Elimination events and Drift Swarms provide completion rewards. Rewards show their actual skin/icon and quantity.
7. Stage play produces real, timestamped gameplay events for crew dialogue, bubbles, logs, rewards, and the eventual Captain's Log. Dialogue must never invent an event or reveal a hidden beacon result.
8. Pickups enter shared cargo or its incoming buffer. Manual refining, eligible overflow processing, and crafting/upgrades occur during the run.
9. Run end produces the full Captain's Log report, research conversion, separate milestone rewards, and crew/pet invitation decisions.
10. Save the report alongside its high-score row. Reset run cargo and run-only upgrades. Persist research/blueprints, roster and capacity progress, and named crew/pets.

Fuel remains disabled. The resource/fuel economy is not to be invented or switched on as a side effect of these phases.

## Persistence boundary

### Persist between runs

- Engineering Research, unlocked blueprints, and explicitly approved modest permanent improvements.
- Permanent crew roster and persistent crew-capacity upgrades.
- Permanent pet roster and separate pet-capacity upgrades.
- Named crew/pet identity, traits, species instincts, relationships, and modest earned proficiency.
- Best-score rows and the saved report snapshot attached to each retained score.
- Existing cosmetic unlocks and user preferences.

### Reset at run end

- Cargo contents and incoming buffer.
- Run credits, temporary turret upgrades, temporary storage/foundry improvements, and run-only buffs.
- Temporary resource/upgrade assemblies, including installed claimed-space turret assemblies.
- Assigned run duties and run-local condition effects; between runs crew and pets continue ambient story/ship behavior but have no gameplay effect until assigned in a new run.

### Run-end conversion

- Only explicitly eligible salvage converts into Engineering Research, subject to a visible cap.
- Milestone Research is listed separately, with its own visible cap so it cannot bypass the salvage limit.
- Salvage above the conversion cap does not carry into the next run; it becomes the agreed modest score bonus, shown explicitly.
- Keep this math configurable and explain each source in the report.

## Captain's Log / debrief

- Unique, calm interface combining tactical mission-dossier structure with a personal captain's voice/notes. Use an easy-on-the-eyes dark blue-charcoal base, soft warm-white text, restrained cyan/amber accents, clear spacing, and minimal glow.
- Prefer one scrollable dossier with a fixed chapter index over a forced multi-screen wizard. Reward/recruitment decisions still require clear player actions.
- Sections: mission cover/outcome; exact route atlas and beacon/event record; stage/combat/pickup/territory stats; cargo collected/spent/refined/lost; salvage-to-Research and milestone accounting; crew/pet contributions and notable events; invitations; reset/persistence closeout.
- Narrative recap may be multi-paragraph, built only from actual saved facts and event records. Preserve notable passive comments and story moments; do not fabricate near misses, actions, or dialogue.
- Selecting a top-five score opens its read-only report snapshot. Reports remain available after their score falls outside the Top Five, in a separate run archive. Existing historical score entries without reports remain displayable and show a clear legacy/no-report state.
- Report data must be bounded and deliberate: do not embed transient visual particles or the entire simulation state. Store a compact immutable snapshot in a versioned archive and cap narrative/log entries to report-worthy facts. Archive retention policy (all reports vs a capped recent history) remains an implementation decision for the Phase 1 review gate; recommended default is to retain all compact reports until the player deletes them.

## Shared cargo and foundry

- Shared run-local, Unturned-inspired shaped grid with item art, footprints, limited stacking, manual rearrangement, and helpful sorting.
- Starting item families: **Raw Salvage** (refinery eligible), **Components** (for systems/upgrades), **Consumables**, and **Special Salvage** (rare parts/relics/crafting materials). Credits and Engineering Research are ledger balances, not cargo items.
- Each item has data for stable id/name, skin, footprint, stack cap, rarity/source, run-vs-persistent scope, crafting uses, refinery eligibility, and safe overflow behavior.
- Capacity upgrades add grid space; stack/compression upgrades affect only eligible stackable items. These improvements are run-only; research may unlock their blueprints/options without granting the run effect.
- Every newly collected pickup first stacks into a matching stack or uses open cells. If full, it waits in a small incoming buffer instead of disappearing. If that buffer is occupied, later pickups remain available on the board until space is made.
- Foundry has **Overflow** and **Manual** modes. Overflow processes only eligible, unprotected items under explicit keep-count/protection settings to make room; manual can process a chosen eligible item/amount even if space remains. Show input, quantity, expected Credits, and queue. Never silently refine protected/unique materials.
- Only queued foundry tasks advance offline, bounded by an agreed cap. Routine offline crew simulation/run progression is not implicitly added.
- Special crafting resources are additional to run Credits, ordinary Components, Research unlocks, and the rare mount assembly. They are protected from overflow refining by default; recipes can require combinations of salvage, special resources, and Credits.
- Quartermaster and Cargo Helper aid sorting/workflow modestly; they do not create inventory space or bypass storage limits.

## Turret system

- Starter interceptor is a fixed lower-rail mount with short range, low accuracy, a firing cooldown, and no ammunition in the first version. Selecting it shows a clear active-range overlay and a panel with stats, target, cooldown, modes, and upgrades.
- Bubbles take one hit at all tiers. Smallest splitter balls take two hits initially, then one hit after a Fire Power upgrade. At highest Fire Power, an eligible anchor ball converts into a normal ball plus a powerup.
- Default target protocol alternates eligible types (smallest splitters and bubbles) when both exist in range; it fires at the available eligible type if only one exists. Misses consume the shot/cooldown.
- Higher targeting tiers let the player choose priorities among unlocked eligible target types. Later upgrade can target actively drifting balls.
- Upgrade branches stay distinct: **Mobility** (lower rail, then side and ceiling tracks), **Fire Control** (range/accuracy/cooldown and later target priority), **Fire Power** (splitter hits then anchor conversion), and **Deployment** (claimed-space mounts).
- Claimed-space placement requires a persistent research blueprint plus a rare per-run mount assembly for each extra turret. It offers extra coverage but can be hit by phase balls. A broken mount is repairable and temporarily disabled, not permanently deleted. Perimeter-mounted turrets are safer from direct collision.
- Run Credits fund ordinary current-run upgrades; run Components may gate major improvements. Research unlocks blueprints/options only. The rare assembly remains a separate run item. No exact costs or strength values are fixed yet.
- Defense Specialist/Engineer and Systems Helper pet assistance can be small, capped, and conditional on actual maintenance/targeting tasks.

## Crew system

### Roles (10)

1. Engineer — system upkeep and repair.
2. Quartermaster — cargo and foundry workflow.
3. Navigator — route/beacon information without revealing hidden outcomes.
4. Defense Specialist — turret monitoring and maintenance.
5. Field Salvager — salvage handling/recovery.
6. Medic — crew condition/incident response.
7. Research Analyst — anomalies, picture events, and research context.
8. Pilot — flight checks/jump preparation, distinct from Navigator.
9. Communications Officer — transmissions and contact events, never exposing hidden outcomes.
10. Life Support Technician — environmental comfort and crew recovery.

Role is an assignment, not a character class. Any crew can be assigned any role; skills change work effectiveness.

### Skills, traits, species

- Skills: Engineering, Logistics, Navigation, Gunnery, Salvage, Medicine, Research, Piloting, Communications, Life Support.
- Each crew member receives 1–4 skills and separately 1–4 traits, with two of each as the average. Skill levels can be Basic/Skilled/Expert; exact generation/balance remains tunable.
- Initial traits: Meticulous, Quick Study, Cautious, Bold, Sociable, Solitary, Restless, Patient, Compassionate, Tinkerer.
- Add and retain all 20 approved traits: Early Riser, Night Owl, Improviser, Archivist, Curious, Skeptical, Steady Hands, Resourceful, Neat Freak, Collector, Mentor, Peacemaker, Competitive, Prankster, Storyteller, Dry Wit, Sentimental, Homesick, Thrill Seeker, Frugal Technician.
- Avoid duplicate traits and combinations that are narratively contradictory unless a deliberate rare exception is written.
- Species provides shared documented baseline bonuses (Engi +2 Salvage is the example). Rare individuals can receive an additional random background specialty, e.g. Wreck Diver +1 Salvage. Species baseline, individual edge, skill, and trait are separate layers; exact numeric scale is to be tuned.
- Traits affect work choices, idle routine, and dialogue as well as any modest bounded modifiers. Avoid a universally best crew member.

### Relationships, needs, autonomy, and stories

- Pairwise **Rapport** and **Professional Respect** develop through shared tasks, help, disagreements, and events. Show readable labels (acquaintances, trusted partners, friction) rather than requiring the player to parse raw values.
- During runs, positive work relationships may provide small capped teamwork; friction may create dialogue or brief disagreements but never sabotage. Between runs, relationships are story-only.
- Needs: Energy, Morale, Social Connection. Mood is derived, not a fourth bar; injuries/conditions come from specific events. Needs shift slowly, with crew autonomously resting/socializing when work allows. They do not turn the idle game into constant micromanagement.
- Activity priority: urgent real gameplay event > assigned work > high-need recovery > social interaction > ordinary idle activity. Crew regularly walk among reachable stations/shared areas when their task queue is clear. They redirect for urgent work and avoid blocking the window or interactive consoles.
- Passive communication uses frequent short icon bubbles, occasional brief sentence bubbles, and a persistent searchable/filterable ship log. Bubble disappears; meaningful entries persist. Role, species, skill, traits, relationships, beacon/stage state, and recent actual events shape lines.
- Stage callouts are tied to real game state (phase ball breach, rare drop, splitter crowding, stage clear/failure); cooldowns and variation prevent spam. Dialogue cannot collect items or alter game state by itself.
- Incident tiers: (1) ambient animation/log only; (2) quiet notice, usually self-resolved; (3) rare player decision with explained tradeoffs. No unexpected character death/permanent removal. Captain's Log uses notable factual moments.
- Initial incident candidates: shift handoff; pet visit; mentoring; rare drop spotted; containment warning; post-stage release; sorting backlog; minor console fault; worn-down crew/reassignment; work disagreement; competing turret/foundry maintenance; unverified transmission; risky salvage handling; mediation request; recruit offer.
- Crew roster persists. Run-recruited crew are offered for invitation at debrief; permanent upgradable crew capacity controls the roster. Between runs they remain familiar named ship characters, but gameplay effects are inactive until assigned in a later active run. No previous-run temporary upgrade carries forward.

### Crew interface

- Crew Systems screen: Manifest (role, location/activity, condition, roster capacity); selected Crew Dossier (skills, traits, species/individual bonuses, needs, relationship highlights, recent history); Assignment Board (role and reorderable task priorities); relationship detail; searchable/filterable Ship Log.
- Role/task changes are immediate and readable; idle autonomy fills clear queues.

## Pet system

- Named pet roster persists, separate and separately upgradable capacity. Pets remain ship companions between runs; no gameplay effects until assigned during an active run.
- Pets have species instincts, temperament, crew bonds, and modest individual aptitudes. All can be assigned to any pet duty, with fit shown as Poor/Suitable/Natural; fit improves reliability/timing rather than large direct power.
- Keep all five assignments: **Spotter** (react to visible stage events, no hidden-beacon reveal); **Retriever** (recover only eligible pickup types explicitly allowed by the player, respect cargo capacity, never auto-take rare/event rewards without permission); **Cargo Helper** (workflow without creating space/resources); **Crew Companion** (small run-only recovery/companionship); **Systems Helper** (small task/cooldown-limited maintenance support).
- Pet temperaments affect choices/routines and dialogue. Pets wander, nap, follow bonded crew, play, investigate safe props, and interact with crew/pets. They do not take crew jobs.
- Each pet gets one primary assignment plus a backup/idle activity. Task controls, fit, current behavior, bond, training progress, and Retriever filter appear in the Pets tab of Crew Systems.
- Persistent modest proficiency can improve fit by one step up to a small cap through actual assigned work or optional downtime practice; species instincts and temperament stay fixed. Run-only boosts reset.
- Pets recruited/found during a run travel with the ship through that run; debrief offers Adopt/Release subject to pet capacity. No automatic forced adoption.
- Pets use icon/sentence bubbles and the same passive log; no repetitive spam or console/window obstruction.

## Phased integration outline

### Model and reasoning-effort guide

At the start of each phase, state the recommended Codex model and reasoning effort, explain why, and note the speed/usage tradeoff before implementation. These are recommendations; the user chooses whether to change the active setting. Model choice and reasoning effort are separate settings.

| Phase | Recommended model and effort | Why |
|---|---|---|
| 0 — Architecture and review gate | GPT-6.1 Sol, High | Careful repository tracing and reconciling the approved design with existing code, while keeping the review readable. |
| 1 — Captain's Log and immutable run record | GPT-6.1 Sol, High | Save compatibility, reliable run-end writes, and legacy score handling need deliberate edge-case review. |
| 2 — Run-state and persistent profile foundation | GPT-6 Astra, High | This phase establishes the boundary between run resets and long-term progression; a mistake would affect every later system. |
| 3 — Cargo, item catalog, and foundry | GPT-6 Astra, High | Inventory persistence, capacity, overflow, refining, and offline queue rules interact across several systems. |
| 4 — Starter turret and upgrade branches | GPT-6.1 Sol, High | Targeting and upgrade logic are bounded enough for the workhorse model, with High effort for collision, range, and balance edge cases. |
| 5 — Crew data, duties, and ship routines | GPT-6 Astra, High | Crew autonomy, traits, relationships, event logs, and run-only bonuses create many interacting rules. |
| 6 — Pet assignments, acquisition, and training | GPT-6.1 Sol, High | The pet system follows established crew/run-state contracts; High effort helps preserve those boundaries. |
| 7 — Economy, beacon integration, and balance/content expansion | GPT-6 Astra, High | This phase combines rewards, risk, unlocks, event generation, and cross-system balance. |

Use Medium for narrow follow-up edits, content-only additions, and small bug fixes after a phase's contracts are established. Reserve GPT-6 Astra for the phases marked above because the additional reasoning is most valuable at architectural boundaries; it may take longer and use more of the available allowance. High effort improves the chance of catching interactions but does not replace implementation review or verification.

### Phase 0 — Architecture and review gate (complete)

- Inspect current source, saves, app rules, and existing gameplay paths. Record user-approved design and phased boundaries in this document.
- Do not touch the pre-existing untracked preview/debug artifacts.
- Present actual code touchpoints, compatibility risks, and one reviewable Phase 1 proposal before game-behavior edits.

### Phase 1 — Captain's Log and immutable run record (reviewed from player screenshots)

- Extend the current score record with a stable run id and write a versioned compact report snapshot to a separate run archive, using stats and route/event data already present in `Run`.
- Preserve/normalize legacy score rows without reports. Keep the existing top-five ranking behavior unless the user asks to change it.
- Add a calm dossier screen opened from each score row; include current available fields only and visibly label unavailable future sections rather than fabricating data.
- New run-end report snapshot and top-five score update are written before active-run save removal. If either write fails, active-save removal is not reached. The separate archive preserves the report even when its score row later drops out of the Top Five.
- Keep the record bounded; do not store full physics state or cosmetic event effects. Later phases add cargo and crew/pet facts to the same versionable report contract.
- User review gate: player tests the report flow, route/event details, reload persistence, and legacy-row behavior before Phase 2 begins. User has chosen to keep reports after runs leave the Top Five; retain all compact reports in the archive.

### Phase 2 — Run-state and persistent profile foundation

- Add versioned persistent profile for Research, blueprint ids, crew/pet capacity upgrade levels, modest permanent upgrade levels, and named crew/pet records. It starts with zero Research, no extra upgrades/blueprints, and empty rosters; exact reward amounts and capacity prices remain unset.
- Legacy active Run saves may omit the optional `ended` field; normalize those as still active rather than rejecting them.
- Add versioned run-progression state to the active Run. New runs copy only unlocked blueprint ids; run assignments and temporary upgrade levels start empty. Existing run balances/upgrades remain on an active save and continue across beacon jumps; fresh runs reset them through the current `newRun` defaults.
- Store the profile, full compact report archive, and Top Five rows in one versioned AsyncStorage record. Migrate the prior Captain's Log and score keys without deleting either source key; old saves receive safe profile/progression defaults. Unrelated settings, skin, vista, and manual-save keys remain separate.
- Serialize active-run writes and closeout. Before closeout, persist the ended Run as a recovery record; commit profile + report + score together; remove the ended active save only after commit. A launch retries an interrupted closeout. A replay of an already sealed run keeps its original report and receives no second persistent progression award.
- Show permanent profile totals in Flight Records and a run-closeout section in new reports. Research conversion remains zero/deferred until the economy phase; no fuel costs, backend, or offline run simulation.
- Verification completed: reload restored the existing Stage 05 active run; Flight Records showed five legacy Top Five rows, the archived Stage 01 report, and persistent-profile totals. Older Phase 1 reports gain a saved default closeout without changing score or sealed run facts. Nine focused persistence tests, TypeScript, and targeted ESLint passed. Playwright browser automation could not launch because the configured Chromium executable is missing.
- Remaining player review: optionally protect/save the current run elsewhere, then start a fresh run to inspect reset resources, upgrades, and assignments. The current active run was deliberately preserved during verification.

### Phase 3 — Cargo, item catalog, and foundry

- User-approved scope: represent **all current run resources**, including Credits and Power Bars, as shaped cargo items, alongside existing resource pickups, Merchant Tokens, and Engi Pods. Engineering Research remains a persistent profile ledger, rather than run cargo. Run cargo resets on a new run; persistent profile upgrades remain separate and only their approved carryover applies.
- Phase 3 first slice: add a data-driven catalog, a 10×8 shaped manifest, current-balance projection, and a foundry queue readout in the Bay Console Cargo Hold. Current Run fields remain authoritative in this review slice; opening the screen must not change pickup, spending, overflow, or save behavior. Existing recipes are shown only where already defined.
- Initial catalog stack caps are provisional tuning values. Item footprints are editable from Developer → Cargo Shapes on a 4×4 cell canvas, saved on-device, copied into each run, and used by both cargo packing and pickup-capacity checks. The tool supports connected polyomino footprints up to 16 cells and a per-item reset to the built-in shape.
- User choice: newly arriving stacks auto-pack into free cells; the player can then reposition them with one-cell controls. Keep placement collision-safe and persist the layout for the current run across stage jumps. Legacy active and manual saves get an empty placement map without changing resource counts.
- Implemented next slice: save per-run layout coordinates and 90° orientation, preserve them through sector jumps, migrate legacy saves, and let the player select, move, and rotate a stack within the grid. Resource counters remain authoritative; this still does not change pickup, capacity, or foundry behavior.
- Bridge integration: mount a compact horizontal cargo-stores module into the left console fascia directly below the Themes screen. Its inset preview shows cargo silhouettes/colors and an animated scan line; its adjacent meter shows remaining capacity; the lower seam reads as transfer-hatch hardware. It opens the same manifest as the Bay Console control and hides while the Bay Console is open. Position it on normalized interior art bounds, outside the window and existing screen hit areas; leave background art and exterior scene behavior unchanged.
- Rotation: stacks can rotate 90° in place when the rotated footprint fits; save the orientation with the run layout. Crew carrying/transfer animations stay a later behavior slice so they can use real crew, stations, and inventory transfers rather than decorative item duplication.
- Current foundry slice: Overflow/Manual mode is persisted per run and carried between beacons and manual saves. Manual mode leaves pickups on the board when the corresponding capacity is full; the player can queue a chosen amount from stored Life, Speed, RAM, or Charge while preserving the defined minimum keep. The queue displays the active item skin, source, processing time, success chance, and expected total Credits. Completed and manually completed refining are tracked separately; the sealed Captain's Log includes processed counts and pending jobs. Counts advance only when a queued job completes, not when it is submitted. On active-run resume, only queued foundry jobs progress offline, capped at two hours; ended runs and manual-save replays do not accrue offline processing.
- Minimum-keep control: from a selected refinable cargo stack, the player can raise or lower the run-local amount protected from manual refining. Catalog minimums remain hard floors (Life starts with one protected); the setting carries across beacon jumps and manual saves and resets on a new run.
- Inventory-space pass: Speed, RAM, and Charge no longer use per-resource quantity caps or paid per-resource capacity slots. New world pickups are accepted only if the shared 10×8 cargo manifest can fit them; when it cannot, Manual mode leaves them on the board and Overflow mode sends recipe-eligible items to the foundry. Existing saved balances are retained. Former beacon capacity rewards now increase that item's stack compression by one unit per stack, rather than imposing a quantity cap.
- Remaining in Phase 3: a small incoming buffer and complete cargo accounting for rewards and resource arrivals beyond Speed/RAM/Charge. Keep the existing counters/save compatibility and don't retroactively change old resource balances. Preserve legacy Run loads with safe defaults and preserve the current active save during verification.
- Verification checkpoint: Stage 05 previously reloaded with existing balances intact, and the user confirmed arrow rearrangement works and is acceptable. The current bridge preview showed the stores module directly under the Themes screen; opening it displayed the same manifest and returning to the bridge preserved all item placements. No cargo was moved or rotated during this visual pass. The user should review the fascia-mounted cargo module and test rotation before foundry behavior is connected. Phone-sized E2E could not run because Playwright's Chromium executable is not installed; see the previous checkpoint for that limitation.
- Foundry work must allow manual refining before overflow, bound offline queued processing, and display the actual item skin during the process. Add recipe affordances only when a matching recipe exists; do not invent broad economy values. Keep smelter upgrades integrated with the existing foundry values and make resource reset boundaries explicit.
- Foundry station slice: both the floating React card and the raised fascia machine fell short of the requested placement. The current artwork sinks the foundry below the window sill into a rear-deck floor well, with a live crucible, mineral feed, output tray, storage racks, and a physical SMELT plate. `BridgeFoundryStation.tsx` adds only in-world animation and transparent hit targets over the machine and painted control. The current fire shows the active resource's distinct icon/color; the accessible Foundry workbench reports its full name and cycle progress. Select a material in the workbench, then the bridge's SMELT button queues one unit when Manual mode is active and its protected reserve is available. Future ship stations must be a visible part of the ship model/art before overlay work begins.
- Refining lifecycle: new default cycle is 10 seconds per item, processed serially; each queued job snapshots its duration so future upgrades or per-item efficiency can be added without changing work already in progress. Automatic overflow pickups feed the foundry directly. Manual selections remain visible and reserved in cargo until 100%, then are consumed; reserved units cannot be spent on gameplay abilities. Canceling a held manual job unlocks its cargo, while canceling an overflow or legacy manual job returns one resource unit to stores. A completed attempt consumes the item whether the credit yield succeeds or fails.
- User review checkpoint before completing Phase 3: verify all current resources, pickup placement/collection, rearranging, protected items, manual and overflow refining, reload persistence, bounded offline work, new-run reset, and archived report snapshot behavior. Current internal milestone is ready for hands-on review of Manual/Overflow mode, queue completion, and Captain's Log foundry totals. Do not advance to Phase 4 until the remaining Phase 3 systems are implemented and reviewed.

### Phase 4 — Starter turret and upgrade branches

- **Current progress (2026-10-12):** First playable behavior slice is implemented in the run simulation: fixed lower-rail starter turret, in-range bubble/splitter targeting, alternating eligible types, cooldown and misses, one-hit bubbles, and the user-approved two-hit splitter destruction rule. Turret state persists across beacon jumps. Its housing is on a thin white glowing track below the full-size playfield, between the Life Vault and ability icons; its muzzle aligns with the board edge. The turret is draggable along the track; tapping opens a panel with range, accuracy, cooldown, target selection, and Fire Control/Fire Power upgrades. Initial upgrade prices are provisional (Fire Control: 60 + 70 per prior tier; Fire Power: 80 + 100 per prior tier) and need player review/balance tuning. Shots travel as visible bullets/tracers on hits and misses. **Visual direction selected (2026-10-12):** blend the angular, clearly upward-facing single-gun silhouette from option 1 with option 3's asymmetrical salvage armor and restrained amber hardware. Keep the cyan targeting lens, thin white rail, original board size, drag-to-reposition, and tap-for-stats/upgrades behavior. Mobility tiers now unlock port/starboard perimeter tracks (tier 1) and a ceiling track (tier 2), with provisional run-credit prices of 100 and 250. Track selection updates the range origin and shot position, and dragging uses the selected track axis; the board dimensions stay unchanged. **Deployment loop implemented (2026-10-12; first-pass balance):** each newly sealed run awards 1 persistent Research, capped at 3 total; the claimed-space mount blueprint costs 3 Research and is archived atomically with the purchase. Unlocking adds it to the current run snapshot. A rare (2% per eligible pickup spawn) protected 2×2 cargo assembly is animated into cargo; placement consumes it and installs an extra sentry in an empty claimed cell. Extra sentries fire using the current Fire Control/Power values. A phase-ball contact disables a claimed-space sentry; repair costs 25 run Credits. Mounts and carried assemblies persist across beacon jumps; old active saves default these new fields safely. All Research, drop chance, repair, and weapon prices remain tuning values pending player review. Mobility functionality remains accepted; detailed visual refinement is deferred.
- Add fixed lower-rail turret; bubble one-hit, smallest splitter two-hit; range visibility on selection; cooldown/misses; target alternation and state.
- Add run-only upgrade panel and the separate Mobility, Fire Control, Fire Power, and Deployment unlock structures.
- **Implemented 2026-10-12:** Add Mobility tier 1 (100 run Credits) for port/starboard rails and tier 2 (250 run Credits) for the ceiling rail; rail choice and dragging update turret geometry and firing origin without resizing the board. Costs are provisional.
- **Implemented 2026-10-12:** Claimed-space mount deployment now requires the persistent Research blueprint and a rare per-run cargo assembly; placement is limited to empty claimed cells, and phase-ball impacts disable the mount until repaired for 25 run Credits. Research is awarded once per newly sealed run (1 per run, total balance capped at 3), and blueprint purchase is serialized with the profile archive. Verify in player review and tune the provisional economy/rarity before treating Deployment as balanced.

### Phase 5 — Crew data, duties, and ship routines

- Scope boundary: this phase builds the reusable crew data, recruitment, duty, movement/pathing, status, and event hooks only. Do not create or design crew characters, species, pets, portraits, models, personalities, or individual bonus kits yet. Recruit offers use a generic empty roster record; bridge movement uses an abstract marker as a temporary pathing/status proxy. Define each actual crew member and pet individually in later, separately reviewed content work.
- **Generic framework slice implemented 2026-10-12:** a newly sealed run may offer one empty roster slot when capacity allows; accept/decline is saved through the progression archive. Accepted slots have ten generic duty definitions, run-local assignments, and an abstract clickable bridge marker that moves only on per-layout floor-safe anchors. No character or pet identity/content is authored. This is infrastructure, not the full crew phase: event-log hooks, cooldown/incident plumbing, and additional reusable station behavior remain future slices.
- Add persistent generic roster slots and reusable role/assignment contracts. Keep optional skills, traits, species bonuses, and individual edges as future extension points with no authored values in this phase.
- Add movement among safe anchors, crew status/duty interaction, and event/log hooks; defer character-specific autonomous needs, dialogue, and relationship behavior until individual crew are designed.
- Add relationship and incident tracking with cooldowns and caps; ensure no blocking of bridge window/screens and no work-queue thrashing.

### Phase 6 — Pet assignments, acquisition, and training

- Scope boundary: reuse the existing Engi/Waldo run systems without authoring new pet identities, models, portraits, species, temperaments, or abilities. Build assignment/acquisition/training contracts so future individual pets can plug into them one at a time.
- **Framework slice implemented 2026-10-13:** added the five data-driven duty definitions and backward-compatible run-local assignment plans (primary, backup, Retriever allowlist). Retriever defaults to off and permits only explicitly selected ordinary pickup kinds. The existing Flight Log console opens an in-bridge translucent Crew/Pets terminal; assignment controls save to run progression. No pet designs or abilities were authored.
- **Adoption and Retriever slice implemented 2026-10-13:** first-time run sealing offers every existing run companion for explicit adoption or release in Flight Records; adoption stores identity and existing skin, enforces roster capacity, and cannot be repeated by replay. Adopted roster companions join the next fresh run. Assigned Retriever pets can collect only selected ordinary pickups within range when the corresponding cargo shape fits; pickups follow existing destination transits, and successful recoveries contribute capped persistent Retriever proficiency at closeout. Existing acquisition rules remain unchanged.
- **Spotter slice implemented 2026-10-16:** an assigned run pet reacts to newly visible phase hazards/signatures, rare contacts, or a stage clear through the existing short-lived pet notice. One cue is credited per event, with a five-second pet cooldown; duty work uses the existing closeout proficiency path. No route outcomes, rewards, or pet identity content are revealed or changed.
- **Cargo Helper slice implemented 2026-10-28:** a living pet assigned Cargo Helper as primary or backup shortens newly queued foundry jobs by 1% per permanent Cargo Helper proficiency level, up to 5%. The strongest assigned helper applies without stacking; each job snapshots the reduced duration and helper identity at queue time. Completed smelts train that helper through the existing closeout proficiency path. Output remains in the tray until the player collects it. Existing pets only; no new character or pet designs.
- **Crew Companion and Systems Helper slices implemented 2026-11-06:** a living assigned Companion restores one missing life on the first stage clear where capacity permits, once per run, and trains through the existing closeout proficiency path. A living assigned Systems Helper prevents one wall-breaking hit per cooldown (30 seconds at novice, reduced by 2 seconds per permanent proficiency level to a 20-second floor); completed repairs train that helper. Multiple helpers never stack, unassigned pets have no effect, and both duties are shown with their live state in the Crew/Pets terminal. Legacy active runs default the Companion recovery flag to unused. The generic run profile already carries empty-safe traits, skills, individual bonuses, and relationship maps for future content. Safe movement/pathing continues to use existing pet actors and boundaries. No new pet or crew content was introduced.
- **Phase 6 generic framework complete:** roster capacity, generic profiles, all five duty assignments and controls, adoption/release, Retriever allowlists and cargo-capacity checks, safe movement, run-local duty work, and capped persistent proficiency are implemented. Social/relationship values remain data-only hooks; behavior and individual content can be added later without authoring models now. Player hands-on review remains the gameplay acceptance checkpoint.

### Phase 7 — Economy, beacon integration, and balance/content expansion

- Connect beacon risk/reward and named events to items, recipes, turret/crew/pet hooks, vista unlocks, and Captain's Log facts.
- Tune prices, salvage conversion, score overflow, research/milestone caps, turret DPS/accuracy, incident frequency, and passive chatter cadence from playtesting.
- Expand catalogs (crew lines, species, pets, items, events) data-first after the vertical slices work.

## Proposed first user review checkpoint

Phase 0 audit indicates Phase 1 can safely begin with only fields already available: score/outcome, stage reached, total/current claimed territory, balls contained/destroyed, pickups captured, timestamp, sector route atlas, and current route/event data. It would add the Captain's Log snapshot to each newly recorded top-five score and a score-row action to open the report. Existing records continue to show normally and have no fabricated details.

Before Phase 1 code changes, confirm:

1. Keep the existing top-five score limit and retain a report only for those five entries (recommended, simplest and consistent with current UI/storage).
2. Include the route map/visited beacon details in the first report only to the extent the current serialized route data contains them; defer unrecorded event prose to later event-ledger integration.
3. On a legacy score without a report, show “REPORT NOT AVAILABLE FOR THIS RUN” rather than trying to reconstruct it (recommended).



