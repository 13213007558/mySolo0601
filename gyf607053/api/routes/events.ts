import { Router, type Request, type Response } from 'express'
import { db } from '../data/store.js'

const router = Router()

router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (type: string, data: unknown) => {
    res.write(`event: ${type}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  send('hello', { message: 'connected' })
  send('snapshot', {
    records: db.getRecords(),
    items: db.getItems(),
    babies: db.getBabies(),
  })

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 15000)

  const unsubscribe = db.subscribe(() => {
    send('update', {
      records: db.getRecords(),
      items: db.getItems(),
      unresolved: db.getUnresolvedExceptionRecords(),
    })
  })

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
})

export default router
