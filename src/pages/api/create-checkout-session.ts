import { NextApiHandler } from 'next'
import { stripe } from '@/utils/stripe'
import { createOrRetrieveCustomer, getURL } from '@/utils/helpers'
import { getAuth } from '@clerk/nextjs/server'
import status from 'http-status'

const CreateCheckoutSession: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    const { price, quantity = 1, metadata = {} } = req.body

    try {
      const { user } = getAuth(req)

      const { id: customer } = await createOrRetrieveCustomer(
        user!.emailAddresses[0]!.emailAddress,
        user!.id
      )

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        customer,
        line_items: [
          {
            price: price.id,
            quantity,
          },
        ],
        mode: 'subscription',
        allow_promotion_codes: true,
        subscription_data: {
          trial_from_plan: true,
          metadata,
        },
        success_url: `${getURL()}/account`,
        cancel_url: `${getURL()}/`,
      })

      return res.status(status.OK).json({ sessionId: session.id })
    } catch (err: any) {
      console.log(err)
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: {
          statusCode: status.INTERNAL_SERVER_ERROR,
          message: err.message,
        },
      })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(status.METHOD_NOT_ALLOWED).end(status['405_MESSAGE'])
  }
}

export default CreateCheckoutSession
