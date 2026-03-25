export interface Photobooth {
  id: number
  name: string
  previewImage: string
  slotsCount: number
  slots: Array<{
    id: number
    x: number
    y: number
    width: number
    height: number
  }>
}
