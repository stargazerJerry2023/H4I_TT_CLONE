# TikTok Clone Workshop Template

Workshop notes for moving from the **starter** feed (`component/Video.tsx`) to the **completed** feed (same logic as root `Video.tsx`).

## Where the “completed” code lives

- **Reference copy:** `Video.tsx` in the **project root** (full solution for comparison).
- **What students should ship:** Copy that solution into **`component/Video.tsx`** so imports stay `import … from "@/component/Video"`. You can delete or ignore the root `Video.tsx` after merging to avoid two sources of truth.

## Fix `app/page.tsx` after the merge

The completed module **default-exports `VideoFeed`**, not `VideoFrame`.

### `app/page.tsx` — **Before** (starter)

```tsx
"use server";

import VideoFrame from "@/component/Video";
import { getVideosByQuery } from "@/lib/getVideos";
import { VideoResponse } from "@/types/backend/types";

export default async function Home() {
  const data = await getVideosByQuery("space", 1, 5);

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div className="flex h-[90%] w-[40%] bg-black flex justify-center items-center rounded-2xl">
        <VideoFrame videoRes={data} />
      </div>
    </div>
  );
}
```

### `app/page.tsx` — **After** (matches completed `VideoFeed` export)

```tsx
"use server";

import VideoFeed from "@/component/Video";
import { getVideosByQuery } from "@/lib/getVideos";

export default async function Home() {
  const data = await getVideosByQuery("space", 1, 5);

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div className="flex h-[90%] w-[40%] bg-black flex justify-center items-center rounded-2xl">
        <VideoFeed videoRes={data} />
      </div>
    </div>
  );
}
```

**What changed:** `VideoFrame` → **`VideoFeed`**, drop unused `VideoResponse` import if you are not using it in this file.

---

## `component/Video.tsx` — **Before** (starter, full file)

This is the workshop starter: nested `VideoFrame`, shared parent `videoRef`, and **no** list / observer / pagination.

```tsx
"use client";
import { VideoResponse, VideoRes } from "@/types/backend/types";
import { useCallback, useEffect, useRef, useState } from "react";
export interface VideoProps {
  videoURL: string;
  isMuted: boolean;
  toggleMute: () => void;
  isActive: boolean;
}

export default function VideoFeed({ videoRes }: { videoRes: VideoResponse }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videos, setVideos] = useState<VideoRes[]>(videoRes.videos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [page, setPage] = useState(2);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setPaused] = useState<{
    type: boolean;
    id: number;
  } | null>(null);

  const togglePlay = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      setPaused({ type: false, id: Date.now() });
      videoRef.current.play().catch((err) => {
        console.error("Play failed:", err);
      });
    } else {
      setPaused({ type: true, id: Date.now() });
      videoRef.current.pause();
    }
    setTimeout(() => setPaused(null), 600);
  };

  const VideoFrame = ({ videoProps }: { videoProps: VideoProps }) => {
    const { videoURL, isMuted, toggleMute, isActive } = videoProps;

    useEffect(() => {
      if (!videoRef.current) return;
      if (isActive) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((err) => {
          console.error("Autoplay prevented by browser:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }, [isActive, videoURL]);

    return (
      <>
        <div className="h-full w-full overflow-hidden relative flex justify-center items-center">
          <video
            ref={videoRef}
            src={videoURL}
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 h-full w-full object-cover z-0 rounded-2xl"
          />
          <div
            className="absolute inset-0 z-10 w-full h-full flex justify-center items-center"
            onClick={togglePlay}
          >
            {isPaused && (
              <img
                key={isPaused.id}
                src={isPaused.type ? "/pause.png" : "/play.png"}
                className="w-[60px] h-[60px] animate-float-up pointer-events-none"
                alt={isPaused.type ? "Pause" : "Play"}
              />
            )}
          </div>
        </div>
      </>
    );
  };
}
```

---

## `component/Video.tsx` — **After** (completed implementation)

Copy this into **`component/Video.tsx`** (same content as root `Video.tsx`). Align **`getVideosByQuery("…", page, 5)`** with the query you use in **`page.tsx`** (e.g. `"space"` everywhere).

