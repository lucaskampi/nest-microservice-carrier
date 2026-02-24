export interface AddressDTO {
  street: string
  number: number
  state: string
}

export interface PurchaseItemDTO {
  id: number
  amount: number
}

export interface CreatePurchaseDTO {
  items: PurchaseItemDTO[]
  address: AddressDTO
}

export interface InfoProviderDTO {
  address: string
}

export interface InfoOrderDTO {
  id: number
  preparationTime: number
}

export interface VoucherDTO {
  number: number
  deliveryForecast: Date
}

export interface InfoDeliveryDTO {
  orderId: number
  deliveryDate: Date
  originAddress: string
  destinationAddress: string
}

export interface PurchaseResponseDTO {
  id: number
  orderId: number | null
  preparationTime: number | null
  destinationAddress: string
  deliveryDate: Date | null
  voucher: number | null
  state: string
  createdAt: Date
  updatedAt: Date
}

export interface UserDTO {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
}

export interface AuthResponseDTO {
  access_token: string
  user: UserDTO
}
