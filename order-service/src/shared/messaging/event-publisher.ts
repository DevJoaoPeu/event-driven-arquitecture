export abstract class EventPublisher {
  abstract publish(routingKey: string, data: unknown): void;
}
