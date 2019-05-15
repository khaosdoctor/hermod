import { IConfig } from '../structures/IConfig'
import rabbitMQ from '../data/connections/rabbitmq'
import { ChannelError } from './errors/ChannelError'
import { ParameterError } from './errors/ParameterError'
import { Connection, Channel, Replies, ConsumeMessage } from 'amqplib'

type LocalConfig = {
  hostname: string
  port: number
  protocol: "amqp" | "amqps"
  username?: string
  password?: string
  queueName?: string
  durable: boolean
  noAck: boolean
  persistent: boolean
  maxAttemps: number
  retryInterval: number
}

type MessageHandler = (message: ConsumeMessage | null) => any

export class MessageClient {

  private connection: Connection
  private channel: Channel
  private readonly config: LocalConfig
  private queue: Replies.AssertQueue

  constructor (config: IConfig) {
    this.config = this._makeConfig(config)
  }

  async postMessage (message: any, queueName?: string, persistent?: boolean) {
    await this._connect()
    const queue = queueName || this.config.queueName
    if (!queue) throw new ParameterError('QueueName is required to send a message')
    await this._createChannel()
    await this.changeQueue(queue)
    return this.channel.sendToQueue(queue, Buffer.from(message), { persistent: persistent || this.config.persistent })
  }

  async listenToQueue (queueName: string, handler: MessageHandler, noAck?: boolean) {
    await this._connect()
    await this._createChannel()
    await this.changeQueue(queueName)
    return this.channel.consume(queueName, handler, { noAck: noAck || this.config.noAck })
  }

  async changeQueue (queueName: string, durable?: boolean) {
    await this._connect()
    await this._createChannel()
    this.queue = await this.channel.assertQueue(queueName, { durable: durable || this.config.durable })
    return this.queue
  }

  ackMessage (message: ConsumeMessage, allUpToThis: boolean = false) {
    if (!this.channel) throw new ChannelError('There is no channel to ack this message')
    if (this.config.noAck) throw new ParameterError('You cannot ack a message when noAck is set to `true`')
    return this.channel.ack(message, allUpToThis)
  }

  nackMessage (message: ConsumeMessage, allUpToThis: boolean = false, requeue: boolean = true) {
    if (!this.channel) throw new ChannelError('There is no channel to nack this message')
    if (this.config.noAck) throw new ParameterError('You cannot nack a message when noAck is set to `true`')
    return this.channel.nack(message, allUpToThis, requeue)
  }

  rejectMessage (message: ConsumeMessage, requeue: boolean = false) {
    if (!this.channel) throw new ChannelError('There is no channel to reject this message')
    if (this.config.noAck) throw new ParameterError('You cannot reject a message when noAck is set to `true`')
    return this.channel.reject(message, requeue)
  }

  private async _connect (): Promise<Connection> {
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

  private _makeConfig (config: IConfig): LocalConfig {
    if (!config.queueHostname) throw new ParameterError('Hostname is required')
    return {
      hostname: config.queueHostname,
      port: config.queuePort || 5672,
      protocol: config.queueProtocol || 'amqp',
      username: config.username,
      password: config.password,
      queueName: config.queueName,
      durable: config.durable === null || config.durable === undefined ? true : config.durable,
      persistent: config.persistent === null || config.persistent === undefined ? true : config.persistent,
      maxAttemps: config.maxConnectionAttemps || 5,
      retryInterval: config.connectionRetryInterval || 1500,
      noAck: config.noAck === null || config.noAck === undefined ? false : config.noAck,
    }
  }
}