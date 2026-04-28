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

**Remove from `VideoFeed`:** The entire **nested** `const VideoFrame = (...) => { ... };` block that currently sits **inside** `VideoFeed`.

**Remove from `VideoFeed`:** The line **`export default function VideoFeed`** — you will use **`const VideoFeed = ...`** + **`export default VideoFeed`** at the bottom (Step 10).

**Add** directly **below** `export interface VideoProps { ... }` (still above `VideoFeed`):

```tsx
const VideoFrame = ({ videoProps }: { videoProps: VideoProps }) => {
  const { videoURL, isMuted, toggleMute, isActive } = videoProps;
  return (
    <div className="h-full w-full flex justify-center items-center overflow-hidden relative">
      {/* Step 2–4: video, tap overlay, mute UI */}
    </div>
  );
};
```

**Change** `VideoFeed` to a regular const (no `export default` on this line yet):

```tsx
const VideoFeed = ({ videoRes }: { videoRes: VideoResponse }) => {
  // Step 5+: only feed logic here
};
```

---

### Step 2 — `VideoFrame`: own `videoRef`, `isPaused`, `togglePlay`, and `<video>`

**Replace** the inside of `VideoFrame` (the placeholder comment) with:

```tsx
const VideoFrame = ({ videoProps }: { videoProps: VideoProps }) => {
  const { videoURL, isMuted, toggleMute, isActive } = videoProps;
  const videoRef = useRef<HTMLVideoElement>(null);
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
    </div>
  );
};
```

**Remove from `VideoFeed`:** `videoRef`, `isPaused`, `togglePlay` (they now live only in `VideoFrame`).

---

### Step 3 — `VideoFrame`: `useEffect` for `isActive` (autoplay / pause on scroll)

**Add** inside `VideoFrame`, **after** `useState` for `isPaused` and **before** `togglePlay`:

```tsx
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
```

---

### Step 4 — `VideoFrame`: mute + creator overlay (`z-20`)

**Add** inside the outer `VideoFrame` `<div>`, **after** the tap overlay `</div>`, **before** the closing `</div>` of the frame:

```tsx
<div className="absolute inset-0 z-20 pointer-events-none">
  <div className="absolute top-4 left-4 pointer-events-auto">
    <button
      type="button"
      className="absolute top-[10px] left-[10px] w-[40px] h-[40px] bg-transparent"
      onClick={toggleMute}
    >
      {isMuted ? (
        <img src="/mute.png" alt="Muted" className="w-[40px] h-[40px]" />
      ) : (
        <img
          src="/unmute.png"
          alt="Unmuted"
          className="w-[40px] h-[40px]"
        />
      )}
    </button>
  </div>
  <div className="absolute bottom-8 left-4 pointer-events-auto">
    <p className="text-white font-bold text-lg drop-shadow-md">@"creator"</p>
  </div>
</div>
```

---

### Step 5 — `VideoFeed`: keep only feed-level state + refs + `toggleMute`

**Inside `VideoFeed`, remove** (if still present):

- `const videoRef = ...`
- `const [isPaused, ...]`
- `const [isActive, setIsActive] = ...` (unused)
- `const togglePlay = ...`
- any **nested** `VideoFrame` definition

**Ensure `VideoFeed` starts like this** (then Steps 7–9 add observer + JSX + pagination):

```tsx
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

  // Step 7: observer
  // Step 8: return (...)
  // Step 9: pagination effect
};
```

---

### Step 6 — Import `getVideosByQuery`

**Add** at the top of `component/Video.tsx` with the other imports:

```tsx
import { getVideosByQuery } from "@/lib/getVideos";
```

---

### Step 7 — `VideoFeed`: `IntersectionObserver` + `useCallback`

**Add** inside `VideoFeed` after `toggleMute` (and **before** the pagination effect if you already added it):

```tsx
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
```

---

### Step 8 — `VideoFeed`: scroll container + `map` + `VideoFrame` per item

**Add** the `return` for `VideoFeed` (or replace the old return):

```tsx
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
```

Use the **same search string** as `page.tsx` in Step 9 (here: `"space"`).

---

### Step 9 — `VideoFeed`: load more when near the end

**Add** another `useEffect` in `VideoFeed` (after the observer effect is fine):

```tsx
useEffect(() => {
  const remaining = videos.length - currentIndex - 1;
  if (remaining <= 2 && !fetchingRef.current) {
    fetchingRef.current = true;

    getVideosByQuery("space", page, 5)
      .then((data) => {
        if (data && data.videos.length > 0) {
          setVideos((prev) => {
            const existingIds = new Set(prev.map((v) => v.id));
            const newVideos = data.videos.filter((v) => !existingIds.has(v.id));
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
```

Change **`"space"`** to match **`page.tsx`** if you use a different query.

---

### Step 10 — Default export + `app/page.tsx` import

**At the bottom of `component/Video.tsx`, add:**

```tsx
export default VideoFeed;
```

**In `app/page.tsx`, change:**

```tsx
// Before
import VideoFrame from "@/component/Video";
// ...
<VideoFrame videoRes={data} />

// After
import VideoFeed from "@/component/Video";
// ...
<VideoFeed videoRes={data} />
```

**Result:** One default export, correct import name, full feed behavior.

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

