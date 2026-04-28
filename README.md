# TikTok Clone Workshop Template

Workshop notes for moving from the **starter** feed (`component/Video.tsx`) to the **completed** feed (same logic as root `Video.tsx`).

## Where the “completed” code lives

- **Reference copy:** `Video.tsx` in the **project root** (full solution for comparison).
- **What students should ship:** Copy that solution into **`component/Video.tsx`** so imports stay `import … from "@/component/Video"`. You can delete or ignore the root `Video.tsx` after merging to avoid two sources of truth.

## Fix `app/page.tsx` after the merge

The completed module **default-exports `VideoFeed`**, not `VideoFrame`.

**Change:**

```tsx
import VideoFeed from "@/component/Video";
// ...
<VideoFeed videoRes={data} />
```

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
- If **`remaining <= 2`** and not **`fetchingRef.current`**, call **`getVideosByQuery("nature", page, 5)`** (align query with `page.tsx` if you use `"space"` everywhere)
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


