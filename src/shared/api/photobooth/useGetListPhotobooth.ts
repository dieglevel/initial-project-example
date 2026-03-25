import type { ApiBaseResponse } from '../base-response'
import type { Photobooth } from './photobooth.type'
import { useQueryGet } from '@/shared/lib/mutation/useQueryGet'

export interface GetPhotoboothThemeResponse extends Photobooth {}

export interface GetListPhotoboothParams {}

const normalizePreviewImageUrl = (previewImage: string) =>
  previewImage.replace(/\.ai(?=($|[?#]))/i, '.png')

export const useGetListPhotobooth = <
  TSearch extends Record<string, unknown> = {},
>() =>
  useQueryGet<
    ApiBaseResponse<Array<GetPhotoboothThemeResponse>>,
    '/admin/photobooth-themes',
    TSearch
  >({
    endPoint: '/admin/photobooth-themes',
    queryKey: ['admin-photobooth-themes'],
    options: {
      select(data) {
        return {
          ...data,
          data: data.data.map((theme) => ({
            ...theme,
            previewImage: normalizePreviewImageUrl(theme.previewImage),
          })),
        }
      },
    },
  })
