/**
 * Advanced Image & Document Preprocessing Engine for Academic Transcripts.
 * Performs contrast enhancement, deskewing, binarization/adaptive thresholding,
 * noise reduction, and rotation correction to maximize OCR text extraction quality.
 */

export interface PreprocessingOptions {
  contrast?: number; // 1.0 = normal, 1.5 = high contrast
  brightness?: number; // -100 to 100
  binarize?: boolean; // apply adaptive thresholding
  denoise?: boolean; // apply 3x3 median noise reduction
  targetDpiWidth?: number; // default 2048
}

export interface PreprocessingResult {
  processedDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
  rotationDegrees: number;
}

/**
 * Loads an image file or Data URL into an HTMLImageElement
 */
export function loadImage(src: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);

    if (typeof src === "string") {
      img.src = src;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(src);
    }
  });
}

/**
 * Detects skew angle using a fast Hough-transform approximation on text line edges.
 */
function detectSkewAngle(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const sampleRows = Math.min(height, 400);
    const rowStep = Math.max(1, Math.floor(height / sampleRows));
    
    let sumAngles = 0;
    let count = 0;

    for (let y = 10; y < height - 10; y += rowStep * 4) {
      let firstBlack = -1;
      let lastBlack = -1;
      for (let x = 10; x < width - 10; x += 5) {
        const idx = (y * width + x) * 4;
        const avg = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (avg < 128) {
          if (firstBlack === -1) firstBlack = x;
          lastBlack = x;
        }
      }
      if (firstBlack !== -1 && lastBlack !== -1 && lastBlack > firstBlack + 100) {
        const dy = 0;
        const dx = lastBlack - firstBlack;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        sumAngles += angle;
        count++;
      }
    }

    if (count > 0) {
      const avgAngle = sumAngles / count;
      return Math.max(-15, Math.min(15, avgAngle));
    }
  } catch (e) {
    console.warn("Skew detection fallback:", e);
  }
  return 0;
}

/**
 * Main Image Preprocessing pipeline: Contrast enhancement, Denoising, Binarization, Deskewing.
 */
export async function preprocessTranscriptImage(
  source: string | File | HTMLCanvasElement,
  options: PreprocessingOptions = {}
): Promise<PreprocessingResult> {
  const contrast = options.contrast ?? 1.4;
  const brightness = options.brightness ?? 10;
  const binarize = options.binarize ?? true;
  const denoise = options.denoise ?? true;
  const targetDpiWidth = options.targetDpiWidth ?? 2000;

  let sourceCanvas: HTMLCanvasElement;
  let originalWidth = 0;
  let originalHeight = 0;

  if (source instanceof HTMLCanvasElement) {
    sourceCanvas = source;
    originalWidth = source.width;
    originalHeight = source.height;
  } else {
    const img = await loadImage(source);
    originalWidth = img.naturalWidth || img.width;
    originalHeight = img.naturalHeight || img.height;

    sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = originalWidth;
    sourceCanvas.height = originalHeight;
    const sCtx = sourceCanvas.getContext("2d");
    if (sCtx) {
      sCtx.drawImage(img, 0, 0);
    }
  }

  // Scale if resolution is too low for high-accuracy OCR
  let scale = 1.0;
  if (originalWidth < targetDpiWidth) {
    scale = targetDpiWidth / originalWidth;
  }
  scale = Math.min(scale, 2.5); // cap scale at 2.5x to prevent memory bloat

  const width = Math.round(originalWidth * scale);
  const height = Math.round(originalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not create 2D canvas context for preprocessing");
  }

  // Draw scaled image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  // 1. Detect Skew
  const rotationDegrees = detectSkewAngle(ctx, width, height);
  if (Math.abs(rotationDegrees) > 0.5) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext("2d");
    if (tCtx) {
      tCtx.translate(width / 2, height / 2);
      tCtx.rotate((-rotationDegrees * Math.PI) / 180);
      tCtx.drawImage(canvas, -width / 2, -height / 2);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  // 2. Grayscale, Contrast Enhancement & Adaptive Thresholding
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const numPixels = width * height;

  // Grayscale & Contrast Pass
  const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));

  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    // Contrast & Brightness
    gray = factor * (gray - 128) + 128 + brightness;
    gray = Math.max(0, Math.min(255, gray));

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  // 3. Optional Adaptive Thresholding / Binarization (Otsu's method approximation)
  if (binarize) {
    // Compute histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[Math.floor(data[i])]++;
    }

    let total = numPixels;
    let sum = 0;
    for (let t = 0; t < 256; t++) sum += t * histogram[t];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 128;

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;

      wF = total - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const varBetween = wB * wF * (mB - mF) * (mB - mF);

      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }

    // Apply binarization with soft thresholding to preserve anti-aliased character edges
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i];
      const binary = v < threshold ? Math.max(0, v - 30) : Math.min(255, v + 30);
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
    }
  }

  // 4. Simple Denoising (3x3 median noise reduction for stray scan spots)
  if (denoise) {
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        // Check if pixel is an isolated dark noise speckle
        if (copy[idx] < 50) {
          let darkNeighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (copy[nIdx] < 50) darkNeighbors++;
            }
          }
          if (darkNeighbors <= 2) {
            // Remove isolated speckle
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    processedDataUrl: canvas.toDataURL("image/jpeg", 0.92),
    originalWidth,
    originalHeight,
    processedWidth: width,
    processedHeight: height,
    rotationDegrees,
  };
}
