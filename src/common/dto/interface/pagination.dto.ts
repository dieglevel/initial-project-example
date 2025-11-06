export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export interface SortOption<T> {
  field: keyof T & string;
  order: SortOrder;
}

export interface PaginationQuery<T> {
  limit: number;
  page: number;
  sort: SortOption<T>[];
  search: string;
  searchFields: (keyof T & string)[];
}
