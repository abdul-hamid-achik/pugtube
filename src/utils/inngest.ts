import { Inngest } from "inngest";

type Events = {
  "upload:created": {
    name: "upload:created";
    data: {
      id: string;
    };
  };
};
export const inngest = new Inngest<Events>({ name: "Pugtube" });
