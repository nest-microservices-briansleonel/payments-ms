import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  type RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentSessionDto } from './dto';
import type { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('session')
  async createPaymentSession(
    @Body() createPaymentSessionDto: CreatePaymentSessionDto,
  ) {
    return await this.paymentsService.createPaymentSession(
      createPaymentSessionDto,
    );
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payment success',
    };
  }

  @Get('cancel')
  cancel() {
    return {
      ok: false,
      message: 'Payment canceled',
    };
  }

  @Post('webhook')
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    return await this.paymentsService.stripeWebhookHandler(request, signature);
  }
}
