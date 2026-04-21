
## Workshop 1 — `lib/getVideos.ts`: changes from the starter

This section lists **what to add or change** in `getVideos.ts` when moving from the hardcoded starter to a usable Pexels client. (You can keep this in the root `README.md` or move it to something like `docs/workshop-1-getVideos.md`.)

### 1. Use function parameters in the URL

**Starter issue:** The request URL is fixed (for example `nature`, page `1`, `per_page` `1`), so parameters like `query`, `pages`, and `per_page` are ignored.

**Change:** Build the URL from the arguments you pass in.

```ts
const res = await fetch(
  `https://api.pexels.com/v1/videos/search?query=${encodeURIComponent(query ?? "")}&page=${pages}&per_page=${per_page}`,
  { headers: { Authorization: API_KEY } },
);
```

### 2. Separate `fetch` and `json()`, and check HTTP status

**Starter issue:** `await (await fetch(...)).json()` always parses the body, even on 4xx/5xx responses.

**Change:** Await `fetch`, verify `res.ok`, then `res.json()`.

```ts
const res = await fetch(/* ... */);

if (!res.ok) {
  throw new Error("Failed to fetch videos");
}

const data = await res.json();
```

### 3. Fix the mapped fields

**Starter issue:** `width` is set from `video.id` instead of `video.width`, and `tags` is missing for the `VideoRes` type.

**Change:**

```ts
width: video.width,
tags: video.tags || [],
```

### 4. Return a `VideoResponse`, not only an array

**Starter issue:** Returning `videos` alone loses pagination metadata from Pexels.

**Change:** Return the shape your types expect:

```ts
return {
  page: data.page,
  per_page: data.per_page,
  videos,
};
```

Type the function as `Promise<VideoResponse>` (recommended).

### 5. Naming and exports

**Change:** Prefer a clear name and a **named export** so `app/page.tsx` can do:

```ts
import { getVideosByQuery } from "@/lib/getVideos";
```

Example:

```ts
export const getVideosByQuery = async (
  query: string,
  pages: number,
  per_page: number = 5,
): Promise<VideoResponse> => {
  // ...
};
```

Remove the old `export default GetVideos` (or equivalent) if you switch to a named export.

**Why for Workshop 1:** Students use real API parameters, handle HTTP errors correctly, align data with TypeScript (`VideoResponse` / `VideoRes`), and share one response shape between the page and the feed. `encodeURIComponent` avoids broken URLs when the query contains spaces.



## Workshop 1 — `app/page.tsx`: changes from the starter

This section lists **what to add or change** in `app/page.tsx` so the **server** loads the first page of results and passes a full **`VideoResponse`** into the client feed.

### 1. Import the named fetch helper

**Starter issue:** The page imports a **default** helper (for example `GetVideos`) that does not match the finished API in `lib/getVideos.ts`, so names and return types drift apart.

**Change:** Import **`getVideosByQuery`** as a **named** import from `@/lib/getVideos`.

```ts
import { getVideosByQuery } from "@/lib/getVideos";
```

Remove the old default import (for example `import GetVideos from "@/lib/getVideos"`).

### 2. Fetch the first page on the server

**Starter issue:** The starter calls the helper with placeholder arguments (for example empty strings and `0`) or otherwise does not request a real first page from Pexels.

**Change:** Inside `Home`, **`await`** a real first-page request. Match the arity of `getVideosByQuery` (two or three arguments depending on your implementation).

```ts
const data = await getVideosByQuery("nature", 1);
```

If your `getVideosByQuery` takes `per_page` as a third argument:

```ts
const data = await getVideosByQuery("nature", 1, 5);
```

### 3. Pass `VideoResponse` into `VideoFeed`, not a single URL

**Starter issue:** The page passes **`url={data[0].url}`**, which assumes an array, throws away pagination fields, and prevents the feed from rendering the full list or loading more pages later.

**Change:** Pass the whole response object the fetch layer returns:

```tsx
<VideoFeed videoRes={data} />
```

Your `VideoFeed` props should expect **`videoRes: VideoResponse`** (after you update `component/Video.tsx` accordingly).

### 4. Handle errors with `try/catch`

**Starter issue:** If `getVideosByQuery` throws (missing API key, bad HTTP response, and so on), the error is unhandled and the page can crash without a clear story for students.

**Change:** Wrap the fetch + JSX return in **`try/catch`**, log the error, and optionally return a simple fallback UI.

```tsx
export default async function Home() {
  try {
    const data = await getVideosByQuery("nature", 1);
    return (
      data && (
        <div className="h-screen w-screen flex justify-center items-center">
          <div className="flex h-[90%] w-[40%] bg-black flex justify-center items-center rounded-2xl">
            <VideoFeed videoRes={data} />
          </div>
        </div>
      )
    );
  } catch (error) {
    console.error("Error fetching videos:", error);
  }
}
```

### In app/page.tsx, log that the page received data
```
const data = await getVideosByQuery("nature", 1, 5);
console.log("[Home] VideoResponse", {
  page: data.page,
  per_page: data.per_page,
  count: data.videos.length,
});
```
### 5. Remove debug-only code (optional cleanup)

**Starter issue:** A stray **`console.log(data[0].url)`** (or similar) adds noise and encourages thinking in terms of a single URL instead of **`VideoResponse`**.

**Change:** Delete those logs once the feed works, or replace them with a single structured log during debugging only.

**Why for Workshop 1:** Students see the **App Router** pattern: **`async`** server page → **`await`** data → pass props to a **client** component. They also see why **`videoRes`** beats **`url`**: one object carries **`videos`** plus pagination for the feed and for “load more” in `Video.tsx`.

## Workshop 1 — `component/Video.tsx`: changes from the starter

This section lists **what to add or change** in `Video.tsx` when moving from a **single URL** to a **vertical feed**: snap scrolling, active video detection, play/pause, mute, and loading more pages.

### 1. Props: take `videoRes`, not `url`

**Starter issue:** `VideoFeed` only accepts **`{ url: string }`**, so it cannot render a list or use pagination metadata from **`VideoResponse`**.

**Change:** Type the component as **`{ videoRes: VideoResponse }`**. Import **`VideoRes`** when you need it for list state.

```tsx
import { VideoResponse, VideoRes } from "@/types/backend/types";

