import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import Stripe from 'stripe';
import { CreatePaymentSessionDto } from './dto';
import type { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecretKey);
  private readonly logger = new Logger(PaymentsService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async createPaymentSession(createPaymentSessionDto: CreatePaymentSessionDto) {
    const { currency, items, order_id } = createPaymentSessionDto;

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    const session = await this.stripe.checkout.sessions.create({
      // colocar aquí el ID de orden
      payment_intent_data: {
        metadata: {
          order_id,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });

    return {
      cancel_url: session.cancel_url,
      success_url: session.success_url,
      url: session.url,
    };
  }

  async stripeWebhookHandler(req: Request, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        signature,
        envs.stripeWebhookSecret,
      );
    } catch (error) {
      throw new BadRequestException(
        `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object as Stripe.Charge;
        const payload = {
          stripeChargeId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.order_id,
          receiptUrl: chargeSucceeded.receipt_url,
        };

        // Emit the event to NATS
        this.client.emit('payments.succeeded', payload);

        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true, message: 'Webhook received' };
  }
}
