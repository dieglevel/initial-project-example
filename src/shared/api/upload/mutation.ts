import type { ApiBaseResponse } from '../baseResponse'
import { useMutationPost } from '@/shared/lib/mutation/useMutation'

export interface UploadRawResponse {}

export const useMutationUpload = () => {
  const mUploadRaw = useMutationPost<
    ApiBaseResponse<string>,
    FormData,
    '/admin/products/upload-raw'
  >({
    endPoint: '/admin/products/upload-raw',
    queryKey: ['uploadRaw'],
  })

  return { mUploadRaw }
}
