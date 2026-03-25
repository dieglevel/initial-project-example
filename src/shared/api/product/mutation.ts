import {
  useMutationPatch,
  useMutationPost,
} from '@/shared/lib/mutation/useMutation'

export const useMutationProduct = () => {
  const mCreateProduct = useMutationPost<
    void,
    FormData,
    '/admin/products/custom',
    {
      product: string
    }
  >({
    endPoint: '/admin/products/custom',
    queryKey: ['createProduct'],
  })

  const mUpdateMainInformationProduct = useMutationPatch<
    void,
    FormData,
    '/admin/products/custom/:id',
    {
      id: string
    }
  >({
    endPoint: '/admin/products/custom/:id',
    queryKey: ['updateMainInformationProduct'],
  })

  const mUpdateConfigProduct = useMutationPatch<
    void,
    FormData,
    '/admin/products/custom/configs/:id',
    {
      id: string
    }
  >({
    endPoint: '/admin/products/custom/configs/:id',
    queryKey: ['updateConfigProduct'],
  })

  return { mCreateProduct, mUpdateMainInformationProduct, mUpdateConfigProduct }
}