export default function VideoFeed({ videoRes }: { videoRes: VideoResponse }) {
```

### 2. Keep local list state seeded from the server

**Starter issue:** There is no array of videos in state, so you cannot append results when the user scrolls.

**Change:** Initialize **`videos`** from **`videoRes.videos`** with **`useState`**. Track **`currentIndex`**, **`isMuted`**, and a **`page`** counter for the *next* API page (often start at **`2`** if `page.tsx` already loaded page **`1`**).

```tsx
const [videos, setVideos] = useState<VideoRes[]>(videoRes.videos);
const [currentIndex, setCurrentIndex] = useState(0);
const [isMuted, setIsMuted] = useState(true);
const [page, setPage] = useState(2);
```

### 3. Split a `VideoFrame` child (props for one clip)

**Starter issue:** One big component mixes “feed logic” and “one video UI,” which gets hard to read once observers and pagination appear.

**Change:** Add a **`VideoFrame`** (or similarly named) component that receives **`videoURL`**, **`isMuted`**, **`toggleMute`**, and **`isActive`**. The feed decides **which** item is active; the frame handles **how** it plays.

```tsx
export interface VideoProps {
  videoURL: string;
  isMuted: boolean;
  toggleMute: () => void;
  isActive: boolean;
}

const VideoFrame = ({ videoProps }: { videoProps: VideoProps }) => {
  const { videoURL, isMuted, toggleMute, isActive } = videoProps;
  // video ref, overlay, mute button, etc.
};
```

### 4. Drive playback with `useEffect` + `isActive`

**Starter issue:** Nothing ties “which card is on screen” to **`play()`** / **`pause()`**, so TikTok-style autoplay does not happen.

**Change:** When **`isActive`** is true, set **`currentTime = 0`**, call **`play()`** (use **`.catch`** for autoplay restrictions). When false, **`pause()`**. Depend on **`isActive`** and **`videoURL`**.

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

Also add **`loop`**, **`muted={isMuted}`**, and **`playsInline`** on **`<video>`** for mobile-friendly behavior.

### 5. Finish tap-to-play: both branches + short overlay

**Starter issue:** `togglePlay` only handles the paused case and never calls **`play()`** / **`pause()`**, so the icon and the video get out of sync.

**Change:** On click, if paused → **`play()`** and flash the play icon; if playing → **`pause()`** and flash pause. Clear the overlay after a short **`setTimeout`** (for example **600ms**).

```tsx
const togglePlay = (e: React.MouseEvent<HTMLDivElement>) => {
  e.stopPropagation();
  if (!videoRef.current) return;
  if (videoRef.current.paused) {
    setPaused({ type: false, id: Date.now() });
    videoRef.current.play().catch((err) => console.error("Play failed:", err));
  } else {
    videoRef.current.pause();
    setPaused({ type: true, id: Date.now() });
  }
  setTimeout(() => setPaused(null), 600);
};
```

### 6. Vertical scroll container + snap points + `data-index`

**Starter issue:** A single full-height video has no list layout, so users cannot scroll between clips.

**Change:** Outer **`div`** with **`ref={containerRef}`**, **`overflow-y-scroll`**, **`snap-y snap-mandatory`**, and full viewport height. Each item is **`h-screen`**, **`snap-start`**, and **`data-index={index}`** so the observer can read which slide is active.

```tsx
<div
  ref={containerRef}
  className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black text-white"
>
  {videos.map((video, index) => (
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
          isActive: index === currentIndex,
        }}
      />
    </div>
  ))}
