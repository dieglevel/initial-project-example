// <Entity><Field>Enum
export enum ExampleStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

interface EXAMPLE_STATUS_UI_INTERFACE {
  label: string
  color: string
}

export const EXAMPLE_STATUS_UI: Record<
  ExampleStatusEnum,
  EXAMPLE_STATUS_UI_INTERFACE
> = {
  [ExampleStatusEnum.ACTIVE]: {
    color: 'green',
    label: 'Active',
  },
  [ExampleStatusEnum.INACTIVE]: {
    color: 'red',
    label: 'Inactive',
  },
  [ExampleStatusEnum.PENDING]: {
    color: 'yellow',
    label: 'Pending',
  },
}
