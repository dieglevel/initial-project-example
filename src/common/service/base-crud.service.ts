/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NotFoundException } from "@nestjs/common";
import {
  DeepPartial,
  FindOptionsWhere,
  Repository,
  type SelectQueryBuilder,
} from "typeorm";

export abstract class BaseCrudService<T extends { id: number }> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: any): Promise<T[]> {
    return this.repository.find({
      ...options,
      order: {
        createdAt: "DESC",
      },
    });
  }

  async findOne(id: number, options?: any): Promise<T> {
    const entity = await this.repository.findOne({
      where: {
        id,
      } as FindOptionsWhere<T>,
      ...options,
    });

    if (!entity) {
      throw new NotFoundException(`${this.repository.metadata.name} not found`);
    }

    return entity;
  }

  async create(
    data: DeepPartial<T>,
    relations?: Record<string, number>,
  ): Promise<T> {
    const relationData = Object.entries(relations ?? {}).reduce(
      (acc, [key, id]) => {
        acc[key] = { id };
        return acc;
      },
      {},
    );

    const entity = this.repository.create({
      ...data,
      ...relationData,
    });

    return this.repository.save(entity);
  }

  async update(id: number, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);

    Object.assign(entity, data);

    return this.repository.save(entity);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`${this.repository.metadata.name} not found`);
    }

    return true;
  }

  async paging(
    pagination: any,
    options?: {
      // Cho phép truyền callback để custom các mối quan hệ join riêng của từng Entity
      relations?: (query: SelectQueryBuilder<T>) => void;
    },
  ): Promise<{
    items: T[];
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  }> {
    const aliasName = this.repository.metadata.name.toLowerCase(); // Lấy tên entity làm alias (ví dụ: "todo", "financialcategory")
    const query = this.repository.createQueryBuilder(aliasName);

    // 1. Xử lý custom Relations / Joins nếu có truyền vào
    if (options?.relations) {
      options.relations(query);
    }

    // 2. Xử lý Dynamic Search dựa trên searchFields giống hệt logic cũ của bạn
    const searchQuery = pagination?.searchFields
      ?.map((field) => {
        // Tránh lỗi SQL Injection và bảo vệ tên field theo alias chính xác
        return `${aliasName}.${field} LIKE :search`;
      })
      .join(" OR ");

    if (pagination.search && searchQuery) {
      query.andWhere(`(${searchQuery})`, { search: `%${pagination.search}%` });
    }

    // 3. Xử lý Phân trang (Tránh việc getMany rồi tự đếm, tối ưu hiệu năng)
    const take = pagination.pageSize || 10;
    const skip = (pagination.page - 1) * take;

    query.skip(skip).take(take);

    // 4. Thực thi lấy dữ liệu và đếm tổng số dòng (Tối ưu bằng getManyAndCount)
    const [items, totalItems] = await query.getManyAndCount();
    const totalPages = Math.ceil(totalItems / take);

    return {
      items,
      currentPage: pagination.page || 1,
      itemsPerPage: take,
      totalItems,
      totalPages,
    };
  }
}
