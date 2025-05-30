import moment from 'moment';
import cron from 'node-cron';
import Balance from '../models/balanceModel.js';
import Bids from '../models/bidModel.js';
import Image from '../models/imageModel.js';
import User from '../models/userModel.js';
import { createNotification } from './notificationController.js';

// Function to create a new bid
export const createBid = async (req, res) => {
  try {
    const { bidAmount, imageId } = req.body;
    const userId = req.user.id;

    // Fetch the image by ID
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if bidding is active
    // const currentDate = new Date();
    // if (
    //   !image.biddingStartDate ||
    //   !image.biddingEndDate ||
    //   currentDate < image.biddingStartDate ||
    //   currentDate > image.biddingEndDate
    // ) {
    //   return res.status(400).json({ message: 'Bidding period is not active' });
    // }

    // Ensure the image has more than 3 likes
    if (image.totalLikes <= 0) {
      return res.status(400).json({
        message:
          'This image cannot be bid on as it has less than or equal to 3 likes',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balance = await Balance.findOne({ user: userId });
    if (!balance) {
      return res
        .status(404)
        .json({ message: 'Balance not found for the user' });
    }

    const highestBid = await Bids.findOne({ image: imageId })
      .sort({ bidAmount: -1 })
      .limit(1);

    if (highestBid && bidAmount <= highestBid.bidAmount + 50) {
      return res.status(400).json({
        message: `Bid must be at least 50 more than the previous bid of ${highestBid.bidAmount}`,
      });
    }

    let amountToDeduct = bidAmount;
    if (highestBid && highestBid.user.toString() === userId) {
      amountToDeduct = bidAmount - highestBid.bidAmount;
    }

    if (balance.balance < amountToDeduct) {
      return res
        .status(400)
        .json({ message: 'Insufficient balance to place the bid' });
    }

    if (highestBid && highestBid.user.toString() !== userId) {
      const previousBidderBalance = await Balance.findOne({
        user: highestBid.user,
      });
      if (previousBidderBalance) {
        previousBidderBalance.balance += highestBid.bidAmount;
        previousBidderBalance.transactions.push({
          amount: highestBid.bidAmount,
          transactionDate: new Date(),
        });
        await previousBidderBalance.save();
      }
    }

    balance.balance -= amountToDeduct;
    balance.transactions.push({
      amount: -amountToDeduct,
      transactionDate: new Date(),
    });
    await balance.save();

    const newBid = new Bids({
      bidAmount,
      user: userId,
      image: imageId,
    });
    await newBid.save();

    await createNotification(
      'New Bid Added',
      `You have a bid of $${bidAmount} on the image: ${image.imageTitle}`,
      image.uploadedBy
    );

    // send notification to the previous bidder if there was one
    if (highestBid && highestBid.user.toString() !== userId) {
      await createNotification(
        'Out Bided',
        `Your bid of $${highestBid.bidAmount} on the image: ${image.imageTitle} has been outbid`,
        highestBid.user
      );
    }

    // send notification to the user who has bid
    await createNotification(
      'Bid Placed Successfully',
      `You have successfully placed a bid of $${bidAmount} on the image: ${image.imageTitle}`,
      userId
    );

    res.status(201).json({ message: 'Bid placed successfully', bid: newBid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to get all bids placed by a user
export const getUserBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const userBids = await Bids.find({ user: userId })
      .populate(
        'image',
        'imageTitle imageDescription image isPortrait totalLikes biddingEndDate isBidSold'
      )
      .sort({ createdAt: -1 });

    if (!userBids || userBids.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No bids found for this user' });
    }

    const uniqueBidsMap = new Map();
    userBids.forEach((bid) => {
      const imageId = bid.image?._id.toString();
      if (!imageId) return;

      if (
        !uniqueBidsMap.has(imageId) ||
        uniqueBidsMap.get(imageId).bidAmount < bid.bidAmount
      ) {
        uniqueBidsMap.set(imageId, bid);
      }
    });

    const processedBids = await Promise.all(
      Array.from(uniqueBidsMap.values()).map(async (userBid) => {
        if (!userBid.image) {
          return {
            ...userBid.toObject(),
            latestBidAmount: userBid.bidAmount,
            userLatestBidAmount: userBid.bidAmount,
            userLatestBidDate: userBid.createdAt,
          };
        }

        const highestBid = await Bids.findOne({ image: userBid.image._id })
          .sort({ bidAmount: -1 })
          .limit(1);

        return {
          ...userBid.toObject(),
          latestBidAmount: highestBid
            ? highestBid.bidAmount
            : userBid.bidAmount,
          userLatestBidAmount: userBid.bidAmount,
          userLatestBidDate: userBid.createdAt,
          isWinning: highestBid && highestBid.bidAmount <= userBid.bidAmount,
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

// Function to get bids for images uploaded by a user
export const getBidsForUploadedImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const uploadedImages = await Image.find({ uploadedBy: userId });

    if (!uploadedImages || uploadedImages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found uploaded by this user',
      });
    }

    const imagesWithBids = [];
    for (const image of uploadedImages) {
      const bids = await Bids.find({ image: image._id })
        .populate('user', 'username email')
        .sort({ createdAt: -1 });

      const latestBid = bids.length > 0 ? bids[0] : null;
      const latestBidDate = latestBid
        ? moment(latestBid.createdAt).format('MMMM Do YYYY, h:mm:ss a')
        : null;

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
        })),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bid information fetched successfully',
      data: imagesWithBids,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Scheduled job to handle expired bids
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const expiredImages = await Image.find({
      biddingEndDate: { $lt: now },
      isBidSold: false,
    });

    for (const image of expiredImages) {
      const highestBid = await Bids.findOne({ image: image._id })
        .sort({ bidAmount: -1 })
        .limit(1);

      if (highestBid) {
        image.isBidSold = true;
        image.soldTo = highestBid.user;
        await image.save();

        await createNotification(
          "Congratulations! You've won the bid",
          `Congratulations! You've won the bid for the image: ${image.imageTitle}`,
          highestBid.user
        );

        await createNotification(
          'Your image has been sold',
          `Your image "${image.imageTitle}" has been sold for $${highestBid.bidAmount}`,
          image.uploadedBy
        );
      }
    }

    console.log('Bidding expiration job executed successfully');
  } catch (error) {
    console.error('Error in bidding expiration job:', error);
  }
});
