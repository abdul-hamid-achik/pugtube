/* eslint-disable @typescript-eslint/require-await */
import { inngest } from '../../server/background'
import { serve } from "inngest/next"

const myFn = inngest.createFunction("test", "test.event", async ({ event }) => {

    return "hello!"
})

export default serve("pugtube", [myFn])