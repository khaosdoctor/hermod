import amqp, { Connection } from 'amqplib'
import { ConnectionError } from './errors/ConnectionError'

export interface IRabbitMQParams {
  hostname: string
  protocol: 'amqp' | 'amqps'
  port: number
  username?: string
  password?: string,
  maximumConnectionAttempts: number
  connectionRetryInterval: number
}

function sleep (timeout: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

export async function createConnection ({ hostname, port, username, password, protocol, maximumConnectionAttempts, connectionRetryInterval }: IRabbitMQParams, attempsMade: number = 0): Promise<Connection> {
  try {
    if (attempsMade > 0) await sleep(attempsMade * connectionRetryInterval)
    const connection = await amqp.connect({ protocol, hostname, password, port, username })
    console.log('MQTT Connected')
    return connection
  } catch (err) {
    if (attempsMade >= maximumConnectionAttempts) throw new ConnectionError(err.message)
    console.log(`Failed to connect to MQTT (${attempsMade}/${maximumConnectionAttempts}) "${err.message}" trying in ${(attempsMade * connectionRetryInterval) / 1000}s`)
    return createConnection({ hostname, port, username, password, protocol, maximumConnectionAttempts, connectionRetryInterval }, attempsMade + 1)
  }
}

export default { createConnection }
