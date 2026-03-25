import { useMemo } from 'react'

interface usePaginationProps {
  totalCount: number
  pageSize: number
  siblingCount?: number
  currentPage: number
}

const range = (start: number, end: number) => {
  const length = end - start + 1
  return Array.from({ length }, (_, idx) => idx + start)
}

const usePagination = ({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage,
}: usePaginationProps) => {
  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(totalCount / pageSize)
    const totalPageNumbers = siblingCount + 5

    if (totalPageCount < totalPageNumbers) return range(1, totalPageCount)

    const leftSiblingIndex = Math.max(currentPage, 1)
    const rightSiblingIndex = Math.min(currentPage, totalPageCount)

    const shouldShowLeftDots = leftSiblingIndex >= 2
    const shouldShowRightDots = rightSiblingIndex <= totalPageCount - 1

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = totalPageNumbers
      if (leftItemCount >= totalPageCount) return [...range(1, totalPageCount)]
      const leftRange = range(1, leftItemCount)

      return [...leftRange, '&nextRight', '&lastRight']
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = totalPageNumbers
      if (rightItemCount >= totalPageCount) return [...range(1, totalPageCount)]
      const rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount,
      )

      return ['&lastLeft', '&nextLeft', ...rightRange]
    }

    const showBothDots = shouldShowLeftDots && shouldShowRightDots
    const showBothDotsException = !shouldShowLeftDots && !shouldShowRightDots
    if (showBothDots || showBothDotsException) {
      const countInOneRange = totalPageNumbers
      const diffPageCurrent = currentPage % countInOneRange

      let leftIndex = Math.max(currentPage - diffPageCurrent + 1, 1)
      let rightIndex = Math.min(
        currentPage + (countInOneRange - diffPageCurrent),
        totalPageCount,
      )

      if (diffPageCurrent === 0) {
        leftIndex = Math.max(currentPage - countInOneRange + 1, 1)
        rightIndex = Math.min(currentPage + 1, totalPageCount)
      }

      const currentRange = rightIndex - leftIndex + 1
      const isNotFullRange = currentRange !== countInOneRange
      if (isNotFullRange) {
        leftIndex -= countInOneRange - currentRange
      }

      const middleRange = range(leftIndex, rightIndex)
      return [
        '&lastLeft',
        '&nextLeft',
        ...middleRange,
        '&nextRight',
        '&lastRight',
      ]
    }
  }, [totalCount, pageSize, siblingCount, currentPage])

  return paginationRange as Array<string>
}

export default usePagination
