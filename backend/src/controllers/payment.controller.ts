import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Payment } from '../models/Payment';
import { TransportRequest } from '../models/TransportRequest';
import * as PaymentService from '../services/payment.service';
import { sendNotification } from '../services/notification.service';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const { requestId } = req.body;

  const request = await TransportRequest.findOne({ _id: requestId, ownerId: req.user!.id });
  if (!request || !request.selectedRider) {
    res.status(400).json({ error: 'Invalid request or no rider selected' });
    return;
  }

  const { order, payment } = await PaymentService.createPaymentOrder(
    requestId,
    req.user!.id,
    request.selectedRider.toString(),
    request.budget,
  );

  res.json({ order, payment, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { paymentId, orderId, signature, dbPaymentId } = req.body;

  const payment = await PaymentService.verifyAndEscrowPayment(paymentId, orderId, signature, dbPaymentId);
  if (!payment) { res.status(400).json({ error: 'Payment verification failed' }); return; }

  await sendNotification({
    userId: payment.riderId.toString(),
    title: 'Payment Secured 💰',
    body: 'Payment has been secured in escrow. Complete the transport to receive it.',
    type: 'payment',
    data: { requestId: payment.requestId.toString() },
  });

  res.json({ payment, message: 'Payment verified and escrowed' });
};

export const releasePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const payment = await PaymentService.releasePaymentToRider(req.params.requestId);

  await sendNotification({
    userId: payment.riderId.toString(),
    title: 'Payment Released! 🎉',
    body: `₹${payment.riderEarning} has been credited to your account.`,
    type: 'payment',
    data: { amount: payment.riderEarning },
  });

  res.json({ payment, message: 'Payment released to rider' });
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const isRider = req.user!.role === 'rider';
  const filter = isRider
    ? { riderId: req.user!.id }
    : { ownerId: req.user!.id };

  const payments = await Payment.find(filter)
    .populate('requestId', 'pickupCity destinationCity bikeBrand')
    .populate(isRider ? 'ownerId' : 'riderId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ payments });
};
