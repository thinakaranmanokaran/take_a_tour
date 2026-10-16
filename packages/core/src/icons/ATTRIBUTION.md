# Icon attribution

The SVG path data in `src/icons/index.js` is derived from **Lucide**
(https://lucide.dev), which is licensed under the **ISC License**.

Only the five icons the library actually renders are included:

| Icon           | Lucide source                                    |
| -------------- | ------------------------------------------------ |
| `chevron-left` | `chevron-left`                                   |
| `chevron-right`| `chevron-right`                                  |
| `close`        | `x`                                              |
| `check`        | `check`                                          |
| `check-circle` | `circle-check-big`                               |
| `sparkle`      | `sparkles`                                       |

No icon is fetched at runtime and no icon package is a dependency of
`@take-a-tour/core`. Consumers who prefer different artwork can replace icons
through the documented `classes` and render hooks, or by supplying their own
button content.

Lucide's ISC License:

```
ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```