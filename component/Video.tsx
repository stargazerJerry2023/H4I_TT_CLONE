"use client";
import { getVideosByQuery } from "@/lib/getVideos";
import { VideoRes, VideoResponse } from "@/types/backend/types";
import { useCallback, useEffect, useRef, useState } from "react";

export interface VideoProps {
  videoURL: string;
  isMuted: boolean;
  toggleMute: () => void;
  isActive: boolean; // 1. ADDED: Tell the video if it is currently on screen
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
      videoRef.current.currentTime = 0; // reset the video
      videoRef.current.play().catch((error) => {
        console.error("Autoplay prevented by browser:", error);
      });
    } else {
      videoRef.current.pause(); // Pause when scrolled away
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
  // track the page number for pagination
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

      // 2. FIXED: Pass the current `page` to the API
      getVideosByQuery("nature", page, 5)
        .then((data) => {
          if (data && data.videos.length > 0) {
            setVideos((prev) => {
              const existingIds = new Set(prev.map((v) => v.id));
              const newVideos = data.videos.filter(
                (v) => !existingIds.has(v.id),
              );
              return [...prev, ...newVideos];
            });

            // 3. FIXED: Increment the page number so the NEXT fetch gets fresh videos!
            setPage((prevPage) => prevPage + 1);
          }
          fetchingRef.current = false;
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          fetchingRef.current = false;
        });
    }
    // 4. FIXED: Added `page` to dependency array so the effect knows the page changed
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
