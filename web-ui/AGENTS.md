## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Commits and Pushing Changes

- Do not create Git commits without my explicit request.
- Do not run git push or send changes to GitHub or other remote repositories without my separate explicit request.
- Permission to modify files or create a commit does not imply permission to push.
- When creating commits, follow the project's commit message conventions. Do not add AI attribution, model signatures,
  or Co-authored-by trailers identifying AI assistants.
- When I ask you to commit, first show me the complete proposed commit message and wait for my explicit confirmation.
  Create the commit only after I approve that message; the initial request to commit does not count as approval of the
  message.

--- 

## 6.Quick Frontend Rules (`web-ui`):

1. **Russian UI**: All user-facing text strictly in Russian (`ru-RU`).
2. **Icons**: Use only `lucide-react` SVG icons. Never use emojis.
3. **Design System**: Use classes from `src/styles/chiron.css` (`.island`, `.card`, `.btn`, `.badge`, `.seg`,
   `.popover`, `.dialog`, `.ab-hero`, `.ab-facts`, `.ab-grid`, `.ab-steps`).
4. **Doctor Names**: Always call `getDoctorDisplay(vet, specsMap)` from `src/utils/doctorHelpers.ts` to display
   veterinarians.
5. **Timezone**: Clinic timezone is `Europe/Moscow`.
6. **Available Slots**: Never generate hardcoded slot arrays for booking. Always fetch via
   `clinicApi.findAvailableSlots({ speciesId, serviceId, veterinarianId, from, to })`.
7. **Verification**: Run `.\node_modules\.bin\tsc.cmd --noEmit` and `npm.cmd run build` before completing tasks.
