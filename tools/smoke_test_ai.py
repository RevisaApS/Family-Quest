#!/usr/bin/env python3
"""Smoke-test the family-quest AI play loop end-to-end.

Hits the local dev server's AI endpoints in play order (scene -> actions ->
outcome) with a Danish 3-player family context and verifies each step returns
usable content. Run this after changing the Google AI API key, the model id,
or any prompt code.

Usage:
    1. Start the dev server:  cd family-quest && npm run dev
    2. python3 tools/smoke_test_ai.py [--base-url http://localhost:3000]

Exit code 0 = full loop works. Non-zero = something is broken; the script
prints which step failed and the server's error.
"""

import argparse
import json
import sys
import urllib.request

DANISH_MARKERS = ["og", "en", "det", "der", "til", "med", "æ", "ø", "å"]

CONTEXT = {
    "adventureStyle": "realistic",
    "storyHistory": [],
    "characters": [
        {"playerId": "p1", "playerName": "Twin A", "characterName": "Luna", "class": "wizard"},
        {"playerId": "p2", "playerName": "Twin B", "characterName": "Falk", "class": "ranger"},
        {"playerId": "p3", "playerName": "Far", "characterName": "Bjørn", "class": "warrior"},
    ],
    "currentPlayerId": "p1",
    "language": "da",
}


def post(base_url: str, path: str, payload: dict) -> dict:
    req = urllib.request.Request(
        base_url + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.load(resp)


def looks_danish(text: str) -> bool:
    lowered = f" {text.lower()} "
    return any(f" {w} " in lowered for w in DANISH_MARKERS[:6]) or any(
        ch in lowered for ch in DANISH_MARKERS[6:]
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:3000")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")

    print(f"Smoke-testing AI loop at {base} (language: da)\n")

    # 1. Scene
    try:
        scene = post(base, "/api/ai/scene", CONTEXT)
    except Exception as e:
        print(f"FAIL scene: {e}\n-> Check GOOGLE_AI_API_KEY in family-quest/.env.local and the model id in src/lib/ai/gemini.ts")
        return 1
    narration = scene.get("narration", "")
    if not narration:
        print(f"FAIL scene: empty narration. Raw: {json.dumps(scene)[:300]}")
        return 1
    print(f"scene OK: {narration}\n")
    if not looks_danish(narration):
        print("WARN: narration does not look Danish — check the language prompt.\n")

    # 2. Actions
    try:
        actions = post(base, "/api/ai/actions", {"context": CONTEXT, "currentScene": narration})
    except Exception as e:
        print(f"FAIL actions: {e}")
        return 1
    if not isinstance(actions, list) or len(actions) != 3:
        print(f"FAIL actions: expected 3 options, got: {json.dumps(actions)[:300]}")
        return 1
    for a in actions:
        words = len(a.get("text", "").split())
        note = "" if words <= 12 else f"  <- WARN: {words} words, should be short"
        print(f"action OK [{a.get('stat')}/{a.get('sceneFit')}]: {a.get('text')}{note}")
    print()

    # 3. Outcome
    try:
        outcome = post(base, "/api/ai/outcome", {
            "storyContext": CONTEXT,
            "actionChosen": actions[0]["text"],
            "stat": actions[0]["stat"],
            "outcome": "success",
            "currentScene": narration,
        })
    except Exception as e:
        print(f"FAIL outcome: {e}")
        return 1
    narrative = outcome.get("narrative", "")
    if not narrative:
        print(f"FAIL outcome: empty narrative. Raw: {json.dumps(outcome)[:300]}")
        return 1
    if narrative.strip().startswith(("{", "[", "```")):
        print(f"FAIL outcome: narrative looks like JSON/markdown, not prose: {narrative[:200]}")
        return 1
    print(f"outcome OK: {narrative}\n")

    print("ALL STEPS PASSED — the play loop works end-to-end.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
