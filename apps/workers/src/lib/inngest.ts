import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'aso-workers',
  eventKey: process.env.INNGEST_EVENT_KEY,
})
