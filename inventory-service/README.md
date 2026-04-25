# Inventory Service

Microsservico **consumer** responsavel por reservar estoque dos pedidos publicados pelo Order Service.

## Papel na arquitetura

Consome a fila `inventory.order.created`, bindada ao topic exchange `orders.exchange` pela routing key `order.created`. Para cada pedido recebido, o servico deve reservar/descontar o estoque dos itens.

```
orders.exchange ──(order.created)──> inventory.order.created ──> Inventory Service
```

## Tecnologias

- NestJS 11
- `@nestjs/microservices` (Transport RMQ)
- `@nestjs/config` (variaveis de ambiente)

## Configuracao

Crie um arquivo `.env` na raiz do inventory-service:

```env
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin
RABBITMQ_URL=amqp://admin:admin@localhost:5672
RABBITMQ_ORDER_ROUTING_KEY=order.created
```

## Como executar

```bash
yarn install
yarn start:dev
```

O RabbitMQ deve estar no ar (use o `docker-compose.yml` do `order-service`).

## Estrutura

```
src/
├── app.module.ts                        # ConfigModule global + registro do consumer
├── main.ts                              # Bootstrap via createMicroservice (Transport.RMQ)
├── inventory/
│   ├── inventory.consumer.ts            # @EventPattern('order.created') — delega para o service
│   └── inventory.service.ts             # Caso de uso: reservar estoque do pedido
└── shared/
    ├── dtos/
    │   └── create-order.dto..ts         # Shape do evento recebido
    └── enuns/
        └── payment-method.enum.ts
```

## Consumo de eventos

O consumer e declarado como **controller** (requisito do NestJS microservices — apenas controllers sao escaneados em busca dos decoradores `@EventPattern` / `@MessagePattern`):

```ts
@Controller() // registrado em app.module.ts via `controllers: [...]`
export class InventoryConsumer {
  constructor(private readonly inventoryService: InventoryService) {}

  @EventPattern('order.created')
  inventory(order: CreateOrderDto) {
    this.inventoryService.reserve(order);
  }
}
```

Configuracao da fila (em `main.ts`):

| Opcao | Valor |
|-------|-------|
| `queue` | `inventory.order.created` |
| `exchange` | `orders.exchange` |
| `exchangeType` | `topic` |
| `routingKey` | `order.created` (via `RABBITMQ_ORDER_ROUTING_KEY`) |
| `queueOptions.durable` | `true` |
| `noAck` | `false` (ack manual pelo NestJS) |

## Scripts

```bash
yarn start:dev     # Desenvolvimento com hot reload
yarn build         # Compilacao para producao
yarn start:prod    # Execucao em producao
yarn test          # Testes unitarios
yarn lint          # Linting com ESLint
```
