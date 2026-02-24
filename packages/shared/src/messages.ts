import { AddressDTO, PurchaseItemDTO } from './interfaces'

export const RABBITMQ_QUEUES = {
  PURCHASE_CREATED: 'purchase.created',
  ORDER_COMPLETED: 'order.completed',
  DELIVERY_COMPLETED: 'delivery.completed',
  PURCHASE_COMPLETED: 'purchase.completed',
  PURCHASE_FAILED: 'purchase.failed',
} as const

export interface PurchaseCreatedMessage {
  purchaseId: number
  items: PurchaseItemDTO[]
  address: AddressDTO
  state: string
}

export interface OrderCompletedMessage {
  purchaseId: number
  orderId: number
  preparationTime: number
  providerAddress: string
}

export interface DeliveryCompletedMessage {
  purchaseId: number
  orderId: number
  voucherNumber: number
  deliveryForecast: Date
}

export interface PurchaseCompletedMessage {
  purchaseId: number
  state: string
  orderId: number
  voucher: number
  deliveryDate: Date
  preparationTime: number
}

export interface PurchaseFailedMessage {
  purchaseId: number
  error: string
  lastKnownState: string
}
