# Roulette investigation translations

`roulette-translations.tsv` contains the new `key` and `en` columns for the translation workbook.

- Add `rooms.roulette.investigation.*` rows to the **Roulette** tab.
- Add `hints.room.rouletteInvestigation.*` rows to the **Hints** tab.
- Keep keys and interpolation placeholders (`{n}`, `{total}`, `{result}`) unchanged; translate the values.
- Import these rows before running `npm run i18n:import`, which regenerates the locale files from the workbook.

The old `rooms.roulette.wheels.*` and `hints.room.roulette.*` entries no longer drive this room. New strings fall back to English until translations are supplied.

Only two wheels are active: `w1` (50% coupon) and `w3` (prizes/no prize). Keep those IDs in the workbook. Rows under `rooms.roulette.investigation.wheels.w2.*` and `rooms.roulette.investigation.wheels.w4.*` can be removed; they no longer drive the game. Keep `verdicts.fair`: it remains an incorrect answer choice. The added SVG icons need no translation keys.

The player now chooses only Rigged or Not rigged. A correct verdict immediately reveals the lesson and the next button. There are no reason choices or minimum-purchase instructions. `nodes.roulette-corridor.blurb` and `rooms.roulette.investigation.intro` should describe this simpler task.

The two lesson texts are edited in the workbook, using existing keys: `rooms.roulette.investigation.wheels.w1.feedback` explains gamification, and `rooms.roulette.investigation.wheels.w3.feedback` explains the lucky feeling and the spending hook. The cleared-room review repeats these same two texts. No new keys are required. Keep `solvedText` as a short completion message, rather than a third lesson.

The workbook can drop `rooms.roulette.investigation.reasonLabel`, all `rooms.roulette.investigation.wheels.w1.options.*` and `rooms.roulette.investigation.wheels.w3.options.*` rows, and `rooms.roulette.investigation.shop.terms` / `shop.reminder`. Update `retry` to a brief retry instruction, `correct` to a simple correct-verdict message, and `hints.room.rouletteInvestigation.items.2` to remove the instruction to choose a reason.

Run `npm run check:i18n` after importing. Run `node scripts/roulette-check.mjs` to check the two forced outcomes and binary verdict validation.
