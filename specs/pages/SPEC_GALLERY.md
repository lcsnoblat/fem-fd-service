# SPEC_GALLERY.md — Mission Control: Gallery Module

**Version:** 1.0.0
**Status:** Ready for Implementation
**Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, tRPC, Prisma, Zustand, TanStack Query, Framer Motion, Vercel AI SDK, Cloudflare R2, Sharp

---

## 1. Overview

The Gallery module is a personal media hub within Mission Control that enables users to upload, organize, view, and semantically analyze their photos. Built for performance and delight, it features a responsive masonry grid with blur-hash placeholders, a full-screen lightbox viewer with keyboard navigation and pinch-to-zoom, client-side image compression before upload, server-side thumbnail generation via Sharp, and AI-powered auto-tagging plus semantic search. Storage is backed by Cloudflare R2 with a pre-signed URL upload flow to keep server costs low.

### Core Capabilities
- Multi-file drag-and-drop upload with progress tracking
- Client-side compression (browser-image-compression) before upload
- Server-side thumbnail generation at 400×400 (Sharp), blur-hash generation
- Storage in Cloudflare R2, metadata in PostgreSQL via Prisma
- Masonry grid with lazy loading, selection mode, and bulk actions
- Full-screen lightbox: keyboard nav, zoom, EXIF, AI description, edit tools
- AI auto-tagging (scene, objects, activities) and semantic search
- Album management via sidebar

---

## 2. User Stories

1. **As a user**, I want to drag and drop a batch of photos into the gallery so that I can quickly upload memories without clicking through file pickers multiple times.

2. **As a user**, I want thumbnails to display instantly with a blurred placeholder while the full image loads so that the gallery feels fast even on slower connections.

3. **As a user**, I want to organize photos into named albums with a cover image so that I can keep life events (vacations, projects, family moments) logically separated.

4. **As a user**, I want to click a photo and view it full-screen with keyboard arrow navigation so that I can browse through an album in sequence without returning to the grid.

5. **As a user**, I want the AI to automatically generate descriptive tags for each photo so that I can later search for "sunset" or "birthday cake" without manually tagging hundreds of images.

6. **As a user**, I want to select multiple photos with shift-click and bulk-move them to an album or delete them so that I can manage large imports efficiently.

---

## 3. UI Layout

### 3.1 Full-Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ MISSION CONTROL                                              [User Avatar] [⚙️]  │
├──────────┬───────────────────────────┬───────────────────────────────────────────┤
│ NAV      │ ALBUMS SIDEBAR            │ MAIN CONTENT AREA                        │
│          │                           │                                           │
│ Dashboard│ [+ New Album]             │ TOOLBAR                                  │
│ Calendar │ ──────────────────────    │ [Search by tag, desc...] [Filter ▼] [⊞⊟]│
│ Gallery  │ ● All Photos (1,204)      │ [Select All] [Upload] [+ New Album]      │
│ Smart    │ ● Uncategorized (43)      │ ──────────────────────────────────────── │
│ Home     │                           │                                           │
│ Reminders│ MY ALBUMS                 │ MASONRY GRID                             │
│ Settings │ ┌──────┐ ┌──────┐         │ ┌────┐ ┌──────────┐ ┌─────┐            │
│          │ │ ▓▓▓▓ │ │ ▓▓▓▓ │         │ │    │ │          │ │     │            │
│          │ │ Trip │ │ Work │         │ │    │ │          │ │     │            │
│          │ │  45  │ │  12  │         │ └────┘ │          │ └─────┘            │
│          │ └──────┘ └──────┘         │ ┌──────┐└──────────┘ ┌────┐            │
│          │                           │ │      │ ┌──────┐    │    │            │
│          │ ┌──────┐ ┌──────┐         │ │      │ │      │    │    │            │
│          │ │ ▓▓▓▓ │ │  +   │         │ └──────┘ └──────┘    └────┘            │
│          │ │ Fam  │ │ New  │         │ ┌────┐ ┌────┐ ┌──────────┐             │
│          │ │  89  │ │      │         │ │    │ │    │ │          │             │
│          │ └──────┘ └──────┘         │ └────┘ └────┘ └──────────┘             │
│          │                           │                                          │
│          │ ─────────────────────     │ SELECTION BAR (shown when ≥1 selected)  │
│          │ TAGS                      │ ┌────────────────────────────────────── │
│          │ sunset (23)               │ │ 3 selected [Move ▼] [Tag] [Delete]    │
│          │ birthday (7)              │ └────────────────────────────────────── │
│          │ travel (156)              │                                          │
│          │ [+ Add filter]            │                   [Load more ↓]         │
└──────────┴───────────────────────────┴───────────────────────────────────────────┘
```

### 3.2 Image Lightbox Viewer

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [✕ Close]          IMG_4823.jpg          [↓ Download] [✏ Edit] [⋮ More]        │
├────────────────────────────────────────────────────────┬────────────────────────┤
│                                                        │ INFO PANEL             │
│                                                        │                        │
│                                                        │ FILENAME               │
│                                                        │ IMG_4823.jpg           │
│            ◀                                    ▶      │ 3.2 MB · JPEG          │
│                                                        │ 4032 × 3024 px         │
│        [FULL RESOLUTION IMAGE                ]         │                        │
│        [   (with zoom support)               ]         │ UPLOADED               │
│                                                        │ May 18, 2026 · 2:41 PM │
│                                                        │                        │
│                                                        │ EXIF                   │
│                                                        │ Camera: iPhone 15 Pro  │
│                                                        │ ISO: 64 · f/1.78       │
│                                                        │ Shutter: 1/2000s       │
│                                                        │ Location: Paris, FR    │
│                                                        │                        │
│                                                        │ AI DESCRIPTION         │
│                                                        │ "Eiffel Tower at       │
│                                                        │ sunset with warm       │
│                                                        │ orange sky and         │
│                                                        │ silhouetted tourists"  │
│                                                        │                        │
│                                                        │ TAGS                   │
│                                                        │ [travel] [sunset]      │
│                                                        │ [paris] [landmark]     │
│                                                        │ [+ Add tag]            │
│                                                        │                        │
│  23 / 89 in "Europe 2026"                             │ [✨ Re-analyze]         │
└────────────────────────────────────────────────────────┴────────────────────────┘
```

