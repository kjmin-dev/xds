// Reads the pixels of the PNG files the checks compare: 8-bit RGB or RGBA without interlacing,
// which is what Skia writes on the desktop and `screencap` on Android.

import { inflateSync } from "node:zlib";

export type Image = { width: number; height: number; channels: number; pixels: Buffer };

export function decodePng(file: Buffer): Image {
  if (!file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error("not a PNG file");
  }
  let width = 0;
  let height = 0;
  let channels = 0;
  const data: Buffer[] = [];
  for (let offset = 8; offset < file.length;) {
    const length = file.readUInt32BE(offset);
    const type = file.toString("latin1", offset + 4, offset + 8);
    const body = file.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const [depth, color, , , interlace] = [body[8], body[9], body[10], body[11], body[12]];
      channels = color === 6 ? 4 : color === 2 ? 3 : 0;
      if (depth !== 8 || channels === 0 || interlace !== 0) {
        throw new Error(`a PNG this check does not read: depth ${depth}, color type ${color}`);
      }
    } else if (type === "IDAT") {
      data.push(body);
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row++) {
    const filter = raw[row * (stride + 1)];
    const line = raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1));
    const out = pixels.subarray(row * stride, (row + 1) * stride);
    const above =
      row > 0 ? pixels.subarray((row - 1) * stride, row * stride) : Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? (out[i - channels] ?? 0) : 0;
      const up = above[i] ?? 0;
      const corner = i >= channels ? (above[i - channels] ?? 0) : 0;
      const value = line[i] ?? 0;
      switch (filter) {
        case 0:
          out[i] = value;
          break;
        case 1:
          out[i] = value + left;
          break;
        case 2:
          out[i] = value + up;
          break;
        case 3:
          out[i] = value + ((left + up) >> 1);
          break;
        case 4: {
          const estimate = left + up - corner;
          const [a, b, c] = [
            Math.abs(estimate - left),
            Math.abs(estimate - up),
            Math.abs(estimate - corner),
          ];
          out[i] = value + (a <= b && a <= c ? left : b <= c ? up : corner);
          break;
        }
        default:
          throw new Error(`a PNG row with filter ${filter}`);
      }
    }
  }
  return { width, height, channels, pixels };
}

/** Whether every pixel is the same color: a screen that has not drawn anything yet. */
export function isBlank(image: Image): boolean {
  const first = image.pixels.subarray(0, image.channels);
  for (let i = image.channels; i < image.pixels.length; i += image.channels) {
    if (!image.pixels.subarray(i, i + image.channels).equals(first)) return false;
  }
  return true;
}

/** How many pixels differ between two pictures, or undefined when their sizes differ. */
export function differingPixels(a: Image, b: Image): number | undefined {
  if (a.width !== b.width || a.height !== b.height || a.channels !== b.channels) return undefined;
  let count = 0;
  for (let i = 0; i < a.pixels.length; i += a.channels) {
    if (!a.pixels.subarray(i, i + a.channels).equals(b.pixels.subarray(i, i + b.channels))) count++;
  }
  return count;
}
