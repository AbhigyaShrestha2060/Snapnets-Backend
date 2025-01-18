import moment from 'moment';
import Balance from '../models/balanceModel.js';
import Bids from '../models/bidModel.js';
import Image from '../models/imageModel.js';
import User from '../models/userModel.js';

// Function to create a new bid
export const createBid = async (req, res) => {
  try {
    const { bidAmount, imageId } = req.body;

    // Get the user from the token (assuming user is added to the request via middleware)
    const userId = req.user.id;

    // Fetch the image by its ID
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Ensure the image has more than 5 likes before proceeding
    if (image.totalLikes <= 5) {
      return res.status(400).json({
        message:
          'This image cannot be bid on as it has less than or equal to 5 likes',
      });
    }

    // Fetch the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch the user's balance
    const balance = await Balance.findOne({ user: userId });
    if (!balance) {
      return res
        .status(404)
        .json({ message: 'Balance not found for the user' });
    }

    // Check if the user has sufficient balance to place the bid
    if (balance.balance < bidAmount) {
      return res
        .status(400)
        .json({ message: 'Insufficient balance to place the bid' });
    }

    // Get the highest bid for the image, if any
    const highestBid = await Bids.findOne({ image: imageId })
      .sort({ bidAmount: -1 })
      .limit(1);

    // Check if the user's bid is at least 50 more than the highest bid
    if (highestBid && bidAmount <= highestBid.bidAmount + 50) {
      return res.status(400).json({
        message: `Bid must be at least 50 more than the previous bid of ${highestBid.bidAmount}`,
      });
    }

    // Deduct the bid amount from the user's balance
    balance.balance -= bidAmount;

    // Log the transaction
    balance.transactions.push({
      amount: -bidAmount, // Negative amount for deductions
      transactionDate: new Date(),
    });

    // Save the updated balance with the transaction
    await balance.save();

    // Create the new bid
    const newBid = new Bids({
      bidAmount,
      user: userId,
      image: imageId,
    });

    // Save the bid to the database
    await newBid.save();

    res.status(201).json({ message: 'Bid placed successfully', bid: newBid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to get all the bids a user has placed
export const getUserBids = async (req, res) => {
  try {
    // Extract userId from token
    const userId = req.user.id;

    // Fetch all the bids placed by the user with populated image details
    const userBids = await Bids.find({ user: userId })
      .populate(
        'image',
        'imageTitle imageDescription image isPortrait totalLikes'
      )
      .sort({ createdAt: -1 }); // Sort by most recent first

    if (!userBids || userBids.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No bids found for this user',
      });
    }

    // Process bids to include latest bid information
    const processedBids = await Promise.all(
      userBids.map(async (userBid) => {
        if (!userBid.image) {
          // Handle cases where the image might be null
          return {
            ...userBid.toObject(),
            latestBidAmount: userBid.bidAmount,
            userLatestBidAmount: userBid.bidAmount,
            userLatestBidDate: userBid.createdAt,
          };
        }

        // Get the highest bid for this image
        const highestBid = await Bids.findOne({ image: userBid.image._id })
          .sort({ bidAmount: -1 })
          .limit(1);

        // Get the user's highest bid for this image
        const userHighestBid = await Bids.findOne({
          image: userBid.image._id,
          user: userId,
        })
          .sort({ bidAmount: -1 })
          .limit(1);

        return {
          ...userBid.toObject(),
          latestBidAmount: highestBid
            ? highestBid.bidAmount
            : userBid.bidAmount,
          userLatestBidAmount: userHighestBid
            ? userHighestBid.bidAmount
            : userBid.bidAmount,
          userLatestBidDate: userHighestBid
            ? userHighestBid.createdAt
            : userBid.createdAt,
          isWinning:
            highestBid &&
            userHighestBid &&
            highestBid.bidAmount <= userHighestBid.bidAmount,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'User bids fetched successfully',
      bids: processedBids,
    });
  } catch (error) {
    console.error('Error in getUserBids:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
export const getBidsForUploadedImages = async (req, res) => {
  try {
    // Extract userId from the token (assuming middleware adds it to `req.user`)
    const userId = req.user.id;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    // Fetch all images uploaded by the user
    const uploadedImages = await Image.find({ uploadedBy: userId });

    if (!uploadedImages || uploadedImages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found uploaded by this user',
      });
    }

    // Create an array to store bid information for each image
    const imagesWithBids = [];

    // Loop through each image and fetch its bid data
    for (const image of uploadedImages) {
      // Fetch all bids for the current image
      const bids = await Bids.find({ image: image._id })
        .populate('user', 'username email') // Populate user details for each bid
        .sort({ createdAt: -1 }); // Sort bids by latest first

      // Get the latest bid for the image
      const latestBid = bids.length > 0 ? bids[0] : null;

      // Format the latest bid date
      const latestBidDate = latestBid
        ? moment(latestBid.createdAt).format('MMMM Do YYYY, h:mm:ss a')
        : null;

      // Add bid information for the image
      imagesWithBids.push({
        image: {
          id: image._id,
          title: image.imageTitle,
          description: image.imageDescription,
          isPortrait: image.isPortrait,
          totalLikes: image.totalLikes,
          image: image.image,
        },
        totalBids: bids.length,
        latestBid: latestBid
          ? {
              bidAmount: latestBid.bidAmount,
              bidder: latestBid.user,
              bidDate: latestBidDate,
            }
          : null,
        allBids: bids.map((bid) => ({
          bidAmount: bid.bidAmount,
          bidder: bid.user,
          bidDate: moment(bid.createdAt).format('MMMM Do YYYY, h:mm:ss a'),
        })), // Include all bids for the image
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bid information fetched successfully',
      data: imagesWithBids,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