</div>
```

### 7. `IntersectionObserver` to set `currentIndex`

**Starter issue:** Without visibility detection, **`isActive`** never updates as the user scrolls.

**Change:** **`useRef`** for the scroll root, **`useCallback`** for the observer callback, **`useEffect`** to **`observe`** every **`[data-index]`** child when **`videos`** changes. Use **`root: containerRef.current`** and a **`threshold`** (for example **`0.6`**) so “mostly visible” means active.

```tsx
const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const idx = Number(entry.target.getAttribute("data-index"));
      setCurrentIndex(idx);
    }
  });
}, []);

useEffect(() => {
  const observer = new IntersectionObserver(observerCallback, {
    root: containerRef.current,
    threshold: 0.6,
  });
  const items = containerRef.current?.querySelectorAll("[data-index]");
  items?.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}, [videos, observerCallback]);
```

### 8. Load more videos near the end (client → server helper)

**Starter issue:** The feed only ever shows the first batch from `page.tsx`.

**Change:** Import **`getVideosByQuery`** from **`@/lib/getVideos`**. When **`videos.length - currentIndex - 1 <= 2`**, fetch the next **`page`**, **dedupe** by **`id`**, append, then increment **`page`**. Use **`fetchingRef`** so two overlapping effects do not double-fetch.

```tsx
import { getVideosByQuery } from "@/lib/getVideos";

const fetchingRef = useRef(false);

useEffect(() => {
  const remaining = videos.length - currentIndex - 1;
  if (remaining <= 2 && !fetchingRef.current) {
    fetchingRef.current = true;
    getVideosByQuery("nature", page, 5)
      .then((data) => {
        if (data?.videos.length) {
          setVideos((prev) => {
            const seen = new Set(prev.map((v) => v.id));
            const next = data.videos.filter((v) => !seen.has(v.id));
            return [...prev, ...next];
          });
          setPage((p) => p + 1);
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

### 9. Mute toggle UI (optional but matches the full workshop app)

**Starter issue:** No way to unmute; browsers often require user interaction before audio.

**Change:** A small **`button`** that calls **`toggleMute`** and swaps **`/mute.png`** vs **`/unmute.png`**. Keep **`pointer-events`** sensible so overlays do not block scrolling.

**Why for Workshop 1:** Students practice **`useState`**, **`useEffect`**, **`useRef`**, **`useCallback`**, list rendering, and the browser **`IntersectionObserver`** API—exactly the skills behind a TikTok-style feed—while reusing **`getVideosByQuery`** for pagination without exposing the API key on the client bundle.


