import CustomTable from "@/shared/components/CustomTable";
import { Flex } from "antd";
import type { ColumnsType } from "antd/es/table";

interface data {
  name: string;
  date: string;
  items: number[];
}

const list: data[] = [
  {
    name: "example1",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example2",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example3",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
  {
    name: "example",
    date: "2024-01-01",
    items: [1, 2, 3, 4, 5],
  },
];

const column: ColumnsType<data> = [
  {
    title: "Tên",
    dataIndex: "name",
    key: "name",
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: "Ngày tạo",
    dataIndex: "date",
    key: "date",
  },
  {
    title: "Số mục",
    dataIndex: "items",
    key: "items",
    render: (items: number[]) => items.length,
  },
];

export default function HomePages() {
  return (
    <Flex
      style={{
        width: "100%",
        flexDirection: "column",
        gap: 16,
        padding: 16,
      }}
    >
      <CustomTable
        dataSource={list}
        columns={column}
        bordered
        pagination={{ showSizeChanger: true }}
      />
    </Flex>
  );
}
