# Word audio: licence and provenance (ADR-024)

Every `*.m4a` file in this folder is the spoken form of one Dutch word (the article plus the lemma, for example "de tandarts").
The files are **computer-generated**: generated once by LinguaGrid with a text-to-speech program, on a developer's Mac, from
the text in `index.json`. No human recording is shipped and no file is a recording of a person.

This folder is separate from the data files in `data/`, which are CC BY-NC-SA and CC BY-SA (ADR-009; see `LICENSE-DATA.md`). The
licence of the audio is the chain below, and the data licences do not apply to it.

## Voice

- Voice: Piper `nl_NL-alex-medium` (Dutch, Netherlands, one speaker, medium quality, 22,050 Hz), from
  https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_NL/alex/medium
- Licence: **CC0** (the voice's model card, read and copied below; its training data is CC0).
- Files used (SHA-256, checked before generation):

| File | SHA-256 |
|---|---|
| `nl_NL-alex-medium.onnx` | `758fa64ec461545972fc3e509511b48849c6f3f5c821ad55c71d9741d4352bdc` |
| `nl_NL-alex-medium.onnx.json` | `886f7c17c6bf4e81818c76d349cbaa447f5f87e06e7c60f714bd37612c11bc3c` |
| `MODEL_CARD` | `07138cae7ed81849738f51254f648438f2f3e00bf3133d3b3024de2d04140bdb` |

The model hash is also stored in `index.json` (`modelSha256`).

Model card of `alex`, accessed 2026-11-14 and verified byte for byte against the hash above on 2026-11-15:

```
# Model card for alex (medium)

* Language: nl_NL (Dutch, Netherlands)
* Speakers: 1
* Quality: medium
* Samplerate: 22,050Hz

## Dataset

* URL: https://github.com/OHF-Voice/voice-datasets
* License: CC0

## Training

Finetuned from the rdh base model (medium quality; nl_BE, one Flemish speaker, CC0), with MRD and SDP.

Default inference settings are noise_scale 0.5 and noise_w 0.333.

Requires Piper 1.5 or higher.
```

## Upstream chain (all CC0)

- `alex` is finetuned from `rdh`. Model card of `rdh` (nl_BE, one Flemish speaker), accessed 2026-11-15
  (https://huggingface.co/rhasspy/piper-voices/raw/main/nl/nl_BE/rdh/medium/MODEL_CARD): dataset
  https://github.com/r-dh/dutch-vl-tts, "License: CC0 1.0 Universal", "Trained from scratch". The `rdh` `.onnx` has SHA-256
  `59fcf2d6037e1c12386e3d2cf6721c727f286cfeec9db5617407d3bfb4c32559` (for reference; it is not used here).
- Dataset of `alex`: OHF-Voice/voice-datasets (https://github.com/OHF-Voice/voice-datasets), "licensed under CC0 (public
  domain)". Its README asks users to cite the repository (a request, not a CC0 condition): *OHF-Voice voice-datasets*,
  Open Home Foundation / Nabu Casa, https://github.com/OHF-Voice/voice-datasets, `nl_NL/alex`.
- The speakers' identity and consent text are not stated in the repositories that were read (research brief
  `2026-11-16-piper-alex-licence.md`, in the LinguaGrid app repository). CC0 is the stated basis.
- Piper states that it makes no licence grant of its own over voice models and adds no restriction of its own.

## Engine

Generated with `piper-tts` 1.5.0 (https://github.com/OHF-Voice/piper1-gpl, GPL-3.0-or-later), then trimmed and normalised by
`scripts/audio.ts` and encoded to AAC (32 kbps, mono, `.m4a`) with macOS `afconvert`, and the `free` padding box is removed. The engine is a build tool only: it is not
part of any app and is not shipped. Under GPLv3 section 2 the output of a program is covered by the licence only if the output is
itself a covered work; spoken-word audio is not, so the engine's licence puts no condition on these files. (This is our reading,
not legal advice.)

## Statement

Word audio generated once by LinguaGrid; computer-generated (Piper, voice alex, CC0). No attribution is required by CC0; the
disclosure is given in the app's About & sources screen.
