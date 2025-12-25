// This is a interface definition for pagination and sorting options in TypeScript.

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export interface SortOption<T> {
  field: keyof T & string;
  orderDirection: SortOrder;
}

export interface PaginationQuery<T> {
  page: number;
  pageSize: number;
  orderDirection?: SortOption<T>[];
  search?: string;
  searchFields?: (keyof T & string)[];
}
