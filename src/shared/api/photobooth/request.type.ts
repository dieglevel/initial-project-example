export interface CreatePhotoboothRequest {
  data: string
  image?: File
}

export const createPhotoboothFormData = (
  payload: CreatePhotoboothRequest,
): FormData => {
  const formData = new FormData()

  formData.append('data', payload.data)
  payload.image && formData.append('image', payload.image)

  return formData
}
