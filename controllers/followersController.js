import mongoose from 'mongoose';
import Follower from '../models/followersModel.js';
import User from '../models/userModel.js';

export const followUser = async (req, res) => {
  const { id } = req.user; // Extracting user from token
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide the user to follow!',
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    if (id === userId) {
      return res.status(400).json({
        success: false,
        message: 'User cannot follow themselves',
      });
    }

    const existingFollow = await Follower.findOne({
      user: userId,
      follower: id,
    });
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user',
      });
    }

    const follow = new Follower({ user: userId, follower: id });
    await follow.save();

    // Update `following` array in current user
    await User.findByIdAndUpdate(id, {
      $addToSet: { following: userId },
    });

    // Update `followers` array in the followed user
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: id },
    });

    res.status(201).json({
      success: true,
      message: 'Followed successfully',
      data: follow,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const unfollowUser = async (req, res) => {
  const { id } = req.user; // Extracting user from token
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide the user to unfollow!',
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const existingFollow = await Follower.findOneAndDelete({
      user: userId,
      follower: id,
    });
    if (!existingFollow) {
      return res.status(404).json({
        success: false,
        message: 'Follow relationship not found',
      });
    }

    // Update `following` array in current user
    await User.findByIdAndUpdate(id, {
      $pull: { following: userId },
    });

    // Update `followers` array in the unfollowed user
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: id },
    });

    res.status(200).json({
      success: true,
      message: 'Unfollowed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getFollowers = async (req, res) => {
  const { id } = req.user.id; // Extracting user from token

  try {
    const followers = await Follower.find({ user: id }).populate(
      'follower',
      'username email profilePicture'
    );
    res.status(200).json({
      success: true,
      message: 'Followers retrieved successfully',
      data: followers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getFollowing = async (req, res) => {
  const { id } = req.user.id; // Extracting user from token

  try {
    const following = await Follower.find({ follower: id }).populate(
      'user',
      'username email profilePicture'
    );
    res.status(200).json({
      success: true,
      message: 'Following retrieved successfully',
      data: following,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
export const getUserFollowDetails = async (req, res) => {
  const { id } = req.user; // Extracting logged-in user ID from token
  const { userIdToCheck } = req.params; // Extracting user ID from params

  if (!userIdToCheck) {
    return res.status(400).json({
      success: false,
      message: 'Please provide the user ID to check!',
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userIdToCheck)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Check if the logged-in user is following the specified user
    const isFollowing = await Follower.findOne({
      user: userIdToCheck,
      follower: id,
    });

    // Get all followers of the specified user
    const followers = await Follower.find({ user: userIdToCheck }).populate(
      'follower',
      'username email profilePicture'
    );
    const followersCount = followers.length;

    // Get all users the specified user is following
    const following = await Follower.find({ follower: userIdToCheck }).populate(
      'user',
      'username email profilePicture'
    );
    const followingCount = following.length;

    res.status(200).json({
      success: true,
      message: 'User follow details retrieved successfully',
      isFollowing: !!isFollowing,
      data: {
        followers: {
          list: followers,
          count: followersCount,
        },
        following: {
          list: following,
          count: followingCount,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
