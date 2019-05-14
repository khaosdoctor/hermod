export interface IConfig {
  queueHostname: string
  queueName: string
  queueProtocol?: 'amqp' | 'amqps'
  queuePort?: number
  username?: string
  password?: string
  maxConnectionAttemps?: number
  connectionRetryInterval?: number
  durable: boolean
  noAck?: boolean
  persistent: boolean
}
