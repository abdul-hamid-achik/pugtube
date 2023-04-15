import { serve } from "inngest/next";
import Transloadit from "transloadit";
import { env } from "@/env.mjs";
import { inngest } from "@/utils/inngest";

const assembly = inngest.createFunction(
  { name: "Process Upload" },
  { event: "upload:created" },
  async ({ event, step }) => {
    const { id: key } = event.data;
    const transloadit = new Transloadit({
      authKey: env.TRANSLOADIT_KEY,
      authSecret: env.TRANSLOADIT_SECRET,
    });
    const assembly = await transloadit.createAssembly({
      params: {
        template_id: env.TRANSLOADIT_TEMPLATE_ID,
        notify_url:
          process.env.NODE_ENV === "production"
            ? "https://pugtube.dev/api/transloadit"
            : "https://tunnel.pugtube.dev/api/transloadit",
        steps: {
          import: {
            path: key,
          },
        },
      },
    });
    return {
      assembly,
    };
  }
);
// Create an API that hosts zero functions
export default serve(inngest, [assembly]);
