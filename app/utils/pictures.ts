/**
 * The pictures behind the pages: one per kind of page and per mode. The
 * layout shows them, crossfaded on a mode or page change; the sky reads
 * the same table to know whose skyline it is drawing under.
 */
export const PICTURES = {
  home: { dark: "twin-moons", light: "moonlit-astronaut" },
  thoughts: { dark: "rocket-snowy-peaks", light: "retro-rocket" },
  inner: { dark: "galactic-mountains", light: "starlit-planets" },
} as const;

export type PictureKind = keyof typeof PICTURES;
export type PictureNames = (typeof PICTURES)[PictureKind];

/** Every picture is cut to this ratio and shown with `center / cover`. */
export const PICTURE_ASPECT = 1672 / 941;

export const pictureKind = (path: string): PictureKind =>
  path === "/" ? "home" : path === "/thoughts" || path === "/expeditions" ? "thoughts" : "inner";

export const picturesFor = (path: string): PictureNames => PICTURES[pictureKind(path)];
