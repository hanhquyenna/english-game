# Third-party assets

## Characters — Open Peeps
All avatars in Beeblast are [Open Peeps](https://www.openpeeps.com/) by
**Pablo Stanley**, released under **CC0 1.0** (public domain).

They are rendered through [`react-peeps`](https://github.com/CeamKrier/react-peeps)
by Emre Çakır, **MIT** licensed.

Every character in the app is drawn by a single shared component,
`src/components/student-avatar.tsx`, from a per-student seed stored in
`student_avatars.base_avatar_seed`.

## Item icons — `public/assets/items/`
| File | Source | Licence |
|---|---|---|
| `jester-hat.svg` | [game-icons.net](https://game-icons.net) | CC BY 3.0 |
| `gem.svg` | [game-icons.net](https://game-icons.net) | CC BY 3.0 |
| `study-cap.svg` | Authored for this project | — |
| `crown.svg` | Authored for this project | — |
| `medal.svg` | Authored for this project | — |
| `flame.svg` | Authored for this project | — |

The two game-icons.net icons were taken from the design prototype and are used
under CC BY 3.0, which requires attribution — hence this file. Their opaque
background rects were removed so they can be tinted and layered.

## Typeface
**Be Vietnam Pro** (Google Fonts, SIL Open Font License 1.1) — chosen over the
scaffold's default because it carries full Vietnamese diacritics.
