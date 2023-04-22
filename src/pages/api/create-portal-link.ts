import { NextApiHandler } from 'next'

import { stripe } from '@/utils/stripe'
import { createOrRetrieveCustomer, getURL } from '@/utils/helpers'
import status from 'http-status'
import { getAuth } from '@clerk/nextjs/server'

const CreatePortalLink: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { user } = getAuth(req)

      if (!user) throw Error('Could not get user')

      const { id: customer } = await createOrRetrieveCustomer(
        user!.emailAddresses[0]!.emailAddress || '',
        user.id || ''
      )

      if (!customer) throw Error('Could not get customer')

      const { url } = await stripe.billingPortal.sessions.create({
        customer,
        return_url: `${getURL()}/account`,
      })

      return res.status(status.OK).json({ url })
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

export default CreatePortalLink
