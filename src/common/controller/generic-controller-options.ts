export interface GenericControllerOptions<T, CreateDto, UpdateDto> {
  entity: any;
  createDto: any;
  updateDto: any;
  responses: {
    getAll: any;
    create: any;
    paging: any;
    update: any;
    delete: any;
  };
}
