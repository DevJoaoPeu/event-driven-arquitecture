# Payment DLQ Service

Microsservico **consumer** dedicado a processar mensagens que falharam no Payment Service. E o ponto final do fluxo de Dead Letter Queue (DLQ): toda vez que o Payment Service esgota suas tentativas e rejeita uma mensagem (`nack` com `requeue: false`), o RabbitMQ a redireciona para esta fila atraves do dead letter exchange.

## Papel na arquitetura

```
            order.created (envelope NestJS)
                  │
                  ▼
        payment.order.created (queue)
                  │
                  ▼
            Payment Service
                  │
                  │  process() falha apos N tentativas (Retry decorator)
                  │  → channel.nack(msg, false, false)
                  ▼
            payments.dlx (exchange)
              routing key: payments.failed
                  │
                  ▼
            payments.failed (queue)
                  │
                  ▼
        Payment DLQ Service  ── log / alerta / persistencia
```

A fila `payment.order.created` e declarada com `deadLetterExchange: 'payments.dlx'` e `deadLetterRoutingKey: 'payments.failed'` (ver `payment-service/src/main.ts`). Quando o consumer original rejeita uma mensagem sem requeue, o broker republica no DLX, que entrega na fila `payments.failed` consumida por este servico.

## Por que um servico separado?

- **Isolamento de responsabilidades**: o Payment Service cuida do caminho feliz; a DLQ trata observabilidade e remediacao de falhas.
- **Backoff humano**: mensagens falhadas podem ser inspecionadas, persistidas para auditoria, reenfileiradas manualmente ou disparar alertas, sem competir com o throughput do consumer principal.
- **Escalabilidade independente**: a fila de erros normalmente tem volume muito menor; pode rodar em uma unica instancia.

## Tecnologias

- NestJS 11
- `@nestjs/microservices` (Transport RMQ)
- `@nestjs/config` (variaveis de ambiente)
- `amqplib` (tipos de `Channel` / `Message` para ack manual)

## Configuracao

Crie um arquivo `.env` na raiz do payment-dlq-service:

```env
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin
RABBITMQ_URL=amqp://admin:admin@localhost:5672

RABBITMQ_ORDER_QUEUE=payments.failed
```

> A fila e o nome para onde o `payments.dlx` faz fan-out via routing key `payments.failed`. Mantenha esse valor sincronizado com o `deadLetterRoutingKey` configurado no payment-service.

## Como executar

```bash
yarn install
yarn start:dev
```

O RabbitMQ precisa estar no ar (use o `docker-compose.yml` do `order-service`) e o exchange `payments.dlx` com a fila `payments.failed` bindada pela routing key `payments.failed` precisa existir no broker (criados via painel `http://localhost:15672` ou pre-declarados).

## Estrutura

```
src/
├── app.module.ts        # ConfigModule global + registro do controller
├── app.controller.ts    # @EventPattern('order.created') — processa a mensagem morta
├── app.service.ts       # Servico stub (placeholder)
└── main.ts              # Bootstrap via createMicroservice (Transport.RMQ)
```

## Consumo das mensagens mortas

O controller usa o mesmo padrao `order.created` porque o envelope republicado pelo DLX preserva o campo `pattern` original do `@nestjs/microservices`. O ack/nack e manual:

```ts
@EventPattern('order.created')
paymentFailed(@Payload() order: any, @Ctx() context: RmqContext) {
  const channel = context.getChannelRef() as Channel;
  const originalMessage = context.getMessage() as Message;

  try {
    console.log(order);                 // hook para log/alerta/persistencia
    channel.ack(originalMessage);
  } catch (error) {
    console.log(error);
    channel.nack(originalMessage, false, false);
  }
}
```

Configuracao da fila (em `main.ts`):

| Opcao | Valor |
|-------|-------|
| `queue` | `payments.failed` (via `RABBITMQ_ORDER_QUEUE`) |
| `queueOptions.durable` | `true` |
| `queueOptions.exclusive` | `false` |
| `queueOptions.autoDelete` | `false` |
| `noAck` | `false` (ack manual no controller) |

Diferente do payment-service, o DLQ nao define `exchange`/`routingKey` no consumer — ele apenas escuta a fila ja vinculada ao `payments.dlx`. O bind exchange→queue precisa existir no broker.

## Proximos passos sugeridos

- Persistir o payload em banco (ex.: Postgres) com timestamp e motivo do erro original (`x-death` header do AMQP).
- Disparar alerta (Slack, email, PagerDuty) a partir do controller.
- Endpoint administrativo para reenfileirar mensagens da DLQ de volta ao `orders.exchange`.

## Scripts

```bash
yarn start:dev     # Desenvolvimento com hot reload
yarn build         # Compilacao para producao
yarn start:prod    # Execucao em producao
yarn test          # Testes unitarios
yarn lint          # Linting com ESLint
```
