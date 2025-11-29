// From your anchors:
// Red  (-64,140) at px≈52, py≈56
// Green( 64,140) at px≈1147, py≈59
// Blue (  0,140) at px≈596, py≈52
// Yellow(  0,  4) at px≈601, py≈1220

export function pixelToBoard(px, py) {
  const x = -64 + (px - 52) * (128 / 1095);
  const y = 140 - (py - 52) * (136 / 1168);
  return { x, y };
}

// Useful inverse (board -> pixel) for drawing markers:
export function boardToPixel(x, y) {
  const px = 52 + ((x + 64) * 1095) / 128;
  const py = 52 + ((140 - y) * 1168) / 136;
  return { px, py };
}