### 3.3 Upload Zone (Active State)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                   ┌─────────────────────┐                   │
│                   │                     │                   │
│                   │    ↑  Drop photos   │                   │
│                   │    anywhere here    │                   │
│                   │                     │                   │
│                   │  or [Browse files]  │                   │
│                   │                     │                   │
│                   │  PNG, JPG, HEIC,    │                   │
│                   │  WEBP · Max 20MB    │                   │
│                   └─────────────────────┘                   │
│                                                              │
│  UPLOADING (3 of 7)                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ IMG_001.jpg  [████████████░░░░░░░░░░░░]  58%  2.3MB   │ │
│  │ IMG_002.jpg  [████████████████████████]  ✓ Done        │ │
│  │ IMG_003.jpg  [██░░░░░░░░░░░░░░░░░░░░░░]  12%  ...     │ │
│  │ IMG_004.jpg  Waiting...                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Data Model

### 4.1 Prisma Schema

```prisma
model Album {
  id           String   @id @default(cuid())
  userId       String
  name         String
  description  String?
  coverImageId String?
  isPublic     Boolean  @default(false)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  images     Image[]
  coverImage Image?  @relation("AlbumCover", fields: [coverImageId], references: [id])

  @@index([userId])
}

model Image {
  id             String    @id @default(cuid())
  userId         String
  albumId        String?
  filename       String
  originalKey    String    // R2 object key for original
  url            String    // R2 public URL (original)
  thumbnailKey   String?   // R2 object key for 400x400 thumbnail
  thumbnailUrl   String?
  blurHash       String?   // Blurhash placeholder string
  width          Int
  height         Int
  size           Int       // bytes
  mimeType       String
  aiTags         String[]  @default([])
  aiDescription  String?
  aiAnalyzedAt   DateTime?
  exifData       Json?     // Raw EXIF from exifr
  takenAt        DateTime? // From EXIF DateTimeOriginal
  uploadedAt     DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  album      Album?     @relation(fields: [albumId], references: [id])
  albumCovers Album[]   @relation("AlbumCover")
  tags       ImageTag[]

  @@index([userId, albumId])
  @@index([userId, uploadedAt])
  @@index([userId, aiAnalyzedAt])
}

model ImageTag {
  id         String    @id @default(cuid())
  imageId    String
  tag        String
  confidence Float?    // 0.0 - 1.0, null for manual tags
  source     TagSource

  image      Image     @relation(fields: [imageId], references: [id], onDelete: Cascade)

  @@unique([imageId, tag])
  @@index([tag])
  @@index([imageId])
}

enum TagSource {
  ai
  manual
}
```

### 4.2 TypeScript Types

