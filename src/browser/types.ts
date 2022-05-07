export type Psalm = {
  type: 'profile'
  profile: Profile
} | {
  type: 'trust'
  trust: Trust
}

export interface ProfileFormData {
  nickname: string
  about: string
  tags: string[]

  //visibility: 'trusted' | 'trustedOfTrusted' | 'all'
}

export type Profile = ProfileFormData & {
  publicKey: string
  timestamp: number
}

export interface Trust {
  from: string
  to: string
  value: boolean
  timestamp: number
}