import { Button, Flex, Table } from "antd";
import type {
  ColumnType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";

export interface CustomTableProps<T> extends TableProps<T> {
  dataSource: T[];
  columns: ColumnType<T>[];
  pagination?: TablePaginationConfig;
}

export default function CustomTable<T>({
  dataSource,
  columns,
  pagination,
  ...props
}: CustomTableProps<T>) {
  return (
    <>
      <Flex justify="end" gap={16}>
        <Button>Thêm mới</Button>
        <Button>Cập nhật</Button>
      </Flex>
      <Table<T>
        style={{ width: "100%" }}
        dataSource={dataSource}
        columns={columns}
        pagination={pagination || false}
        {...props}
      />
    </>
  );
}