```typescript
// types/gallery.ts

export interface GalleryAlbum {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  coverImage: GalleryImage | null;
  isPublic: boolean;
  imageCount: number;
  createdAt: Date;
}

export interface GalleryImage {
  id: string;
  userId: string;
  albumId: string | null;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  blurHash: string | null;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  aiTags: string[];
  aiDescription: string | null;
  aiAnalyzedAt: Date | null;
  exifData: ExifData | null;
  takenAt: Date | null;
  uploadedAt: Date;
  tags: ImageTagRecord[];
  // UI computed
  aspectRatio: number; // width / height
}

export interface ImageTagRecord {
  id: string;
  tag: string;
  confidence: number | null;
  source: "ai" | "manual";
}

export interface ExifData {
  make?: string;         // Camera make
  model?: string;        // Camera model
  iso?: number;
  fNumber?: number;
  exposureTime?: string; // e.g. "1/2000"
  focalLength?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  locationName?: string; // reverse-geocoded
}

export interface UploadQueueItem {
  id: string;            // local UUID
  file: File;
  status: "pending" | "compressing" | "uploading" | "processing" | "done" | "error";
  progress: number;      // 0-100
  error?: string;
  imageId?: string;      // set on completion
  compressedSize?: number;
  originalSize: number;
}

export interface ImageFilters {
  albumId?: string | "uncategorized";
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  search?: string;
  mimeTypes?: string[];
  minSize?: number;
  maxSize?: number;
  aspectRatio?: "portrait" | "landscape" | "square";
  sortBy?: "uploadedAt" | "takenAt" | "size" | "filename";
  sortOrder?: "asc" | "desc";
}

export type SelectionMode = "none" | "selecting";

export interface GallerySelection {
  selectedIds: Set<string>;
  lastClickedId: string | null;
  mode: SelectionMode;
}
```

---

## 5. Upload System

### 5.1 Client-Side Flow

```typescript
// hooks/useImageUpload.ts

async function processAndUploadFile(file: File): Promise<string> {
  // Step 1: Client-side compression
  const compressed = await imageCompression(file, {
    maxSizeMB: 4,          // compress to max 4MB
    maxWidthOrHeight: 4096, // preserve high-res but cap huge files
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.85,
  });

  // Step 2: Get pre-signed upload URL from server
  const { uploadUrl, imageId, key } = await trpc.gallery.getUploadUrl.mutate({
    filename: file.name,
    mimeType: compressed.type,
    size: compressed.size,
  });

  // Step 3: Upload directly to R2
  await uploadToR2(uploadUrl, compressed, (progress) => {
    updateQueueItem(file.name, { progress, status: "uploading" });
  });

  // Step 4: Notify server to process (thumbnail + blurHash)
  await trpc.gallery.finalizeUpload.mutate({ imageId, key });

  return imageId;
}

async function uploadToR2(
  url: string,
  file: File | Blob,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () =>
      xhr.status < 400 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
    );
    xhr.addEventListener("error", reject);
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
```

### 5.2 Server-Side Processing

```typescript
// server/lib/image-processing.ts
import sharp from "sharp";
import { encode } from "blurhash";
import { fromBuffer } from "exifr";

export async function processUploadedImage(
  key: string,
  originalBuffer: Buffer
): Promise<ProcessedImageMetadata> {
  // 1. Parse EXIF data
  const exif = await fromBuffer(originalBuffer, {
    tiff: true,
    exif: true,
    gps: true,
    ifd1: false,
  });

  // 2. Get original dimensions
  const sharpInstance = sharp(originalBuffer);
  const metadata = await sharpInstance.metadata();

  // 3. Generate thumbnail (400x400, cover, WebP)
  const thumbnailBuffer = await sharpInstance
    .resize(400, 400, { fit: "cover", position: "attention" }) // smart cropping
    .webp({ quality: 80 })
    .toBuffer();

  // 4. Generate blur hash (32x32 version for performance)
  const blurHashBuffer = await sharp(originalBuffer)
    .resize(32, 32, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blurHash = encode(
    new Uint8ClampedArray(blurHashBuffer.data),
    blurHashBuffer.info.width,
    blurHashBuffer.info.height,
    4, // componentX
    3  // componentY
  );

  // 5. Upload thumbnail to R2
  const thumbnailKey = key.replace(/(\.[^.]+)$/, "-thumb.webp");
  await r2.put(thumbnailKey, thumbnailBuffer, {
    httpMetadata: { contentType: "image/webp" },
  });

  return {
    width: metadata.width!,
    height: metadata.height!,
    thumbnailKey,
    thumbnailUrl: `${env.R2_PUBLIC_URL}/${thumbnailKey}`,
    blurHash,
    exifData: normalizeExif(exif),
    takenAt: exif?.DateTimeOriginal ?? null,
  };
}
```

