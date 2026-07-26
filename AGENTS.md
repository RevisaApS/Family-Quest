<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Shipping changes

Finish the job without being asked: once the work is verified, commit, push,
open the PR, and merge it (squash). Steven doesn't want to ask for the PR
every time.

Verify before merging — `npx vitest run --exclude "tests/integration/**"`,
`npx tsc --noEmit`, and, for anything that changes what the family sees,
drive the real app with the `verify` skill. Say plainly what you could not
check (image generation needs a real `GOOGLE_AI_API_KEY`).
