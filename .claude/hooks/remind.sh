#!/usr/bin/env bash
# UserPromptSubmit hook — injects a reminder of this repo's mandatory workflow.
# Output goes to stdout and is shown to Claude as additional context for the turn.
# Keep it short — this runs on every prompt.

cat <<'EOF'
[DOPtracker workflow reminder]
1. Plan first → wait for explicit user approval (ExitPlanMode) before editing.
2. TDD: failing test → minimal impl → refactor. Verify the test fails for the right reason.
3. Root-cause fixes only — no quick patches, no silenced errors, no skipped tests.
4. Validate every boundary with Zod. No `any`. No mocked DB in backend integration tests.
See CLAUDE.md and .claude/skills/ for details.
EOF
