const crypto = require('crypto');
const {
  initializeKhaltiPayment,
  verifyKhaltiPayment,
} = require('../service/khaltiService');
const Payment = require('../models/paymentModel');
const Balance = require('../models/balanceModel');

// Helper function to hash sensitive data
const hashSensitiveData = (data) =>
  crypto.createHash('sha256').update(data).digest('hex');

// Initialize Khalti payment
const initializePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { totalPrice, website_url } = req.body;

    // Validate inputs
    if (!totalPrice || !website_url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: totalPrice or website_url',
      });
    }

    // Create payment record
    const paymentRecord = await Payment.create({
      user: userId,
      paymentGateway: 'khalti',
      amount: totalPrice,
      status: 'pending',
    });

    const amountInPaisa = Math.round(totalPrice * 100);

    // Call Khalti API to initialize the payment
    const paymentResponse = await initializeKhaltiPayment({
      amount: amountInPaisa,
      purchase_order_id: paymentRecord._id.toString(),
      purchase_order_name: `User Payment: ${userId}`,
      return_url: `${process.env.BACKEND_URL}/api/payment/complete-khalti-payment`,
      website_url: website_url || 'http://localhost:3000',
    });

    // Hash sensitive information
    const hashedPidx = hashSensitiveData(paymentResponse.pidx);

    // Update payment record with the response
    await Payment.updateOne(
      { _id: paymentRecord._id },
      {
        $set: {
          transactionId: hashedPidx,
          pidx: hashedPidx,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      paymentRecord,
      payment: paymentResponse,
      url: paymentResponse.payment_url,
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Complete Khalti payment
const completeKhaltiPayment = async (req, res) => {
  try {
    const { pidx, amount, purchase_order_id } = req.query;

    // Verify payment with Khalti
    const paymentInfo = await verifyKhaltiPayment(pidx);

    if (
      !paymentInfo ||
      paymentInfo.status !== 'Completed' ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    const hashedPidx = hashSensitiveData(pidx);

    // Update payment record
    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: purchase_order_id },
      {
        $set: {
          pidx: hashedPidx,
          transactionId: hashSensitiveData(paymentInfo.transaction_id),
          status: 'success',
        },
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Redirect to the success page
    const successPageUrl = `http://localhost:3000/payment-success?pidx=${hashedPidx}&orderId=${purchase_order_id}&amount=${amount}`;
    res.redirect(successPageUrl);
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Verify Khalti payment manually
const verifyKhalti = async (req, res) => {
  try {
    const { pidx, amount, purchase_order_id } = req.query;

    // Verify payment with Khalti
    const paymentInfo = await verifyKhaltiPayment(pidx);

    if (
      !paymentInfo ||
      paymentInfo.status !== 'Completed' ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        paymentInfo,
      });
    }

    const hashedPidx = hashSensitiveData(pidx);

    // Update payment record
    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: purchase_order_id },
      {
        $set: {
          pidx: hashedPidx,
          transactionId: hashSensitiveData(paymentInfo.transaction_id),
          status: 'success',
        },
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentData: updatedPayment,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  initializePayment,
  completeKhaltiPayment,
  verifyKhalti,
};
