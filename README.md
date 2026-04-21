# Arquitetura Event-Driven com NestJS e RabbitMQ

Projeto de estudo de arquitetura orientada a eventos utilizando **NestJS** como framework backend e **RabbitMQ** como message broker, aplicando o protocolo **AMQP** com **topic exchange** e consumo paralelo (fan-out por binding) entre microsservicos.

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
                                          │   created (queue)  │
                                          └────────────────────┘
```

### Fluxo

1. **Order Service** recebe um pedido via REST API (`POST /orders`)
2. Publica o evento `order.created` no **topic exchange** `orders.exchange` atraves de um `RabbitMQProvider` customizado (`amqplib`)
3. O exchange faz *fan-out* para as filas bindadas com a routing key `order.created`:
   - `inventory.order.created` → consumida pelo **Inventory Service**
   - `payment.order.created` → consumida pelo **Payment Service**
4. Cada consumer processa o evento de forma independente (desacoplamento total entre producer e consumers)

## Tecnologias

- **NestJS 11** - Framework Node.js para aplicacoes server-side
- **@nestjs/microservices** - Transporte RMQ para os consumers
- **amqplib** - Cliente AMQP usado pelo `RabbitMQProvider` do order-service
- **RabbitMQ 3.13** - Message broker (topic exchange, durable queues)
- **Docker Compose** - Containerizacao do RabbitMQ
- **TypeScript** - Linguagem principal

## Conceitos aplicados

| Conceito AMQP | Descricao |
|---------------|-----------|
| Producer | Quem envia a mensagem (Order Service) |
| Exchange | Quem decide o caminho da mensagem (`orders.exchange`, tipo `topic`) |
| Queue | Onde a mensagem fica armazenada (`inventory.order.created`, `payment.order.created`) |
| Binding | Regra de roteamento entre exchange e fila |
| Routing Key | "Etiqueta" da mensagem (`order.created`) |
| ACK / NACK | Confirmacao (ou rejeicao) de processamento (`noAck: false`) |

### Padroes de comunicacao

- **Event-Driven** - Servicos se comunicam por eventos assincronos
- **Publish/Subscribe via topic exchange** - Multiplos consumers recebem o mesmo evento atraves de filas proprias
- **Competing Consumers** - Instancias de um mesmo servico podem escalar consumindo da mesma fila

## Estrutura do projeto

```
event-driven-arquitecture/
├── order-service/          # Producer - API REST + publicacao no RabbitMQ
├── payment-service/        # Consumer - processa pagamento do pedido
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

```env
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin
RABBITMQ_URL=amqp://admin:admin@localhost:5672
RABBITMQ_ORDER_ROUTING_KEY=order.created
```

### 3. Iniciar os servicos (em terminais separados)

```bash
# Producer
cd order-service && npm install && npm run start:dev

# Consumers
cd payment-service && yarn install && yarn start:dev
cd inventory-service && yarn install && yarn start:dev
```

### 4. Criar um pedido

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

Ambos os consumers (payment e inventory) devem logar o pedido recebido.

## Servicos

| Servico | Porta | Papel |
|---------|-------|-------|
| Order Service | 3000 | Producer (API REST) |
| Payment Service | - | Consumer (fila `payment.order.created`) |
| Inventory Service | - | Consumer (fila `inventory.order.created`) |
| RabbitMQ | 5672 | Broker AMQP |
| RabbitMQ Management | 15672 | Painel de gerenciamento |
