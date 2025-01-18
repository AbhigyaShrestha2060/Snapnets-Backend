const {
  initializeKhaltiPayment,
  verifyKhaltiPayment,
} = require('../service/khaltiService');
const Payment = require('../models/paymentModel');
const BookingModel = require('../models/bookingModel');

// Route to initialize Khalti payment gateway
const initializePayment = async (req, res) => {
  console.log(req.body);

  try {
    const { totalPrice, website_url } = req.body;
    var booking = req.body.bookings;
    var bookings = [];
    var bookingIds = [];
    if (req.body.bookingList) {
      bookingIds = req.body.bookingList.map((b) => b.bikeId);
    }
    if (!bookings) {
      bookings = bookingIds;
    } else {
      bookings = booking.map((b) => b.bikeId);
    }

    console.log(bookings);
    // Extract product names from populated products array
    const productNames = bookings.map((p) => p.bikeNumber).join(', ');

    if (!productNames) {
      return res.send({
        success: false,
        message: 'No booking names found',
      });
    }

    // Create a payment document without transactionId initially
    const OrderModelData = await Payment.create({
      bookings: bookings,
      paymentGateway: 'khalti',
      amount: totalPrice,
      status: 'pending', // Set the initial status to pending
    });

    // Initialize the Khalti payment
    const paymentInitate = await initializeKhaltiPayment({
      amount: 10 * 100, // amount should be in paisa (Rs * 100)
      purchase_order_id: OrderModelData._id, // purchase_order_id because we need to verify it later
      purchase_order_name: productNames,
      return_url: `http://localhost:3000/thankyou`, // Return URL where we verify the payment
      website_url: website_url || 'http://localhost:3000',
    });

    // Update the payment record with the transactionId and pidx
    await Payment.updateOne(
      { _id: OrderModelData._id },
      {
        $set: {
          transactionId: paymentInitate.pidx, // Assuming pidx as transactionId from Khalti response
          pidx: paymentInitate.pidx,
        },
      }
    );

    res.json({
      success: true,
      OrderModelData,
      payment: paymentInitate,
      pidx: paymentInitate.pidx,
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.json({
      success: false,
      error: error.message || 'An error occurred',
    });
  }
};

// This is our return URL where we verify the payment done by the user
const completeKhaltiPayment = async (req, res) => {
  console.log(req.query);
  const { pidx, amount } = req.query;
  const purchase_order_id = req.query.purchase_order_id || req.query.productId;

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);
    console.log(paymentInfo);

    // Validate the payment info
    if (
      paymentInfo?.status !== 'Completed' || // Ensure the status is "Completed"
      paymentInfo.pidx !== pidx || // Verify pidx matches
      Number(paymentInfo.total_amount) !== Number(amount) // Compare the total amount
    ) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete or invalid payment information',
        paymentInfo,
      });
    }
    // Update payment record with verification data
    const paymentData = await Payment.findOneAndUpdate(
      { _id: purchase_order_id },
      {
        $set: {
          pidx,
          transactionId: paymentInfo.transaction_id,
          status: 'success',
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payment Successful',
      paymentData,
      transactionId: paymentInfo.transaction_id,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during payment verification',
      error: error.message || 'An unknown error occurred',
    });
  }
};

module.exports = { initializePayment, completeKhaltiPayment };
