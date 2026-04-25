# Order Service

Microsservico responsavel por receber pedidos via REST API e publicar eventos no RabbitMQ para consumo assincrono pelos demais servicos.

## Papel na arquitetura

O Order Service atua como **Producer**. Ao receber um pedido, publica o evento `order.created` no **topic exchange** `orders.exchange`, que faz fan-out para as filas `payment.order.created` e `inventory.order.created`.

```
Client ──POST /orders──> Order Service ──order.created──> orders.exchange (topic)
                                                          ├──> payment.order.created
                                                          └──> inventory.order.created
```

A publicacao e feita atraves da abstracao `EventPublisher` (DIP), implementada por um `RabbitMQProvider` customizado que usa `amqplib` diretamente em vez do `ClientProxy` do `@nestjs/microservices` — isso permite controle explicito sobre a criacao do exchange e o formato do envelope `{ pattern, data }`. O `OrderService` depende da abstracao, nao do provider concreto, entao trocar de broker e uma mudanca de uma linha no modulo.

## Tecnologias

- NestJS 11
- `amqplib` (driver AMQP nativo)
- class-validator / class-transformer (validacao do payload)
- Docker Compose (RabbitMQ)

## Configuracao

Crie um arquivo `.env` na raiz do order-service:

```env
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

> As credenciais de `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS` sao consumidas pelo container do RabbitMQ via `docker-compose.yml`.

## Como executar

```bash
# Subir o RabbitMQ
docker compose up -d

# Instalar dependencias
npm install

# Executar em modo de desenvolvimento
npm run start:dev
```

## API

### POST /orders

Cria um novo pedido e publica o evento `order.created`.

**Request body:**

```json
{
  "customerId": "1",
  "itens": [
    {
      "productId": "1",
      "quantity": 1,
      "unitPrice": 100
    }
  ],
  "payment": {
    "method": "CREDIT_CARD",
    "installment": 1
  },
  "delivery": {
    "addressId": "1"
  }
}
```

**Campos de `payment.method`:**

| Valor | Descricao |
|-------|-----------|
| `CREDIT_CARD` | Cartao de credito |
| `DEBIT_CARD` | Cartao de debito |
| `CASH` | Dinheiro |
| `PIX` | Pix |

Exemplos prontos estao em `../request.http`.

## Estrutura

```
src/
├── app.module.ts                       # Modulo raiz (ConfigModule global, OrderModule)
├── main.ts                             # Bootstrap HTTP com ValidationPipe
├── order/
│   ├── order.module.ts                 # Declara controller, service e bind EventPublisher → RabbitMQProvider
│   ├── order.controller.ts             # Endpoint POST /orders
│   ├── order.service.ts                # Invoca eventPublisher.publish(...)
│   ├── dto/
│   │   └── create-order.dto.ts         # Validacao do payload
│   └── enuns/
│       └── payment-method.enum.ts      # Enum dos metodos de pagamento
├── providers/
│   └── RabbitMQProvider.ts             # Implementacao concreta — declara o topic exchange e publica
└── shared/
    └── messaging/
        └── event-publisher.ts          # Abstracao EventPublisher (DIP)
```

## Publicacao de eventos

`OrderService` depende apenas da abstracao `EventPublisher`:

```ts
export abstract class EventPublisher {
  abstract publish(routingKey: string, data: unknown): void;
}
```

A injecao no `OrderModule` aponta para a implementacao concreta:

```ts
providers: [
  OrderService,
  { provide: EventPublisher, useClass: RabbitMQProvider },
]
```

`RabbitMQProvider` declara o exchange `orders.exchange` (tipo `topic`, `durable: true`) no `onModuleInit` e implementa `publish` enviando o envelope compativel com `@nestjs/microservices`:

```json
{ "pattern": "order.created", "data": { ... } }
```

## Scripts

```bash
npm run start:dev    # Desenvolvimento com hot reload
npm run build        # Compilacao para producao
npm run start:prod   # Execucao em producao
npm run test         # Testes unitarios
npm run lint         # Linting com ESLint
```
