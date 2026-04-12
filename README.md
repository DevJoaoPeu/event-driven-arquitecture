# Arquitetura Event-Driven com NestJS e RabbitMQ

Projeto de estudo de arquitetura orientada a eventos utilizando **NestJS** como framework backend e **RabbitMQ** como message broker, aplicando o protocolo **AMQP**.

## Arquitetura

```
┌─────────────┐    orders.created.queue    ┌─────────────┐
│             │ ─────────────────────────> │             │
│   Order     │        (RabbitMQ)          │   Payment   │
│   Service   │                            │   Service   │
└─────────────┘                            └──────┬──────┘
                                                  │
                                     payment.failed.queue
                                                  │
                                           ┌──────▼──────┐
                                           │  Payment    │
                                           │  DLQ        │
                                           └─────────────┘
```

### Fluxo

1. **Order Service** recebe um pedido via REST API (`POST /orders`)
2. O pedido e emitido como evento `order.created` para a fila `orders.created.queue` no RabbitMQ
3. **Payment Service** consome o evento e processa o pagamento
4. Caso o pagamento falhe, o evento vai para a `payment.failed.queue`
5. **Payment DLQ** (Dead Letter Queue) consome os pagamentos que falharam para tratamento

## Tecnologias

- **NestJS** - Framework Node.js para aplicacoes server-side
- **RabbitMQ** - Message broker com protocolo AMQP
- **Docker** - Containerizacao do RabbitMQ
- **TypeScript** - Linguagem principal

## Conceitos aplicados

| Conceito AMQP | Descricao |
|----------------|-----------|
| Producer | Quem envia a mensagem |
| Exchange | Quem decide o caminho da mensagem |
| Queue | Onde a mensagem fica armazenada |
| Binding | Regra de roteamento |
| Routing Key | "Etiqueta" da mensagem |
| ACK / NACK | Confirmacao de processamento |

### Padroes de comunicacao

- **Event-Driven** - Servicos se comunicam por eventos assincronos
- **Point to Point** - Mensagem consumida por um unico consumer
- **Dead Letter Queue** - Fila para mensagens que falharam no processamento

## Estrutura do projeto

```
event-driven-arquitecture/
├── order-service/          # Servico de pedidos (Producer)
├── learning/               # Diagramas e anotacoes de estudo
│   ├── event-driven-arquitecture.png
│   ├── event-driven-course.png
│   └── protocol-amqp.png
└── README.md
```

## Pre-requisitos

- Node.js >= 18
- Docker e Docker Compose
- npm

## Como executar

### 1. Subir o RabbitMQ

```bash
cd order-service
docker compose up -d
```

O painel de gerenciamento fica disponivel em `http://localhost:15672`.

### 2. Iniciar o Order Service

```bash
cd order-service
npm install
npm run start:dev
```

### 3. Criar um pedido

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

## Servicos

| Servico | Porta | Descricao |
|---------|-------|-----------|
| Order Service | 3000 | API REST para criacao de pedidos |
| RabbitMQ | 5672 | Porta AMQP |
| RabbitMQ Management | 15672 | Painel de gerenciamento |
