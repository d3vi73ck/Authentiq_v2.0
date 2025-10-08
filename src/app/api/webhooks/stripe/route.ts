import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)
        // Handle successful checkout
        // Update user subscription status, etc.
        break

      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object as Stripe.Subscription
        console.log('Subscription created:', subscriptionCreated.id)
        // Handle new subscription
        break

      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', subscriptionUpdated.id)
        // Handle subscription changes
        break

      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object as Stripe.Subscription
        console.log('Subscription deleted:', subscriptionDeleted.id)
        // Handle subscription cancellation
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded:', invoice.id)
        // Handle successful payment
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment failed:', failedInvoice.id)
        // Handle failed payment
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}