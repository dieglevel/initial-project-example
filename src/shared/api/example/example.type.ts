import type { ExampleStatusEnum } from './example.enum'

export interface Social {
  twitter: string
  github: string
}

export interface Profile {
  avatar: string
  bio: string
  social: Social
}

export interface PostsItem {
  id: number
  title: string
  tags: Array<string>
}

export interface Example {
  id: number
  name: string
  email: string
  isActive: boolean
  roles: Array<string>
  profile: Profile
  posts: Array<PostsItem>
  metadata: null
  status: ExampleStatusEnum
}