```tsx
"use client";
import { getVideosByQuery } from "@/lib/getVideos";
import { VideoRes, VideoResponse } from "@/types/backend/types";
import { useCallback, useEffect, useRef, useState } from "react";

export interface VideoProps {
  videoURL: string;
  isMuted: boolean;
  toggleMute: () => void;
  isActive: boolean;
}

const VideoFrame = ({ videoProps }: { videoProps: VideoProps }) => {
  const { videoURL, isMuted, toggleMute, isActive } = videoProps;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setPaused] = useState<{
    type: boolean;
    id: number;
  } | null>(null);
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((error) => {
        console.error("Autoplay prevented by browser:", error);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isActive, videoURL]);

  const togglePlay = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        setPaused({ type: false, id: Date.now() });
        videoRef.current.play().catch((error) => {
          console.error("Play failed:", error);
        });
      } else {
        videoRef.current.pause();
        setPaused({ type: true, id: Date.now() });
      }
      setTimeout(() => {
        setPaused(null);
      }, 600);
    }
  };

  return (
    <div className="h-full w-full flex justify-center items-center overflow-hidden relative">
      <video
        ref={videoRef}
        src={videoURL}
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 h-full w-full object-cover z-0 rounded-2xl"
      />
      <div
        className="absolute inset-0 z-10 w-full h-full flex justify-center items-center"
        onClick={togglePlay}
      >
        {isPaused && (
          <img
            key={isPaused.id}
            src={isPaused.type ? "/pause.png" : "/play.png"}
            className="w-[60px] h-[60px] animate-float-up pointer-events-none"
            alt={isPaused.type ? "Pause" : "Play"}
          />
        )}
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute top-4 left-4 pointer-events-auto">
          <button
            className="absolute top-[10px] left-[10px] w-[40px] h-[40px] bg-transparent"
            onClick={toggleMute}
          >
            {isMuted ? (
              <img src="/mute.png" alt="Muted" className="w-[40px] h-[40px]" />
            ) : (
              <img
                src="/unmute.png"
                alt="UnMuted"
                className="w-[40px] h-[40px]"
              />
            )}
          </button>
        </div>
        <div className="absolute bottom-8 left-4 pointer-events-auto">
          <p className="text-white font-bold text-lg drop-shadow-md">
            @"creator"
          </p>
        </div>
      </div>
    </div>
  );
};

const VideoFeed = ({ videoRes }: { videoRes: VideoResponse }) => {
  const [videos, setVideos] = useState<VideoRes[]>(videoRes.videos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [page, setPage] = useState(2);

  const fetchingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute("data-index"));
          setCurrentIndex(idx);
        }
      });
    },
    [],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      root: containerRef.current,
      threshold: 0.6,
    });
    const items = containerRef.current?.querySelectorAll("[data-index]");
    items?.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [videos, observerCallback]);

  useEffect(() => {
    const remaining = videos.length - currentIndex - 1;
    if (remaining <= 2 && !fetchingRef.current) {
      fetchingRef.current = true;

      getVideosByQuery("space", page, 5)
        .then((data) => {
          if (data && data.videos.length > 0) {
            setVideos((prev) => {
              const existingIds = new Set(prev.map((v) => v.id));
              const newVideos = data.videos.filter(
                (v) => !existingIds.has(v.id),
              );
              return [...prev, ...newVideos];
            });

            setPage((prevPage) => prevPage + 1);
          }
          fetchingRef.current = false;
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          fetchingRef.current = false;
        });
    }
  }, [currentIndex, videos.length, page]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black text-white"
    >
      {videos.map((video, index) => {
        const isActive = index === currentIndex;

        return (
          <div
            key={`${video.id}-${index}`}
            data-index={index}
            className="h-screen w-full snap-start snap-always"
          >
            <VideoFrame
              videoProps={{
                videoURL: video.url,
                isMuted,
                toggleMute,
                isActive,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default VideoFeed;
```

**Note:** The **after** block uses **`getVideosByQuery("space", page, 5)`** so it matches **`page.tsx`** above. If you keep **`"nature"`** in your app, change both files to **`"nature"`**.

---

## Workshop — From starter `component/Video.tsx` to completed `VideoFeed`

### What’s wrong in the starter

- **`VideoFrame` is nested inside `VideoFeed`** and reuses **`videoRef` / `togglePlay` / `isPaused` from the parent**, so every card would fight over one ref (only one real `<video>` should exist per card, each with its own ref).
- **`VideoFeed` never maps `videos`** — there is no vertical list, snap scroll, or `data-index`.
- **No `IntersectionObserver`** — `currentIndex` never updates from scroll.
- **No `getVideosByQuery` in the client** — no “load more” when you near the end.
- **No mute UI** in the starter `VideoFrame` (completed version adds mute/creator overlay).
- **Unused state** in starter: `isActive` in `VideoFeed` is not wired to anything meaningful.

---

### Step 1 — Hoist `VideoFrame` to the top level (same file)

**Starter issue:** Nested `VideoFrame` shares parent hooks/refs incorrectly.

**Change:** Define **`const VideoFrame = …`** at **module scope** (above `VideoFeed`), same as root `Video.tsx`.

**Result:** One `VideoFrame` instance per list item, each with its own `videoRef` and `isPaused`.

---

### Step 2 — Give `VideoFrame` its own `videoRef`, `isPaused`, and `togglePlay`

**Starter issue:** `togglePlay` and `videoRef` live on `VideoFeed` but `VideoFrame` renders the `<video>`.

