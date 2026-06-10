import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createCheckoutSession(orgId: string, plan: SubscriptionPlan) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const prices = {
      [SubscriptionPlan.STARTER]: process.env.STRIPE_PRICE_STARTER,
      [SubscriptionPlan.GROWTH]: process.env.STRIPE_PRICE_GROWTH,
      [SubscriptionPlan.BUSINESS]: process.env.STRIPE_PRICE_BUSINESS,
    };

    const priceId = prices[plan];
    if (!priceId) {
      throw new Error('Invalid plan or price not configured');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/settings?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/settings?canceled=true`,
      metadata: {
        orgId,
        plan,
      },
    });

    return { url: session.url };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { orgId, plan } = session.metadata as any;
        
        await this.prisma.organization.update({
          where: { id: orgId },
          data: { subscriptionPlan: plan as SubscriptionPlan },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata.orgId;
        
        await this.prisma.organization.update({
          where: { id: orgId },
          data: { subscriptionPlan: SubscriptionPlan.STARTER },
        });
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  async getSubscriptionStatus(orgId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { subscriptionPlan: true },
    });

    return {
      plan: organization?.subscriptionPlan || SubscriptionPlan.STARTER,
    };
  }
}
