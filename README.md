![](assets/logo.png)

# Hermod

> MQTT message client to, you know, send messages

## Summary

- [Hermod](#hermod)
  - [Summary](#summary)
  - [Usage examples](#usage-examples)
    - [Instalation:](#instalation)
    - [Posting a message](#posting-a-message)
    - [Listening to a queue](#listening-to-a-queue)
    - [Switching queues](#switching-queues)
    - [Acking, Nacking and rejecting messages](#acking-nacking-and-rejecting-messages)
  - [Config object](#config-object)
  - [API](#api)
    - [postMessage](#postmessage)
    - [listenToQueue](#listentoqueue)
    - [changeQueue](#changequeue)
    - [ackMessage](#ackmessage)
    - [nackMessage](#nackmessage)
    - [rejectMessage](#rejectmessage)

## Usage examples

### Instalation:

```sh
npm i @nxcd/hermod
```

### Posting a message

```js
const { MessageClient: Hermod } = require('hermod')
const config = {
  queueHostname: 'localhost'
}
const messenger = new Hermod(config)
messenger.postMessage('message', 'queueName') // Returns a promise
```

### Listening to a queue

```js
const { MessageClient: Hermod } = require('hermod')
const config = {
  queueHostname: 'localhost'
}
const messenger = new Hermod(config)

function handler (message) {
  console.log(message.contents.toString())
}

// Will call `handler` everytime a message arrives
messenger.listenToQueue('queueName', handler)
```

### Switching queues

```js
const { MessageClient: Hermod } = require('hermod')
const config = {
  queueHostname: 'localhost'
}

function handler (message) {
  console.log(message.contents.toString())
}

const messenger = new Hermod(config)
messenger.listenToQueue('queueName', handler)
messenger.changeQueue('anotherQueue').then((queueObject) => /* ... */)
```

### Acking, Nacking and rejecting messages

**Acking**

```js
const { MessageClient: Hermod } = require('hermod')
const config = {
  queueHostname: 'localhost'
}
const messenger = new Hermod(config)

function handler (message) {
  console.log(message.contents.toString())
  messenger.ackMessage(message)
}

messenger.listenToQueue('queueName', handler)
```

**Nacking**

```js
const { MessageClient: Hermod } = require('hermod')
const config = {
  queueHostname: 'localhost'
}
const messenger = new Hermod(config)

function handler (message) {
  console.log(message.contents.toString())
  messenger.nackMessage(message)
}

messenger.listenToQueue('queueName', handler)
```
**Rejecting**

```js
const { MessageClient: Hermod } = require('hermod')
const config = {
  queueHostname: 'localhost'
}
const messenger = new Hermod(config)

function handler (message) {
  console.log(message.contents.toString())
  messenger.rejectMessage(message)
}

messenger.listenToQueue('queueName', handler)
```

## Config object

Hermod takes a config object like the following:

```ts
{
  queueHostname: string
  queueName?: string
  queueProtocol?: 'amqp' | 'amqps'
  queuePort?: number
  username?: string
  password?: string
  maxConnectionAttemps?: number
  connectionRetryInterval?: number
  durable?: boolean
  noAck?: boolean
  persistent?: boolean
}
```

- **queueHostname** (*required*): The broker hostname, without the protocol
- **queueName**: Default queue to be used when posting messages, if this is null you'll have to pass the name directly to the function, defaults to `undefined`
- **queueProtocol**: `amqp` or `amqps` depending on your implementation, defaults to `amqp`
- **queuePort**: Broker port, defaults to `5672`, which is rabbitMQ's default port
- **username**: Username in case of authentication. If not, leave it blank
- **password**: Password in case of authentication. If not, leave it blank
- **maxConnectionAttemps**: Max connection attemps that will be made in case of error on first connection, defaults to `5`
- **connectionRetryInternal**: The interval between connection attemps (in ms), this number will be multiplied by the number of attempts made in order to create a crescent interval, defaults to `1000`
- **durable**: Defines if a queue should be durable, defaults to `true`
- **noAck**: Defines if a consuming channel should auto acknowledge the messages it receives, defaults to `false`
- **persistent**: Defines if a message will be persistently saved, defaults to `true`

> Channel, queue and message configurations such as `persistent`, `durable` and `noAck` can be passed on directly to the function, if not the default config will have the claim

## API

### postMessage

```ts
postMessage (message: any, queueName?: string, persistent?: boolean): Promise<boolean>
```

**Description:** Posts `message` to `queueName`. If `queueName` is `null` or `undefined`, the `config.queueName` will be used

**Parameters:**

- `message` (*required*): Message content to be posted, it needs to be something which can be transformed into a Buffer (with `Buffer.from`)
- `queueName`: Optional queueName to override the queue from the default configuration (if any)
- `persistent`: Setting it will override the `config.persistent` value

**Returns:** Boolean value indicating succes of operation

### listenToQueue

```ts
listenToQueue (queueName: string, handler: MessageHandler, noAck?: boolean): Promise<{ consumerTag: string }>
```

**Description:** Start consuming `queueName`. Everytime a new message arrives, `handler` will be called

**Parameters:**
- `queueName` (*required*): Queue name to be listened. This method does **not** read the default `config.queueName`
- `handler` (*required*): Function which will handle the message. Must have a signature like `(message) => any`
- `noAck`: This will override `config.noAck` value for this specific consumer

**Returns:** Promise with the new consumer tag

### changeQueue

```ts
changeQueue (queueName: string, durable?: boolean): Promise<{ queue: string, messageCount: number, consumerCount: number }>
```

**Description:** Will assert a new queue on the channel

**Parameters:**
- `queueName` (*required*): Name of the queue to be asserted
- `durable`: Will override `config.durable` value for this specific queue

**Returns:**

### ackMessage

```ts
ackMessage (message: ConsumeMessage, allUpToThis: boolean = false): void
```

**Description:** Acknowledges a message

**Parameters:**
- `message` (*required*): The received message object
- `allUpToThis`: Will acknowledge all messages before the one being sent as well

### nackMessage

```ts
nackMessage (message: ConsumeMessage, allUpToThis: boolean = false, requeue: boolean = true): void
```

**Description:** Nacks a message, requeuing it by default

**Parameters:**
- `message` (*required*): The received message object
- `allUpToThis`: Will not acknowledge all messages before the one being sent as well
- `requeue`: Will also requeue the message

### rejectMessage

```ts
rejectMessage (message: ConsumeMessage, requeue: boolean = false): void
```

**Description:** Rejects a message, not requeuing it by default

**Parameters:**
- `message` (*required*): The received message object
- `requeue`: Will also requeue the message

