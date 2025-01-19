import mongoose from 'mongoose';
import Follower from '../models/followersModel.js';

export const followUser = async (req, res) => {
  const { id } = req.user; // Extracting user from token
  const { followUserId } = req.body;

  if (!followUserId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide the user to follow!',
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(followUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Prevent users from following themselves
    if (id === followUserId) {
      return res.status(400).json({
        success: false,
        message: 'User cannot follow themselves',
      });
    }

    // Check if the follow relationship already exists
    const existingFollow = await Follower.findOne({
      user: followUserId,
      follower: id,
    });
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user',
      });
    }

    // Create a new follow relationship
    const follow = new Follower({ user: followUserId, follower: id });
    await follow.save();

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
  const { unfollowUserId } = req.body;

  if (!unfollowUserId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide the user to unfollow!',
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(unfollowUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Check if the follow relationship exists
    const existingFollow = await Follower.findOneAndDelete({
      user: unfollowUserId,
      follower: id,
    });
    if (!existingFollow) {
      return res.status(404).json({
        success: false,
        message: 'Follow relationship not found',
      });
    }

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
