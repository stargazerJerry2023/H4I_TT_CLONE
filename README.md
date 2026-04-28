# Workshop: `component/Video.tsx` → completed TikTok-style feed

This guide starts from **your current** `component/Video.tsx` (hoisted `VideoFrame`, `VideoFeed` with `return null`) and walks step-by-step to match the **completed** behavior in root `Video.tsx` (mute UI, vertical snap feed, `IntersectionObserver`, client pagination).

**Reference:** Full solution lives in **`Video.tsx`** at the repo root. After each step, you can diff against that file.

**Align with `app/page.tsx`:** Your home page uses **`getVideosByQuery("space", 1, 5)`**. Use **`"space"`** in the client pagination step too (the root reference file uses `"nature"` — pick one string in both places).

---

## What you have today (baseline)

- `VideoFrame`: ref, pause overlay, `useEffect` for `isActive`, tap-to-play — **no** mute/creator layer.
- `VideoFeed`: seeds `videos`, `currentIndex`, `isMuted`, `page`, plus unused `isActive` state — **`return null`** so nothing renders yet.
- **No** `getVideosByQuery` import, **no** observer, **no** scroll container or `map`.

---

## Step 1 — Import `getVideosByQuery`

**Why:** The feed will fetch page 2, 3, … from the client when the user scrolls near the end (same server function as `page.tsx`, invoked from the browser via your `"use server"` module).

**Add** at the top of `component/Video.tsx` (with your other imports):

```tsx
import { getVideosByQuery } from "@/lib/getVideos";
```

**Optional:** Reorder type imports to match the completed file:

```tsx
import { VideoRes, VideoResponse } from "@/types/backend/types";
```

---

## Step 2 — `VideoFrame`: one root `<div>` + mute / creator overlay (`z-20`)

**Why:** TikTok-style UI needs mute control and a caption area. The completed layout uses a **single** outer wrapper (no `<>...</>` fragment) so overlays stack as siblings: video (`z-0`), tap layer (`z-10`), chrome (`z-20`).

**Change in `VideoFrame` `return`:**

1. Replace the fragment with **one** outer `div` (class order like completed: `h-full w-full flex justify-center items-center overflow-hidden relative`).
2. After the tap overlay `</div>`, **before** the closing outer `</div>`, paste the **`z-20`** block:

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

**Assets:** Ensure **`public/mute.png`** and **`public/unmute.png`** exist (and play/pause images if not already).

**Later improvement:** Replace `@"creator"` with **`{video.user.name}`** by passing `creatorName` through `VideoProps` from `video.user.name` in the `map`.

---

## Step 3 — `VideoFrame`: match completed `togglePlay` guard (optional but tidy)

**Why:** Completed code wraps body in `if (videoRef.current) { ... }` so `setTimeout` only runs when the ref exists.

**Replace** your `togglePlay` with:

```tsx
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
```

---

## Step 4 — `VideoFeed`: remove dead state; add refs + `toggleMute`

**Why:** `isActive` on the feed is unused — **per-item** `isActive` is computed as `index === currentIndex` when you `map`. You need a scroll container ref, a fetch lock ref, and a mute toggler shared by all frames.

**Remove from `VideoFeed`:**

```tsx
const [isActive, setIsActive] = useState(false);
```

**Replace** the opening of `VideoFeed` with:

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

  // Steps 5–7 add observer, pagination, and return JSX
};
```

---

## Step 5 — `VideoFeed`: `IntersectionObserver` + `useCallback`

**Why:** When the user scrolls, the browser tells us which `data-index` section is most visible. We set `currentIndex` so only that `VideoFrame` gets `isActive` and autoplays.

**Add** inside `VideoFeed` after `toggleMute`:

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

## Step 6 — `VideoFeed`: pagination near the end of the list

**Why:** Initial data is only page 1 from the server. When the user is close to the last clips, fetch the next Pexels page, **dedupe by `id`**, append, and bump `page` so the next fetch gets new results.

**Add** another `useEffect` in `VideoFeed`:

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

**Note:** If you use **`"nature"`** (or anything else) in **`page.tsx`**, use that **same** string here instead of **`"space"`**.

---

## Step 7 — `VideoFeed`: replace `return null` with snap-scroll + `map`

**Why:** This is the visible feed: full-screen sections, scroll snap, and one `VideoFrame` per video with `isActive` driven by `currentIndex`.

**Replace** `return null;` with:

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

**Tailwind:** If `scrollbar-hide` is not defined in your setup, remove that class or add the utility in your global CSS.

---

## Step 8 — `app/page.tsx`: name the import `VideoFeed` (optional cleanup)

**Why:** The default export **is** `VideoFeed`. Naming the import `VideoFrame` works but confuses readers.

**Change:**

```tsx
import VideoFeed from "@/component/Video";
// ...
<VideoFeed videoRes={data} />
```

---

## Done checklist

| Step | Done |
|------|------|
| 1 | `getVideosByQuery` imported |
| 2 | Mute + creator overlay on `VideoFrame` |
| 3 | (Optional) `togglePlay` guard matches completed |
| 4 | `VideoFeed`: refs + `toggleMute`, removed unused `isActive` |
| 5 | `IntersectionObserver` + `useCallback` |
| 6 | Pagination with dedupe + `page` bump |
| 7 | Snap-scroll + `videos.map` + `data-index` |
| 8 | (Optional) `page.tsx` import renamed to `VideoFeed` |

---

## Full completed `component/Video.tsx` (target)

After all steps, your file should match root **`Video.tsx`**, except use **`"space"`** in **`getVideosByQuery`** if that matches **`page.tsx`**.

You can copy-paste from **`Video.tsx`** and only change the query string if needed.

