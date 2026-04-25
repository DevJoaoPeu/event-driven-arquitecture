# Arquitetura Event-Driven com NestJS e RabbitMQ

Projeto de estudo de arquitetura orientada a eventos utilizando **NestJS** como framework backend e **RabbitMQ** como message broker, aplicando o protocolo **AMQP** com **topic exchange**, consumo paralelo (fan-out por binding) entre microsservicos e **Dead Letter Queue** para tratamento de falhas.

## Arquitetura

```
                                          ┌────────────────────┐
                                          │  inventory.order.  │
                                   ┌────> │  created (queue)   │──> Inventory Service
                                   │      └────────────────────┘
                                   │
┌───────────┐   order.created   ┌──┴────────────┐
│   Order   │ ───────────────>  │    orders.    │
│  Service  │  (topic exchange) │   exchange    │
└───────────┘                   └──┬────────────┘
                                   │
                                   │      ┌────────────────────┐
                                   └────> │   payment.order.   │──> Payment Service
                                          │   created (queue)  │       │
                                          └────────────────────┘       │ falha apos N retries
                                                                       ▼
                                                              ┌────────────────────┐
                                                              │   payments.dlx     │
                                                              │  (DLX exchange)    │
                                                              └─────────┬──────────┘
                                                                        │ payments.failed
                                                                        ▼
                                                              ┌────────────────────┐
                                                              │  payments.failed   │──> Payment DLQ Service
                                                              │      (queue)       │
                                                              └────────────────────┘
```

### Fluxo

1. **Order Service** recebe um pedido via REST API (`POST /orders`).
2. Publica o evento `order.created` no **topic exchange** `orders.exchange` atraves da abstracao `EventPublisher`, implementada pelo `RabbitMQProvider` (`amqplib`).
3. O exchange faz *fan-out* para as filas bindadas com a routing key `order.created`:
   - `inventory.order.created` → consumida pelo **Inventory Service**
   - `payment.order.created` → consumida pelo **Payment Service**
4. Cada consumer processa o evento de forma independente (desacoplamento total entre producer e consumers).
5. No **Payment Service**, o caso de uso e decorado com `@Retry()` (ate 3 tentativas com backoff configuravel). Se as retentativas se esgotarem, a mensagem e rejeitada sem requeue (`channel.nack(msg, false, false)`) e o broker a redireciona via `payments.dlx` para a fila `payments.failed`.
6. **Payment DLQ Service** consome `payments.failed` para log/alerta/persistencia das falhas.

## Tecnologias

- **NestJS 11** - Framework Node.js para aplicacoes server-side
- **@nestjs/microservices** - Transporte RMQ para os consumers
- **amqplib** - Cliente AMQP usado pelo `RabbitMQProvider` do order-service
- **RabbitMQ 3.13** - Message broker (topic exchange, durable queues, DLX)
- **Docker Compose** - Containerizacao do RabbitMQ
- **TypeScript** - Linguagem principal

## Conceitos aplicados

| Conceito AMQP | Descricao |
|---------------|-----------|
| Producer | Quem envia a mensagem (Order Service) |
| Exchange | Quem decide o caminho da mensagem (`orders.exchange`, tipo `topic`) |
| Queue | Onde a mensagem fica armazenada (`inventory.order.created`, `payment.order.created`, `payments.failed`) |
| Binding | Regra de roteamento entre exchange e fila |
| Routing Key | "Etiqueta" da mensagem (`order.created`, `payments.failed`) |
| ACK / NACK | Confirmacao (ou rejeicao) de processamento (`noAck: false`) |
| Dead Letter Exchange | Exchange para onde mensagens rejeitadas sao redirecionadas (`payments.dlx`) |
| Dead Letter Queue | Fila que recebe mensagens "mortas" via DLX (`payments.failed`) |

### Padroes de comunicacao e design

