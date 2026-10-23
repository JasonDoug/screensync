import { PrivacyMask } from '../types';

/**
 * Captures a single JPEG base64 frame from an HTMLVideoElement.
 * Automatically respects privacy masks by redacting those zones.
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  privacyMasks: PrivacyMask[] = [],
  quality = 0.82
): string | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const canvas = document.createElement('canvas');
  // Scale down slightly if video is 4K to optimize throughput while keeping crisp text
  const maxDim = 1920;
  let width = video.videoWidth;
  let height = video.videoHeight;

  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, width, height);

  // Apply privacy masks (redaction boxes)
  if (privacyMasks.length > 0) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    for (const mask of privacyMasks) {
      const rx = (mask.x / 100) * width;
      const ry = (mask.y / 100) * height;
      const rw = (mask.width / 100) * width;
      const rh = (mask.height / 100) * height;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText('[REDACTED AREA]', rx + 8, ry + 20);
      ctx.fillStyle = '#0f172a';
    }
  }

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Captures an HTML element (e.g. mock desktop scenario) into a base64 image
 * using an SVG foreignObject or HTML5 Canvas technique.
 */
export async function captureDomElement(
  element: HTMLElement,
  privacyMasks: PrivacyMask[] = []
): Promise<string | null> {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const width = Math.max(800, Math.round(rect.width));
  const height = Math.max(600, Math.round(rect.height));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Render a clean representation using SVG foreignObject
  const cloned = element.cloneNode(true) as HTMLElement;
  cloned.style.transform = 'none';
  cloned.style.margin = '0';
  cloned.style.width = `${width}px`;
  cloned.style.height = `${height}px`;

  // Inline basic styling
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;font-family:sans-serif;">
          ${cloned.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      // Redaction masks
      if (privacyMasks.length > 0) {
        ctx.fillStyle = '#0f172a';
        for (const mask of privacyMasks) {
          const rx = (mask.x / 100) * width;
          const ry = (mask.y / 100) * height;
          const rw = (mask.width / 100) * width;
          const rh = (mask.height / 100) * height;
          ctx.fillRect(rx, ry, rw, rh);
        }
      }

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: draw basic diagnostic canvas representation
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('Screen Capture: Mock Scenario View', 40, 50);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.src = url;
  });
}