**Change:** Move **`useRef<HTMLVideoElement>(null)`**, **`isPaused` state**, and **`togglePlay`** **inside** `VideoFrame` (see root `Video.tsx`).

**Result:** Tap-to-play/pause and overlay icons stay correct **per card**.

---

### Step 3 — Keep the `useEffect` that reacts to `isActive` inside `VideoFrame`

**Change:** Leave the effect that **`play()`s when `isActive`**, **`pause()`s when not**, and resets **`currentTime`** when active — already matches completed file; just ensure it uses **`VideoFrame`’s** `videoRef`.

**Result:** Only the “active” card autoplays when scroll selection updates.

---

### Step 4 — Add mute overlay UI to `VideoFrame`

**Starter issue:** No mute control or creator label.

**Change:** Add the **`z-20`** overlay with:

- **`button`** + **`onClick={toggleMute}`**
- **`/mute.png`** vs **`/unmute.png`**
- Optional **`@"creator"`** text (or later: `video.user.name`)

**Result:** Matches TikTok-style chrome; students see props drilling (`toggleMute`, `isMuted`).

---

### Step 5 — Strip `VideoFeed` down to feed-only state

**Change:** In `VideoFeed`, **remove** `videoRef`, `isPaused`, `togglePlay`, and **remove** unused **`isActive`** state.

**Keep:** `videos`, `currentIndex`, `isMuted`, `page`.

**Add:** `fetchingRef`, `containerRef`, `toggleMute` callback.

**Result:** Clear separation: **feed = list + scroll + fetch**, **frame = one video UI**.

---

### Step 6 — Import `getVideosByQuery` for client pagination

**Change:** At top of `component/Video.tsx`:

```ts
import { getVideosByQuery } from "@/lib/getVideos";
```

**Result:** Client can request page 2, 3, … after the server loaded page 1 in `page.tsx`.

---

### Step 7 — Add `IntersectionObserver` + `useCallback`

**Change:** Copy from root `Video.tsx`:

- **`observerCallback`** wrapped in **`useCallback(..., [])`**
- **`useEffect`** that creates **`new IntersectionObserver(observerCallback, { root: containerRef.current, threshold: 0.6 })`**
- **`querySelectorAll("[data-index]")`** + **`observe` each**
- **`return () => observer.disconnect()`**
- Dependency array **`[videos, observerCallback]`**

**Result:** Scrolling updates **`currentIndex`** so `isActive` per item stays in sync.

---

### Step 8 — Render the scrollable feed: map + snap + `data-index`

**Change:** Replace the current `VideoFeed` return with the **full-height scroll container**:

- **`ref={containerRef}`**
- **`overflow-y-scroll snap-y snap-mandatory`** (and `scrollbar-hide` if you use it)
- **`videos.map`** → wrapper **`div`** with **`data-index={index}`**, **`h-screen`**, **`snap-start`**
- Pass **`isActive: index === currentIndex`** into each **`VideoFrame`**

**Result:** Vertical TikTok-style paging between clips.

---

### Step 9 — Pagination `useEffect` (load more near the end)

**Change:** Copy the effect that:

- Computes **`remaining = videos.length - currentIndex - 1`**
- If **`remaining <= 2`** and not **`fetchingRef.current`**, call **`getVideosByQuery("space", page, 5)`** (use the **same** query string as in `page.tsx`)
- **Dedupe** new videos by **`id`**
- **`setPage(p => p + 1)`** after success
- Reset **`fetchingRef`** in **`then` / `catch`**

**Result:** Infinite-style feed without duplicate IDs.

---

### Step 10 — Default export and cleanup

**Change:**

- **`export default VideoFeed;`** (named `VideoFeed` + default export, as in root file)
- Remove duplicate **`export default function VideoFeed`** pattern if you had two exports.
- Run **`eslint`** / TypeScript and fix any unused imports.

**Result:** `app/page.tsx` imports **`VideoFeed`** from **`@/component/Video`** and the app matches the completed behavior.

---

## Quick checklist (for slides or handout)

| Done? | Item |
|------|------|
| ☐ | `VideoFrame` at top level with own `videoRef` / `isPaused` / `togglePlay` |
| ☐ | Mute + creator (or user name) overlay on `VideoFrame` |
| ☐ | `VideoFeed` maps `videos` in snap-scroll container |
| ☐ | `data-index` on each section |
| ☐ | `IntersectionObserver` updates `currentIndex` |
| ☐ | `getVideosByQuery` load-more with dedupe + `page` |
| ☐ | `page.tsx` imports `VideoFeed` and passes `videoRes` |

---

## Note on query string (`"nature"` vs `"space"`)

Use the **same search query** in **`page.tsx`** (first fetch) and in **`VideoFeed`** (load more) so pagination feels consistent for demos.


