import { Inngest } from 'inngest';

export const inngest = new Inngest({ name: 'pugtube', eventKey: process.env.INNGEST_EVENT_KEY });
