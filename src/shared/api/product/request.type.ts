export interface CreateProductRequest {
  product: string
  thumbnail?: File
  productImages?: Array<File>
}

export const createProductFormData = (
  payload: CreateProductRequest,
): FormData => {
  const formData = new FormData()

  formData.append('product', payload.product)
  if (payload.thumbnail) {
    formData.append('thumbnail', payload.thumbnail)
  }
  if (payload.productImages) {
    payload.productImages.forEach((image) => {
      formData.append('productImages', image)
    })
  }

  return formData
}

export interface UpdateMainInformationProductRequest {
  data: string
  thumbnail?: File
  newImages?: Array<File>
}

export const updateMainInformationProductFormData = (
  payload: UpdateMainInformationProductRequest,
): FormData => {
  const formData = new FormData()
  formData.append('data ', payload.data)
  if (payload.thumbnail) {
    formData.append('thumbnail', payload.thumbnail)
  }
  if (payload.newImages) {
    payload.newImages.forEach((image) => {
      formData.append('newImages', image)
    })
  }
  return formData
}

export interface UpdateConfigProductRequest {
  data: string
  optionImages?: Array<File>
}

export const updateConfigProductFormData = (
  payload: UpdateConfigProductRequest,
): FormData => {
  const formData = new FormData()
  formData.append('data', payload.data)
  if (payload.optionImages) {
    payload.optionImages.forEach((image) => {
      formData.append('optionImages', image)
    })
  }
  return formData
}