- **Event-Driven** - Servicos se comunicam por eventos assincronos
- **Publish/Subscribe via topic exchange** - Multiplos consumers recebem o mesmo evento atraves de filas proprias
- **Competing Consumers** - Instancias de um mesmo servico podem escalar consumindo da mesma fila
- **Dead Letter Queue** - Mensagens que falharam apos retentativas sao isoladas em uma fila dedicada para tratamento (log, alerta, reprocessamento manual)
- **Retry com backoff** - Decorator `@Retry()` no Payment Service aplica retentativas (fixas ou exponenciais) antes de declarar falha definitiva
- **Inversao de dependencia (DIP)** - Order Service depende da abstracao `EventPublisher`; Payment Service depende da abstracao `PaymentGateway` — implementacoes concretas sao injetadas via DI

## Estrutura do projeto

```
event-driven-arquitecture/
├── order-service/          # Producer - API REST + publicacao no RabbitMQ
├── payment-service/        # Consumer - processa pagamento com retry + DLQ
├── payment-dlq-service/    # Consumer - trata mensagens que falharam no payment-service
├── inventory-service/      # Consumer - reserva estoque do pedido
├── learning/               # Diagramas e anotacoes de estudo
│   ├── event-driven-arquitecture.png
│   ├── event-driven-course.png
│   └── protocol-amqp.png
├── request.http            # Exemplos de requisicoes para testar a API
└── README.md
```

## Pre-requisitos

- Node.js >= 18
- Docker e Docker Compose
- npm ou yarn

## Como executar

### 1. Subir o RabbitMQ

```bash
cd order-service
docker compose up -d
```

O painel de gerenciamento fica disponivel em `http://localhost:15672` (user/senha definidos no `.env`).

### 2. Configurar variaveis de ambiente

Cada servico precisa de um `.env` na sua raiz:

**order-service / inventory-service / payment-service**

```env
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin
RABBITMQ_URL=amqp://admin:admin@localhost:5672
RABBITMQ_ORDER_ROUTING_KEY=order.created
```

**payment-dlq-service**

```env
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin
RABBITMQ_URL=amqp://admin:admin@localhost:5672
RABBITMQ_ORDER_QUEUE=payments.failed
```

### 3. Configurar o Dead Letter Exchange

A fila `payment.order.created` ja e declarada com `deadLetterExchange: 'payments.dlx'` e `deadLetterRoutingKey: 'payments.failed'` automaticamente pelo payment-service. O payment-dlq-service apenas consome a fila `payments.failed` — o exchange `payments.dlx` (tipo `direct`) e o binding `payments.dlx` → `payments.failed` precisam ser criados manualmente no painel do RabbitMQ (`http://localhost:15672`) ou pre-declarados via cliente AMQP.

### 4. Iniciar os servicos (em terminais separados)

```bash
# Producer
cd order-service && npm install && npm run start:dev

# Consumers
cd payment-service && yarn install && yarn start:dev
cd inventory-service && yarn install && yarn start:dev
cd payment-dlq-service && yarn install && yarn start:dev
```

### 5. Criar um pedido

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "1",
    "itens": [
      { "productId": "1", "quantity": 1, "unitPrice": 100 },
      { "productId": "2", "quantity": 1, "unitPrice": 50 }
    ],
    "payment": { "method": "CREDIT_CARD", "installment": 1 },
    "delivery": { "addressId": "1" }
  }'
```

Os consumers devem logar o pedido recebido. Como o `KiwifyGateway` esta atualmente lancando erro proposital (`throw new Error('Error process payment')`), o payment-service vai exaurir as 3 tentativas do `@Retry()` e a mensagem cai na DLQ — o `payment-dlq-service` deve loga-la em seguida.

## Servicos

| Servico | Porta | Papel |
|---------|-------|-------|
| Order Service | 3000 | Producer (API REST) |
| Payment Service | - | Consumer (fila `payment.order.created`, com retry + DLQ) |
| Payment DLQ Service | - | Consumer (fila `payments.failed` — mensagens rejeitadas pelo payment-service) |
| Inventory Service | - | Consumer (fila `inventory.order.created`) |
| RabbitMQ | 5672 | Broker AMQP |
| RabbitMQ Management | 15672 | Painel de gerenciamento |
