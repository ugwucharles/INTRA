import { Controller, Post, Body, Get, Headers, BadRequestException, Param } from '@nestjs/common';
import { BillingService } from './billing.service';
import { SubscriptionPlan } from '@prisma/client';
import Stripe from 'stripe';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  async createCheckoutSession(@Body() body: { orgId: string; plan: SubscriptionPlan }) {
    return this.billingService.createCheckoutSession(body.orgId, body.plan);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() body: any,
  ) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-12-18.acacia',
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err}`);
    }

    await this.billingService.handleWebhook(event);
    return { received: true };
  }

  @Get('subscription/:orgId')
  async getSubscriptionStatus(@Param('orgId') orgId: string) {
    return this.billingService.getSubscriptionStatus(orgId);
  }
}
