export interface CreateUploadRequest {
  file: File
}

export const createUploadFormData = (
  payload: CreateUploadRequest,
): FormData => {
  const formData = new FormData()

  formData.append('file', payload.file)
  return formData
}
