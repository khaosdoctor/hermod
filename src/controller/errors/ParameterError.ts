import { IConfig } from '../../structures/IConfig';

export class ParameterError extends Error {
  constructor (config: IConfig) {
    let message = 'Hostname is required'
    if (config.queueHostname && !config.queueName) message = 'Queue name is required'
    super(message)
  }
}
