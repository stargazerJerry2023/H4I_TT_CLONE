export type User = {
    id: number,
    name: string,
    url: string
}
export type VideoRes={
    id: number,
    width: number,
    height: number,
    url: string,
    duration?: number,
    size: number,
    tags: string[],
    images: string[],
    user: User,
}
export type VideoResponse = {
    page: number,
    per_page: number,
    videos: VideoRes[]
}