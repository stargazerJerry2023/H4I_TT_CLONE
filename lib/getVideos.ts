"use server"; // for backend
import {VideoResponse, VideoRes} from"@/types/backend/types";
// get the API key from the environment variable
const API_KEY = process.env.API_KEY;
// fetch the videos from the Pexel by possible query
const getVideosByQuery: (arg1: string, arg2: number, arg3: number) => Promise<VideoResponse> = async (query: string, pages: number, per_page: number = 5) => {
    if (!API_KEY || API_KEY === "") {
        throw new Error("Missing API KEY");
    }
    const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&page=${pages}&per_page=${per_page}`, {
        headers: { Authorization: API_KEY }
    });
    if (!res.ok) {
        throw new Error("Failed to fetch videos");
    }
    const data = await res.json();
    const videos: VideoRes[] = data.videos.map((video: any) => ({
        id: video.id,
        width: video.width,
        height: video.height,
        url: video.video_files[0].link,
        duration: video.duration?video.duration:0,
        size: video.size,
        tags: video.tags || [],
        user: {
            id: video.user?.id,
            name: video.user?.name,
            url: video.user?.url
        }
    }));
    return {
        page: data.page,
        per_page: data.per_page,
        videos
    };
};
export {getVideosByQuery};