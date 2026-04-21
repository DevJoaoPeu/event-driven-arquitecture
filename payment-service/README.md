# Payment Service

Microsservico **consumer** responsavel por processar o pagamento dos pedidos publicados pelo Order Service.

## Papel na arquitetura

Consome a fila `payment.order.created`, bindada ao topic exchange `orders.exchange` pela routing key `order.created`. Cada mensagem recebida representa um pedido a ser cobrado; o gateway de pagamento (ex.: Kiwify) e acionado a partir dai.

```
orders.exchange ──(order.created)──> payment.order.created ──> Payment Service
                                                                    │
                                                                    ▼
                                                              PaymentGateway
```

## Tecnologias

- NestJS 11
- `@nestjs/microservices` (Transport RMQ)
- `@nestjs/config` (variaveis de ambiente)

## Configuracao

Crie um arquivo `.env` na raiz do payment-service:

```env
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
├── payments/
│   └── payment.consumer.ts              # @EventPattern('order.created')
├── gateways/
│   └── payment/
│       └── kiwify.gateway.ts            # Integracao com provedor de pagamento
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
export class PaymentConsumer {
  @EventPattern('order.created')
  payment(order: CreateOrderDto) { ... }
}
```

Configuracao da fila (em `main.ts`):

| Opcao | Valor |
|-------|-------|
| `queue` | `payment.order.created` |
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