### 5.3 Upload Concurrency Control

```typescript
// Process uploads with max 3 concurrent
async function processQueue(files: File[]): Promise<void> {
  const limit = pLimit(3); // p-limit library
  await Promise.all(files.map((file) => limit(() => processAndUploadFile(file))));
}
```

### 5.4 File Validation

```typescript
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const MAX_FILES_PER_UPLOAD = 100;

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File too large: max 20MB` };
  }
  return { valid: true };
}
```

---

## 6. Grid View

### 6.1 Masonry Layout Implementation

```typescript
// components/MasonryGrid.tsx
// Uses CSS columns approach for simplicity + performance
// Alternative: react-masonry-css or custom JS layout engine

// CSS-based masonry (best browser support with no reflow jank)
// Tailwind classes for masonry:
// columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2

// For JS-driven layout (better control over column balancing):
import { useColumnLayout } from "@/hooks/useColumnLayout";

function MasonryGrid({ images }: { images: GalleryImage[] }) {
  const { columnCount, columns } = useColumnLayout(images, {
    minColumnWidth: 220,
    gap: 8,
  });

  return (
    <div className="flex gap-2">
      {columns.map((column, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-2 flex-1">
          {column.map((image) => (
            <MasonryItem key={image.id} image={image} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 6.2 Lazy Loading with Intersection Observer

```typescript
// hooks/useLazyLoad.ts
function useLazyLoad(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Image item component uses blur hash as placeholder
function MasonryItem({ image }: { image: GalleryImage }) {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref} style={{ aspectRatio: image.aspectRatio }}>
      {isVisible ? (
        <img
          src={image.thumbnailUrl ?? image.url}
          alt={image.aiDescription ?? image.filename}
          loading="lazy"
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <BlurhashCanvas
          hash={image.blurHash ?? "LEHV6nWB2yk8pyo0adR*.7kCMdnj"}
          width={400}
          height={Math.round(400 / image.aspectRatio)}
          className="w-full h-full rounded-lg"
        />
      )}
    </div>
  );
}
```

### 6.3 Hover Overlay

```typescript
// Hover overlay: filename, date, tag count
// Only rendered when item is hovered (CSS group-hover)
<div className="group relative overflow-hidden rounded-lg cursor-pointer">
  <img ... />
  <div className="
    absolute inset-0
    bg-gradient-to-t from-black/70 to-transparent
    opacity-0 group-hover:opacity-100
    transition-opacity duration-200
    flex flex-col justify-end p-2
  ">
    <p className="text-white text-xs font-medium truncate">{image.filename}</p>
    <p className="text-white/70 text-xs">{formatDate(image.uploadedAt)}</p>
    {image.aiTags.length > 0 && (
      <p className="text-white/70 text-xs">{image.aiTags.length} tags</p>
    )}
  </div>
</div>
```

### 6.4 Selection Mode

```typescript
// Selection behavior:
// - Single click (no modifiers): open lightbox
// - Cmd/Ctrl + click: toggle individual selection
// - Shift + click: range select from lastClickedId to current
// - Clicking any image when mode === "selecting": toggle that image
// - Checkbox appears on hover and stays visible when selected

function handleImageClick(
  e: React.MouseEvent,
  image: GalleryImage,
  selection: GallerySelection,
  images: GalleryImage[],
  setSelection: (s: GallerySelection) => void,
  openLightbox: (id: string) => void
) {
  if (e.metaKey || e.ctrlKey) {
    // Toggle individual
    const next = new Set(selection.selectedIds);
    next.has(image.id) ? next.delete(image.id) : next.add(image.id);
    setSelection({ ...selection, selectedIds: next, lastClickedId: image.id });
  } else if (e.shiftKey && selection.lastClickedId) {
    // Range select
    const ids = images.map((i) => i.id);
    const a = ids.indexOf(selection.lastClickedId);
    const b = ids.indexOf(image.id);
    const range = ids.slice(Math.min(a, b), Math.max(a, b) + 1);
    setSelection({
      selectedIds: new Set([...selection.selectedIds, ...range]),
      lastClickedId: image.id,
      mode: "selecting",
    });
  } else if (selection.mode === "selecting") {
    const next = new Set(selection.selectedIds);
    next.has(image.id) ? next.delete(image.id) : next.add(image.id);
    const mode = next.size === 0 ? "none" : "selecting";
    setSelection({ selectedIds: next, lastClickedId: image.id, mode });
  } else {
    openLightbox(image.id);
  }
}
```

### 6.5 Bulk Actions Bar

Appears as a sticky bottom bar when 1+ images selected:

```
┌──────────────────────────────────────────────────────────────────┐
│  [✕]  12 photos selected            [Move to ▼]  [Tag]  [Delete] │
└──────────────────────────────────────────────────────────────────┘
```

- "Move to": dropdown of all user albums + "Create new album"
- "Tag": popover with tag input, adds to all selected images
- "Download": zips selected images (server-side zip stream) and triggers download
- "Delete": confirmation modal showing count, then bulk delete

---

## 7. Image Viewer Modal (Lightbox)

### 7.1 Core Viewer Component

```typescript
// components/Lightbox.tsx

interface LightboxProps {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

// Keyboard handlers
useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowLeft":  navigateToPrev(); break;
      case "ArrowRight": navigateToNext(); break;
      case "Escape":     onClose(); break;
      case "i":          toggleInfoPanel(); break;
      case "+":
      case "=":          zoomIn(); break;
      case "-":          zoomOut(); break;
      case "0":          resetZoom(); break;
    }
  }
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [currentIndex]);
```

### 7.2 Zoom System

```typescript
interface ZoomState {
  scale: number;      // 1.0 = 100%, min 0.5, max 5.0
  originX: number;    // transform origin X (%)
  originY: number;    // transform origin Y (%)
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  panOffset: { x: number; y: number };
}

// Mouse wheel zoom
function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.2 : 0.2;
  const newScale = Math.max(0.5, Math.min(5.0, zoom.scale + delta));
  setZoom({ ...zoom, scale: newScale, originX: e.offsetX, originY: e.offsetY });
}

// Pinch-to-zoom (touch)
function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const dist = getTouchDistance(e.touches);
    const newScale = Math.max(0.5, Math.min(5.0, (dist / initialPinchDist) * initialScale));
    setZoom({ ...zoom, scale: newScale });
  }
}
```

### 7.3 Edit Toolbar

```typescript
// Edit mode tools (shown when "Edit" tab is active in info panel)
interface ImageEdits {
  crop?: { x: number; y: number; width: number; height: number };
  rotation: 0 | 90 | 180 | 270;
  brightness: number;  // -100 to 100, default 0
  contrast: number;    // -100 to 100, default 0
  saturation: number;  // -100 to 100, default 0
}
```

- **Crop:** `react-image-crop` library; "Apply Crop" button triggers server-side Sharp crop + re-upload
- **Rotate:** 90° CW/CCW buttons; immediate preview via CSS `transform: rotate()`; "Save" applies server-side
- **Brightness/Contrast:** Range sliders with real-time CSS `filter` preview; server-side Sharp on save
- **Revert:** "Revert to Original" button restores from original R2 key (originals never deleted)

### 7.4 EXIF Display

```typescript
const EXIF_DISPLAY_FIELDS = [
  { key: "make",          label: "Camera Make" },
  { key: "model",         label: "Camera Model" },
  { key: "iso",           label: "ISO" },
  { key: "fNumber",       label: "Aperture",     format: (v: number) => `f/${v}` },
  { key: "exposureTime",  label: "Shutter Speed" },
  { key: "focalLength",   label: "Focal Length", format: (v: number) => `${v}mm` },
  { key: "locationName",  label: "Location" },
] as const;
```

---

## 8. tRPC Procedures

### Router: `galleryRouter`

```typescript
// server/routers/gallery.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

const ImageFiltersSchema = z.object({
  albumId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z
    .object({ start: z.date(), end: z.date() })
    .optional(),
  search: z.string().optional(),
  mimeTypes: z.array(z.string()).optional(),
  aspectRatio: z.enum(["portrait", "landscape", "square"]).optional(),
  sortBy: z
    .enum(["uploadedAt", "takenAt", "size", "filename"])
    .default("uploadedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const galleryRouter = createTRPCRouter({
  // ── Albums ───────────────────────────────────────────────

  getAlbums: protectedProcedure.query(async ({ ctx }) => {
    // Returns albums with imageCount via _count
  }),

  createAlbum: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  updateAlbum: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          coverImageId: z.string().optional(),
          isPublic: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  deleteAlbum: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        deleteImages: z.boolean().default(false), // if false, images move to uncategorized
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  // ── Images ───────────────────────────────────────────────

  getImages: protectedProcedure
    .input(ImageFiltersSchema.merge(PaginationSchema))
    .query(async ({ ctx, input }) => {
      // Cursor-based pagination
      // Returns { images: GalleryImage[], nextCursor: string | null, total: number }
    }),

  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        mimeType: z.string(),
        size: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Validate file type and size
      // 2. Generate unique key: `${userId}/${nanoid()}-${filename}`
      // 3. Create pending Image record in DB
      // 4. Generate R2 pre-signed PUT URL (15 min expiry)
      // Returns: { uploadUrl, imageId, key }
    }),

  finalizeUpload: protectedProcedure
    .input(
      z.object({
        imageId: z.string(),
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Download from R2 (or trigger background job)
      // 2. Run processUploadedImage (thumbnail, blurHash, EXIF)
      // 3. Update Image record with all metadata
      // 4. Optionally trigger AI analysis (if auto-tag enabled)
    }),

  deleteImages: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership of all IDs
      // 2. Delete R2 objects (original + thumbnail)
      // 3. Delete DB records
    }),

  moveImages: protectedProcedure
    .input(
      z.object({
        imageIds: z.array(z.string()).min(1),
        albumId: z.string().nullable(), // null = uncategorized
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  searchImages: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        albumId: z.string().optional(),
        limit: z.number().int().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Full-text search on: filename, aiDescription, aiTags, manual tags
      // Uses Postgres full-text search with tsvector on aiDescription
      // Also filters by tag exact match
    }),

  // ── AI ───────────────────────────────────────────────────

  analyzeImage: protectedProcedure
    .input(z.object({ imageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch image URL from DB
      // 2. Call Vercel AI SDK (GPT-4o vision)
      // 3. Parse response for tags + description
      // 4. Upsert ImageTag records
      // 5. Update Image.aiDescription, aiTags[], aiAnalyzedAt
    }),

  generateBulkTags: protectedProcedure
    .input(
      z.object({
        albumId: z.string().optional(),
        limit: z.number().int().max(50).default(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Process up to N unanalyzed images in background
      // Returns job ID for polling
    }),

  addTag: protectedProcedure
    .input(
      z.object({
        imageId: z.string(),
        tag: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  removeTag: protectedProcedure
    .input(z.object({ id: z.string() /* ImageTag.id */ }))
    .mutation(async ({ ctx, input }) => {}),

  getAllTags: protectedProcedure.query(async ({ ctx }) => {
    // Returns all unique tags for the user, with counts
    // Used for tag filter sidebar
  }),
});
```

---

## 9. AI Features

### 9.1 Auto-Tagging System

**Model:** `gpt-4o` (vision capability required)

**Prompt strategy:**
```typescript
const TAGGING_SYSTEM_PROMPT = `
You are an image analysis assistant. Analyze the provided image and return:
1. A list of descriptive tags (max 15, lowercase, hyphenated for multi-word)
   Categories to consider: scene, objects, activities, people, colors, mood, season, location type
2. A natural-language description (1-2 sentences, factual, no assumptions about people's identities)

Always respond with valid JSON matching the schema.
`;

const result = await generateObject({
  model: openai("gpt-4o"),
  schema: z.object({
    tags: z.array(
      z.object({
        tag: z.string(),
        confidence: z.number().min(0).max(1),
        category: z.enum([
          "scene", "object", "activity", "person", "color",
          "mood", "season", "location-type", "other"
        ]),
      })
    ).max(15),
    description: z.string().max(500),
  }),
  messages: [
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: imageUrl, detail: "low" } }, // cost-effective
        { type: "text", text: "Analyze this image." },
      ],
    },
  ],
  system: TAGGING_SYSTEM_PROMPT,
});
```

### 9.2 Semantic Search

**Implementation:** For MVP, use PostgreSQL full-text search with `tsvector` on `aiDescription` and array containment for `aiTags`. For v2, consider pgvector embeddings.

```sql
-- Add to Image model migration
ALTER TABLE "Image" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce("filename", '') || ' ' ||
      coalesce("aiDescription", '') || ' ' ||
      array_to_string("aiTags", ' ')
    )
  ) STORED;

CREATE INDEX "Image_searchVector_idx" ON "Image" USING GIN("searchVector");
```

```typescript
// Prisma raw query for semantic search
const images = await ctx.db.$queryRaw<Image[]>`
  SELECT *
  FROM "Image"
  WHERE "userId" = ${userId}
    AND "searchVector" @@ plainto_tsquery('english', ${query})
  ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${query})) DESC
  LIMIT ${limit}
`;
```

### 9.3 AI Description Generation UI

- "Generate AI Description" button in lightbox info panel (if not yet analyzed)
- Loading state: spinning sparkle icon, "Analyzing..."
- On success: description appears with a "✨ AI Generated" badge
- Error state: "Analysis failed — try again"

---

## 10. Search and Filtering

### 10.1 Filter Panel

```
┌─────────────────────────────────────────────────────────┐
│ FILTERS                                          [Clear] │
├─────────────────────────────────────────────────────────┤
│ Date Range                                              │
│ [From: ________] [To: ________]                        │
│                                                         │
│ Tags (AI + Manual)                                      │
│ [sunset ✕] [travel ✕] [+ Add tag...]                   │
│                                                         │
│ File Type                                               │
│ [✓] JPEG  [✓] PNG  [ ] HEIC  [✓] WEBP  [ ] GIF        │
│                                                         │
│ Aspect Ratio                                            │
│ [ ] Portrait  [ ] Landscape  [ ] Square                │
│                                                         │
│ File Size                                               │
│ Min: [____] MB   Max: [____] MB                        │
│                                                         │
│ [Apply Filters]                                         │
└─────────────────────────────────────────────────────────┘
```

### 10.2 Search Bar Behavior

- Searches: filename, AI description, all tags (AI + manual)
- Debounced at 300ms
- Results highlighted (matching substring in filename)
- URL reflects search state for shareable links: `/gallery?search=sunset&album=abc`

---

## 11. State Management

### 11.1 Zustand Store

```typescript
// store/galleryStore.ts

interface GalleryStore {
  // Navigation
  activeAlbumId: string | null; // null = "All Photos"

  // Lightbox
  lightboxImageId: string | null;
  lightboxImages: GalleryImage[];

  // Selection
  selection: GallerySelection;

  // Upload queue
  uploadQueue: UploadQueueItem[];

  // Filters
  filters: ImageFilters;

  // Actions
  setActiveAlbum: (id: string | null) => void;
  openLightbox: (imageId: string, images: GalleryImage[]) => void;
  closeLightbox: () => void;
  navigateLightbox: (direction: "prev" | "next") => void;
  toggleSelection: (imageId: string) => void;
  selectRange: (fromId: string, toId: string, images: GalleryImage[]) => void;
  clearSelection: () => void;
  addToUploadQueue: (files: File[]) => void;
  updateQueueItem: (id: string, updates: Partial<UploadQueueItem>) => void;
  removeFromQueue: (id: string) => void;
  setFilters: (filters: Partial<ImageFilters>) => void;
  resetFilters: () => void;
}
```

---

## 12. Testing

### 12.1 Upload Flow Tests

```typescript
// __tests__/upload.test.ts

describe("image upload pipeline", () => {
  it("compresses images above 4MB before upload", async () => {
    const largeFile = createMockFile("large.jpg", 10 * 1024 * 1024, "image/jpeg");
    const result = await compressImage(largeFile);
    expect(result.size).toBeLessThan(4 * 1024 * 1024);
  });

  it("rejects files above 20MB even without compression", async () => {
    const hugeFile = createMockFile("huge.jpg", 25 * 1024 * 1024, "image/jpeg");
    expect(() => validateFile(hugeFile)).toThrow("File too large");
  });

  it("rejects disallowed MIME types", async () => {
    const pdf = createMockFile("doc.pdf", 1024, "application/pdf");
    const result = validateFile(pdf);
    expect(result.valid).toBe(false);
  });

  it("generates pre-signed URL with correct key format", async () => {
    const { key } = await trpc.gallery.getUploadUrl.mutate({...});
    expect(key).toMatch(/^user_[a-z0-9]+\/[a-z0-9]+-filename\.jpg$/);
  });
});
```

### 12.2 Image Processing Tests

```typescript
// __tests__/image-processing.test.ts

describe("processUploadedImage", () => {
  it("generates thumbnail at max 400px on longest side", async () => {
    const result = await processUploadedImage("key", portraitImageBuffer);
    const thumb = await sharp(result.thumbnailBuffer).metadata();
    expect(Math.max(thumb.width!, thumb.height!)).toBeLessThanOrEqual(400);
  });

  it("generates valid blurhash string", async () => {
    const result = await processUploadedImage("key", sampleImageBuffer);
    expect(result.blurHash).toMatch(/^[A-Za-z0-9+/]+$/);
    expect(result.blurHash.length).toBeGreaterThan(6);
  });

  it("extracts EXIF GPS coordinates when present", async () => {
    const result = await processUploadedImage("key", exifImageBuffer);
    expect(result.exifData?.gpsLatitude).toBeCloseTo(48.8566, 2); // Paris
    expect(result.exifData?.gpsLongitude).toBeCloseTo(2.3522, 2);
  });

  it("handles images with no EXIF gracefully", async () => {
    const result = await processUploadedImage("key", noExifImageBuffer);
    expect(result.exifData).toBeNull();
    expect(result.takenAt).toBeNull();
  });
});
```

### 12.3 AI Tagging Mock Tests

```typescript
// __tests__/ai-tagging.test.ts

describe("analyzeImage", () => {
  beforeEach(() => {
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        tags: [
          { tag: "sunset", confidence: 0.97, category: "scene" },
          { tag: "paris", confidence: 0.94, category: "location-type" },
        ],
        description: "Eiffel Tower at sunset with orange sky",
      },
    });
  });

  it("saves AI tags to database with correct source", async () => {
    await analyzeImage({ imageId: "img_123", userId: "user_abc" });
    const tags = await db.imageTag.findMany({ where: { imageId: "img_123" } });
    expect(tags.every((t) => t.source === "ai")).toBe(true);
    expect(tags.map((t) => t.tag)).toContain("sunset");
  });

  it("updates image aiDescription and aiAnalyzedAt", async () => {
    await analyzeImage({ imageId: "img_123", userId: "user_abc" });
    const image = await db.image.findUnique({ where: { id: "img_123" } });
    expect(image?.aiDescription).toBe("Eiffel Tower at sunset with orange sky");
    expect(image?.aiAnalyzedAt).not.toBeNull();
  });

  it("does not duplicate existing AI tags on re-analysis", async () => {
    // Run twice
    await analyzeImage({ imageId: "img_123", userId: "user_abc" });
    await analyzeImage({ imageId: "img_123", userId: "user_abc" });
    const tags = await db.imageTag.findMany({ where: { imageId: "img_123" } });
    const uniqueTags = new Set(tags.map((t) => t.tag));
    expect(uniqueTags.size).toBe(tags.length); // no duplicates
  });
});
```

### 12.4 Selection Logic Tests

```typescript
describe("gallery selection", () => {
  it("shift-click selects range between last clicked and current", () => {});
  it("ctrl-click toggles individual image without clearing selection", () => {});
  it("clears selection when clicking without modifiers (non-selecting mode)", () => {});
  it("bulk move updates albumId for all selected images", async () => {});
});
```

---

## 13. File Structure

```
app/
  (app)/
    gallery/
      page.tsx                    # GalleryPage
      loading.tsx
      _components/
        AlbumSidebar.tsx
        AlbumCard.tsx
        CreateAlbumModal.tsx
        MasonryGrid.tsx
        MasonryItem.tsx
        SelectionBar.tsx
        BulkActionMenu.tsx
        Lightbox.tsx
        LightboxInfoPanel.tsx
        EditToolbar.tsx
        UploadZone.tsx
        UploadQueue.tsx
        UploadQueueItem.tsx
        SearchBar.tsx
        FilterPanel.tsx
        TagChip.tsx
      _hooks/
        useImageUpload.ts
        useMasonryLayout.ts
        useLazyLoad.ts
        useImageEdits.ts
        useGallerySelection.ts
      _utils/
        imageCompression.ts
        exifNormalizer.ts
        blurHashDecoder.ts
        searchUtils.ts

server/
  routers/
    gallery.ts
  lib/
    image-processing.ts
    r2.ts

store/
  galleryStore.ts

types/
  gallery.ts
```

---

## 14. Performance Considerations

- **Thumbnail First:** Always load thumbnail URL in grid; only load original in lightbox
- **Blur Hash Placeholder:** `blurhash` decoded client-side in `<canvas>` before image loads
- **Cursor Pagination:** Never use OFFSET for large image libraries; always cursor-based
- **R2 CDN:** Set appropriate `Cache-Control: public, max-age=31536000, immutable` on R2 public URLs
- **Batch AI Analysis:** Rate-limited to 3 concurrent AI calls; use a queue processor for bulk tagging
- **Virtual Scroll:** For albums with > 500 images, virtualize the masonry grid with `@tanstack/react-virtual` in grid mode
- **Pre-signed URL Expiry:** 15 minutes; if upload hasn't completed by then, client must request a new URL

---

*End of SPEC_GALLERY.md*
