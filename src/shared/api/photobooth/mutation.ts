import {
  useMutationDelete,
  useMutationPost,
  useMutationPut,
} from '@/shared/lib/mutation/useMutation'

export const useMutationPhotobooth = () => {
  const mCreatePhotobooth = useMutationPost<
    void,
    FormData,
    '/admin/photobooth-themes'
  >({
    endPoint: '/admin/photobooth-themes',
    queryKey: ['createPhotobooth'],
  })

  const mUpdatePhotobooth = useMutationPut<
    void,
    FormData,
    '/admin/photobooth-themes/:id',
    {
      id: number
    }
  >({
    endPoint: '/admin/photobooth-themes/:id',
    queryKey: ['updatePhotobooth'],
  })

  const mDeletePhotobooth = useMutationDelete<
    void,
    undefined,
    '/admin/photobooth-themes/:id',
    {
      id: number
    }
  >({
    endPoint: '/admin/photobooth-themes/:id',
    queryKey: ['admin-photobooth-themes'],
  })

  return { mCreatePhotobooth, mUpdatePhotobooth, mDeletePhotobooth }
}
