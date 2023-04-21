declare module 'formidable' {
  export const IncomingForm: any
}
//
// export interface Customer {
//   id: string /* primary key */
//   stripe_customer_id?: string
// }
//
// export interface Product {
//   id: string /* primary key */
//   active?: boolean
//   name?: string
//   description?: string
//   image?: string
//   metadata?: Stripe.Metadata
// }
//
// export interface Price {
//   id: string /* primary key */
//   product_id?: string /* foreign key to products.id */
//   active?: boolean
//   description?: string
//   unit_amount?: number
//   currency?: string
//   type?: Stripe.Price.Type
//   interval?: Stripe.Price.Recurring.Interval
//   interval_count?: number
//   trial_period_days?: number | null
//   metadata?: Stripe.Metadata
//   products?: Product
// }
//
// export interface ProductWithPrice extends Product {
//   prices?: Price[]
// }
//
// export interface PriceWithProduct extends Price {}
//
// export interface Subscription {
//   id: string /* primary key */
//   user_id: string
//   status?: Stripe.Subscription.Status
//   metadata?: Stripe.Metadata
//   price_id?: string /* foreign key to prices.id */
//   quantity?: number
//   cancel_at_period_end?: boolean
//   created: string
//   current_period_start: string
//   current_period_end: string
//   ended_at?: string
//   cancel_at?: string
//   canceled_at?: string
//   trial_start?: string
//   trial_end?: string
//   prices?: Price
// }
