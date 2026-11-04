# pixelfx attribution

`collect-burst.ts` adapts the star movement, drag, short trails, expanding ring and
twinkle timing from [pixelfx pickups/collect-burst.js](https://github.com/patch-gg/pixelfx/blob/main/src/fx/pickups/collect-burst.js),
Copyright (c) 2026 Patch, MIT License. Retrieved on 2026-11-04.

That upstream effect follows the pop from [Sprite Fusion's pickup effect](https://www.spritefusion.com/pixel-art-vfx/pickup),
Copyright (c) 2026 Hugo Duprez, MIT License.

Changes for SIFCAS: typed standalone Canvas 2D renderer, cool Aero palette,
deterministic local random source, removal of the light buffer, initial flash,
floor bounce and secondary motes. No upstream runtime, assets or fonts are bundled.
The React wrapper stops after 1.35 seconds, respects reduced motion and the
animation preference, and cancels on tab hiding or unmount.

The upstream gallery's Patch Pixel font is excluded from the upstream MIT license
and is **not included** in SIFCAS.
