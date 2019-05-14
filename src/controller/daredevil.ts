import { Connection, Channel, Replies, ConsumeMessage } from 'amqplib'
import { IConfig } from '../structures/IConfig'
import rabbitMQ from '../data/connections/rabbitmq'
import { ParameterError } from './errors/ParameterError'

type LocalConfig = {
  hostname: string
  port: number
  protocol: "amqp" | "amqps"
  username?: string
  password?: string
  queueName: string
  durable: boolean
  noAck: boolean
  persistent: boolean
  maxAttemps: number
  retryInterval: number
}

type MessageHandler = (message: ConsumeMessage | null) => any

export class Daredevil {

  private connection: Connection
  private channel: Channel
  private readonly config: LocalConfig
  private queue: Replies.AssertQueue

  constructor (config: IConfig) {
    this.config = this._makeConfig(config)
  }

  async connect (): Promise<Connection> {
    if (this.connection) return this.connection

    this.connection = await rabbitMQ.createConnection({
      hostname: this.config.hostname,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      protocol: this.config.protocol,
      connectionRetryInterval: this.config.retryInterval,
      maximumConnectionAttempts: this.config.maxAttemps
    })
    return this.connection
  }

  private async _createChannel () {
    if (this.channel) return this.channel
    this.channel = await this.connection.createChannel()
    return this.channel
  }

  async assertQueue (queueName: string) {
    this._createChannel()
    if (this.queue) return this.queue
    this.queue = await this.channel.assertQueue(queueName, { durable: this.config.durable })
    return this.queue
  }

  async postMessage (message: any) {
    this._createChannel()
    this.assertQueue(this.config.queueName)
    return this.channel.sendToQueue(this.config.queueName, Buffer.from(message))
  }

  async listenToQueue (queueName: string, handler: MessageHandler) {
    this._createChannel()
    return this.channel.consume(queueName, handler, { noAck: this.config.noAck })
  }

  private _makeConfig (config: IConfig): LocalConfig {
    if (!config.queueHostname || !config.queueName) throw new ParameterError(config)
    return {
      hostname: config.queueHostname,
      port: config.queuePort || 5672,
      protocol: config.queueProtocol || 'amqp',
      username: config.username,
      password: config.password,
      queueName: config.queueName,
      durable: config.durable || true,
      persistent: config.persistent || true,
      maxAttemps: config.maxConnectionAttemps || 5,
      retryInterval: config.connectionRetryInterval || 1500,
      noAck: config.noAck || false
    }
  }
}
