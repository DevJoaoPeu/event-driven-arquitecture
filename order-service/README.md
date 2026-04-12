# Order Service

Microsservico responsavel por receber pedidos via REST API e publicar eventos no RabbitMQ para processamento assincrono.

## Papel na arquitetura

O Order Service atua como **Producer** na arquitetura event-driven. Ao receber um pedido, emite o evento `order.created` para a fila `orders_queue` no RabbitMQ, que sera consumido pelo Payment Service.

```
Client ──POST /orders──> Order Service ──order.created──> RabbitMQ (orders_queue)
```

## Tecnologias

- NestJS 11
- @nestjs/microservices (Transport RMQ)
- class-validator / class-transformer
- Docker Compose (RabbitMQ)

## Configuracao

Crie um arquivo `.env` na raiz do order-service:

```env
RABBITMQ_URL=amqp://usuario:senha@localhost:5672
RABBITMQ_DEFAULT_USER=usuario
RABBITMQ_DEFAULT_PASS=senha
```

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

Cria um novo pedido e publica o evento no RabbitMQ.

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

**Campos de payment.method:**

| Valor | Descricao |
|-------|-----------|
| `CREDIT_CARD` | Cartao de credito |
| `DEBIT_CARD` | Cartao de debito |
| `CASH` | Dinheiro |
| `PIX` | Pix |

## Estrutura

```
src/
├── app.module.ts                  # Modulo raiz (ConfigModule global)
├── main.ts                        # Bootstrap com ValidationPipe
└── order/
    ├── order.module.ts            # Registro do ClientsModule (RabbitMQ)
    ├── order.controller.ts        # Endpoint POST /orders
    ├── order.service.ts           # Emissao do evento order.created
    ├── dto/
    │   └── create-order.dto.ts    # Validacao do payload
    └── enuns/
        └── payment-method.enum.ts # Enum dos metodos de pagamento
```

## Scripts

```bash
npm run start:dev    # Desenvolvimento com hot reload
npm run build        # Compilacao para producao
npm run start:prod   # Execucao em producao
npm run test         # Testes unitarios
npm run lint         # Linting com ESLint
```
