import { createFileRoute } from '@tanstack/react-router'
import { useGetListProduct } from '@/shared/api/product/useGetListProduct'

export const Route = createFileRoute('/(protected)/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = useGetListProduct({})
  const rawData = data?.data.content || []
  const products = Array.isArray(rawData) ? rawData : []

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.length === 0 && <li>No products</li>}
        {products.map((item, index) => (
          <li key={item.id}>
            {index + 1}. {item.id} - {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
