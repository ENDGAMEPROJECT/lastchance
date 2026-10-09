# Roulette investigation translations

`roulette-translations.tsv` contains the new `key` and `en` columns for the translation workbook.

- Add `rooms.roulette.investigation.*` rows to the **Roulette** tab.
- Add `hints.room.rouletteInvestigation.*` rows to the **Hints** tab.
- Keep keys and interpolation placeholders (`{n}`, `{total}`, `{result}`) unchanged; translate the values.
- Import these rows before running `npm run i18n:import`, which regenerates the locale files from the workbook.

The old `rooms.roulette.wheels.*` and `hints.room.roulette.*` entries no longer drive this room. New strings fall back to English until translations are supplied.

Only two wheels are active: `w1` (50% coupon) and `w3` (prizes/no prize). Keep those IDs in the workbook. Rows under `rooms.roulette.investigation.wheels.w2.*` and `rooms.roulette.investigation.wheels.w4.*` can be removed; they no longer drive the game. Keep `verdicts.fair`: it remains an incorrect answer choice. The added SVG icons need no translation keys.

The cleared-room review now uses `rooms.roulette.investigation.solvedTitle` and `rooms.roulette.investigation.solvedText`, matching the live puzzle. `nodes.roulette-corridor.blurb` should describe two tempting wheels without claiming that both always win.

Run `npm run check:i18n` after importing. Run `node scripts/roulette-check.mjs` to check the two forced outcomes and verdict/reason validation.
