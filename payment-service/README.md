# Payment Service

Microsservico **consumer** responsavel por processar o pagamento dos pedidos publicados pelo Order Service.

## Papel na arquitetura

Consome a fila `payment.order.created`, bindada ao topic exchange `orders.exchange` pela routing key `order.created`. Cada mensagem recebida representa um pedido a ser cobrado; o gateway de pagamento (ex.: Kiwify) e acionado a partir dai.

```
orders.exchange ──(order.created)──> payment.order.created ──> Payment Service
                                            │                       │
                                            │                       ▼
                                            │                 PaymentGateway
                                            │
                                            │  falha apos N tentativas
                                            ▼
                                      payments.dlx ──> payments.failed ──> Payment DLQ Service
```

O caminho de falha e tratado por uma combinacao de **Retry decorator** + **Dead Letter Queue**:

1. O `PaymentService.process()` e decorado com `@Retry()` (ver `decorators/retry.decorator.ts`), que executa ate 3 tentativas com backoff configuravel.
2. Se todas as tentativas falharem, o consumer faz `channel.nack(msg, false, false)` (sem requeue).
3. A fila esta declarada com `deadLetterExchange: 'payments.dlx'` e `deadLetterRoutingKey: 'payments.failed'`, entao o broker redireciona a mensagem para a DLQ.
4. O `payment-dlq-service` consome essa fila e trata a falha (log, alerta, persistencia).

## Tecnologias

- NestJS 11
- `@nestjs/microservices` (Transport RMQ)
- `@nestjs/config` (variaveis de ambiente)
- `amqplib` (tipos de `Channel` / `Message` para ack manual)

## Configuracao

Crie um arquivo `.env` na raiz do payment-service:

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
├── app.module.ts                       # ConfigModule global + DI do gateway (PaymentGateway → KiwifyGateway)
├── main.ts                             # Bootstrap via createMicroservice (Transport.RMQ) + DLX/DLQ
├── decorators/
│   └── retry.decorator.ts              # @Retry() — retentativas com backoff fixo/exponencial
├── payments/
│   ├── payment.consumer.ts             # @EventPattern('order.created') + ack/nack manual
│   └── payment.service.ts              # Caso de uso, anotado com @Retry()
├── gateways/
│   └── payment/
│       ├── payment.gateway.ts          # Abstracao (DIP)
│       └── kiwify.gateway.ts           # Implementacao concreta
└── shared/
    ├── dtos/
    │   └── create-order.dto..ts        # Shape do evento recebido
    └── enuns/
        └── payment-method.enum.ts
```

## Consumo de eventos

O consumer e declarado como **controller** (requisito do NestJS microservices — apenas controllers sao escaneados em busca dos decoradores `@EventPattern` / `@MessagePattern`) e faz **ack/nack manual** para integrar com o fluxo de DLQ:

```ts
@Controller()
export class PaymentConsumer {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('order.created')
  async payment(order: CreateOrderDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef() as Channel;
    const originalMessage = context.getMessage() as Message;

    try {
      await this.paymentService.process(order);
      channel.ack(originalMessage);
    } catch (error) {
      console.log(error);
      channel.nack(originalMessage, false, false); // sem requeue → DLX
    }
  }
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
| `queueOptions.deadLetterExchange` | `payments.dlx` |
| `queueOptions.deadLetterRoutingKey` | `payments.failed` |
| `noAck` | `false` (ack manual no controller) |

## Retentativas (`@Retry`)

O decorator em `decorators/retry.decorator.ts` envolve um metodo assincrono e re-executa em caso de exception. Opcoes (todas com default):

| Opcao | Default | Descricao |
|-------|---------|-----------|
| `maxAttempts` | `3` | Numero total de tentativas |
| `delayInMs` | `5000` | Espera base entre tentativas |
| `backoff` | `'fixed'` | `'fixed'` ou `'exponential'` (`delayInMs * 2^(attempt-1)`) |
| `shouldRetry` | `() => true` | Predicate para filtrar erros que **nao** devem ser retentados |

```ts
@Retry({ maxAttempts: 3, delayInMs: 2000, backoff: 'exponential' })
async process(order: CreateOrderDto) {
  return await this.gateway.paymentProcess(order);
}
```

A logica fica isolada do consumer: o `payment.consumer.ts` so precisa decidir entre `ack` e `nack`; a politica de retry e aplicada ao caso de uso. Se o decorator esgotar as tentativas, a exception sobe ate o consumer e a mensagem vai para a DLQ.

## Inversao de dependencia (DIP)

O `PaymentService` depende da abstracao `PaymentGateway`, nao de uma implementacao especifica:

```ts
// app.module.ts
providers: [
  PaymentService,
  { provide: PaymentGateway, useClass: KiwifyGateway },
]
```

Trocar o provedor de pagamento e uma alteracao em uma unica linha — basta apontar para outra implementacao da abstracao.

## Scripts

```bash
yarn start:dev     # Desenvolvimento com hot reload
yarn build         # Compilacao para producao
yarn start:prod    # Execucao em producao
yarn test          # Testes unitarios
yarn lint          # Linting com ESLint
```
