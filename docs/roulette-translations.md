# Roulette investigation translations

`roulette-translations.tsv` contains the new `key` and `en` columns for the translation workbook.

- Add `rooms.roulette.investigation.*` rows to the **Roulette** tab.
- Add `hints.room.rouletteInvestigation.*` rows to the **Hints** tab.
- Keep keys and interpolation placeholders (`{n}`, `{total}`, `{result}`) unchanged; translate the values.
- Import these rows before running `npm run i18n:import`, which regenerates the locale files from the workbook.

The old `rooms.roulette.wheels.*` and `hints.room.roulette.*` entries no longer drive this room. New strings fall back to English until translations are supplied.

Run `npm run check:i18n` after importing. Run `node scripts/roulette-check.mjs` to check forced outcomes, random slice selection and verdict/reason validation.
