import log from '@/utils/logger'
import { stripe } from '@/utils/stripe'

export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

export const postData = async ({
  url,
  data,
}: {
  url: string
  data?: { price: any }
}) => {
  log.debug('posting,', { url, data })

  const res: Response = await fetch(url, {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    log.error('Error in postData', { url, data, res })

    throw Error(res.statusText)
  }

  return res.json()
}

export const toDateTime = (secs: number) => {
  const t = new Date('1970-01-01T00:30:00Z') // Unix epoch start.
  t.setSeconds(secs)
  return t
}

export const createOrRetrieveCustomer = async (
  email: string,
  clerkId: string
) => {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0]!
  } else {
    return await stripe.customers.create({
      email,
      metadata: {
        clerkId,
      },
    })
  }
}

export const retrieveCustomerSubscription = async ({
  customerId,
  subscriptionId,
  email,
}: {
  customerId?: string
  subscriptionId?: string
  email?: string
}) => {
  if (subscriptionId) return await stripe.subscriptions.retrieve(subscriptionId)

  if (customerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    })
    if (subscriptions.data.length > 0) return subscriptions.data[0]!
  }

  if (email) {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    })
    if (customers.data.length > 0) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0]!.id,
        limit: 1,
      })
      if (subscriptions.data.length > 0) return subscriptions.data[0]!
    } else {
      return null
    }
  }

  if (!customerId && !subscriptionId && !email) {
    throw Error('Must provide customerId, subscriptionId, or email')
  }
}
