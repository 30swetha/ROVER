import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment } from '../models/Payment';
import { RiderProfile } from '../models/RiderProfile';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT) || 10;

export async function createPaymentOrder(
  requestId: string,
  ownerId: string,
  riderId: string,
  amount: number,
) {
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);
  const riderEarning = amount - platformFee;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: `rover_${requestId}_${Date.now()}`,
    notes: { requestId, ownerId, riderId },
  });

  const payment = await Payment.create({
    requestId,
    ownerId,
    riderId,
    amount,
    platformFee,
    riderEarning,
    razorpayOrderId: order.id,
    status: 'pending',
  });

  return { order, payment };
}

export async function verifyAndEscrowPayment(
  paymentId: string,
  orderId: string,
  signature: string,
  dbPaymentId: string,
) {
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSig !== signature) {
    throw new Error('Invalid payment signature');
  }

  const payment = await Payment.findByIdAndUpdate(
    dbPaymentId,
    {
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      status: 'escrowed',
      escrowedAt: new Date(),
    },
    { new: true },
  );

  return payment;
}

export async function releasePaymentToRider(requestId: string) {
  const payment = await Payment.findOne({ requestId, status: 'escrowed' });
  if (!payment) throw new Error('No escrowed payment found');

  await payment.updateOne({ status: 'released', releasedAt: new Date() });

  await RiderProfile.findOneAndUpdate(
    { userId: payment.riderId },
    {
      $inc: {
        totalEarnings: payment.riderEarning,
        pendingEarnings: -payment.riderEarning,
      },
    },
  );

  return payment;
}
