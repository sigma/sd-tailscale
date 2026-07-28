import streamDeck from "@elgato/streamdeck";

import { renderButtonImage } from "./button-image.js";

/**
 * {@link renderButtonImage} guarded for the repaint path shared by all three
 * actions. A render failure — e.g. a missing base PNG, which would be a
 * packaging bug — is logged and skipped (returns `undefined`, so the caller
 * leaves the manifest image in place) rather than thrown out of the poll
 * listener that drives every button's repaint.
 */
export function renderButtonImageSafe(stem: string, name: string): string | undefined {
  try {
    return renderButtonImage(stem, name);
  } catch (err) {
    streamDeck.logger.error(`render ${stem} image failed: ${(err as Error).message}`);
    return undefined;
  }
}
