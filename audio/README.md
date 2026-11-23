# Word audio (ADR-024)

One `<LEVEL>/<word id>.m4a` per word in `data/words-own.json` (and `data/words.json`), in the folder of the word's CEFR level
(`A1`, `A2`, `B1`, `B2`): AAC-LC, mono, 32 kbps, the article plus the lemma spoken by the Piper voice `nl_NL-alex-medium`, with the
`free` padding of `afconvert` removed. Licence and provenance: `AUDIO-LICENCE.md`. Layout follows the T-310 criteria of the M2
plan (ADR-025), so each level can be published and downloaded on its own.

- `<LEVEL>/index.json`: `{ "level", "files": { "<word id>": { "text", "bytes", "sha256" } } }`, keys sorted.
- `index.json` (root): `{ "version": 1, "levels": { "A1": { "files", "bytes", "index_sha256", "version" }, ... } }`;
  `index_sha256` is the SHA-256 of the exact bytes of `<LEVEL>/index.json`; a level `version` starts at 1 and rises only when
  that level's index changes.
- `overrides.json`: `{ "<word id>": "respelled text" }` for a word that sounds wrong; the displayed word never changes.
  Regenerate only those ids after editing it.
- Caps per level, in decimal bytes (1 MB = 1,000,000 bytes; `AUDIO_CAPS_BYTES` in `scripts/validate-audio.ts`, checked by
  `npm run validate`): A1 3,000,000, A2 6,000,000, B1 7,000,000, B2 10,000,000 (ADR-028; B1's 1,164 words measure 4.9 MB, B2's
  1,575 longer words are expected near 7 to 7.5 MB; T-362 records the measured size, the cap is that plus 25%). A level without
  live words has no pack and no error; a live word without a file is an error. Validation also checks files, hashes, the root
  index, top-level `free` boxes and the licence file.

Regenerate (macOS, `piper-tts` 1.5 or higher in a venv, the model files with the SHA-256 values in `AUDIO-LICENCE.md`):

```
npm run generate-audio -- --out audio --model <dir>/nl_NL-alex-medium.onnx --bitrate 32000 --overrides audio/overrides.json
# one level: pass that level's live word ids, e.g. all B2 ids (the generator writes audio/B2/, its index.json and the root entry)
npm run generate-audio -- --ids noun-huis,verb-open --out audio --model <dir>/nl_NL-alex-medium.onnx --bitrate 32000 --overrides audio/overrides.json
```

If piper fails with `Error processing file '.../phontab'`, copy `espeak-ng-data` to a short path and set `ESPEAK_DATA_PATH`.
Each file is stripped of the `free` padding `afconvert` writes (about 3 KB) by `stripFree` in `scripts/audio-layout.ts`; the
chunk offsets are shifted and the decoded audio is identical.
`sizes.json` (per file and per level) is written by the run and git-ignored.
