<!-- Phía controller -->

@Get("paging")
@HttpCode(200)
@ApiBaseResponse(PagingTodoResponseDto)
@ApiPagination(Todo, { exclude: ["isCompleted"] })
async getPaging(@Pagination() pagination: PaginationQuery<Todo>) {
return this.todoService.pagingTodo(pagination);
}

<!-- Phía service -->

async pagingTodo(
pagination: PaginationQuery<Todo>,
): Promise<PagingTodoResponseDto>

<!-- Phía DTO -->

export class PagingTodoDto {}

export class PagingTodoResponseDto extends BasePaginatedDto {
items: Todo[];
}
