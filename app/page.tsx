"use server";
import { getVideosByQuery } from "@/lib/getVideos";
import VideoFeed from "@/component/Video";

export default async function Home() {
  try {
    const data = await getVideosByQuery("nature", 1);
    return (
      data && (
        <div className="h-screen w-screen flex justify-center items-center ">
          <div className="flex h-[90%] w-[40%] bg-black flex justify-center items-center rounded-2xl">
            <VideoFeed videoRes={data} />
          </div>
        </div>
      )
    );
    // return data &&(
  } catch (error) {
    console.error("Error fetching videos:", error);
  }
}
