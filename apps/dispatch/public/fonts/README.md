# Self-hosted fonts

Brand fonts of the dispatcher panel (ADR 0013, decision D24): **Inter** for text, **Space Grotesk**
for headings. Both are licensed under the SIL Open Font License 1.1 (`LICENSE-Inter.txt`,
`LICENSE-SpaceGrotesk.txt`). The `@font-face` rules live in `src/app/globals.css`.

| File                            | Family            | Subset       | Weights | Source (downloaded 2026-10-15)                               |
| ------------------------------- | ----------------- | ------------ | ------- | ------------------------------------------------------------ |
| `inter-latin.woff2`             | Inter v20         | latin        | 400–700 | Google Fonts CSS API, `fonts.gstatic.com/s/inter/v20`        |
| `inter-latin-ext.woff2`         | Inter v20         | latin-ext    | 400–700 | same                                                         |
| `inter-cyrillic.woff2`          | Inter v20         | cyrillic     | 400–700 | same                                                         |
| `inter-cyrillic-ext.woff2`      | Inter v20         | cyrillic-ext | 400–700 | same                                                         |
| `space-grotesk-latin.woff2`     | Space Grotesk v22 | latin        | 500–700 | Google Fonts CSS API, `fonts.gstatic.com/s/spacegrotesk/v22` |
| `space-grotesk-latin-ext.woff2` | Space Grotesk v22 | latin-ext    | 500–700 | same                                                         |

Request used: `https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Space+Grotesk:wght@500..700&display=swap`
(the `unicode-range` of each subset was copied from that response). Greek and Vietnamese subsets
were left out; Space Grotesk ships no Cyrillic, so Russian headings fall back to Inter.

Glyph check (cmap parsed from the files on 2026-10-15): Inter contains Ə ə Ğ ğ İ ı Ö ö Ş ş Ü ü Ç ç,
₼, ³, – and Cyrillic; Space Grotesk contains the same Latin set and ₼ but no Cyrillic.

To refresh: download the files again from the same request with a desktop browser user agent,
keep the names above, update this table and the `unicode-range` values if Google changed them.
