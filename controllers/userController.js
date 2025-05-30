import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import path from 'path';
import Follower from '../models/followersModel.js'; // Import the Follower model
import userModel from '../models/userModel.js';
export const createUser = async (req, res) => {
  console.log(req.body);
  const { email, username, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please enter all fields!',
    });
  }

  try {
    const existingUser = await userModel.findOne({
      email: email,
    });
    const existingUserName = await userModel.findOne({
      username: username,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email Already Exists',
      });
    }

    if (existingUserName) {
      return res.status(400).json({
        success: false,
        message: 'Username Already Exists',
      });
    }

    // Hash the password
    const randomSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, randomSalt);

    const newUser = new userModel({
      username: username,
      email: email,
      password: hashedPassword,
    });
    // Save to database
    await newUser.save();

    // Send the response
    res.status(201).json({
      success: true,
      message: 'User Created Successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
export const loginUser = async (req, res) => {
  // 1. Check incoming data
  console.log(req.body);

  // 2. DesStructure the incoming data
  const { email, password } = req.body;

  // 3. Validate the data (if empty, stop the process and send response)
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please enter all fields!',
    });
  }
  try {
    // 4. Check if the user is already registered
    const user = await userModel.findOne({ email: email });
    // found data: fullName, phoneNumber, email, password

    // 4.1 if user not found: Send response
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }
    // 4.2 if user found
    // 5. Check if the password is correct
    const passwordCorrect = await bcrypt.compare(password, user.password);
    // 5.1 if password is wrong: Send response
    if (!passwordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Password',
      });
    }

    // 5.2 if password is correct

    // Token (generate -user data and key)
    const token = await jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );
    // Send the response (token, user data)
    res.status(201).json({
      success: true,
      message: 'User logged in successfully',
      token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const editUser = async (req, res) => {
  const { username, email, phoneNumber } = req.body;
  if (!username || !email || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Please enter all fields!',
    });
  }

  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    user.username = username;
    user.email = email;
    user.phoneNumber = phoneNumber;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const editProfilePicture = async (req, res) => {
  console.log('Files:', req.files);

  // Validate that the profile picture is provided
  if (!req.files || !req.files.newImage) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an Image!',
    });
  }

  const { newImage } = req.files;

  // Generate a unique name for the image
  const imageName = `${Date.now()}_${newImage.name}`;

  // Define the image path
  const imagePath = path.join(
    'D:SoftwaricaLast SemUIUXSnapnetssnapnets-backend', // Ensure you're using the correct directory path
    '../public/user/', // Get the current directory
    imageName
  );

  // Move the uploaded image to the 'public/user/' directory
  try {
    // Ensure the 'user' directory exists
    const userDirectory = path.join(
      'D:SoftwaricaLast SemUIUXSnapnetssnapnets-backend', // Ensure you're using the correct directory path
      '../public/user/'
    );
    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true });
    }

    // Move the image file to the destination directory
    newImage.mv(imagePath, async (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
        });
      }

      // Find the user by ID
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update the profile picture in the database with the new image path
      user.profilePicture = `/user/${imageName}`;
      await user.save();

      // Respond with the success message
      res.status(200).json({
        success: true,
        message: 'Profile Picture updated successfully',
        user: user,
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get all followers of the user
    const followers = await Follower.find({ user: user._id }).populate(
      'follower',
      'username email profilePicture'
    );
    const followersCount = followers.length;

    // Get all users the user is following
    const following = await Follower.find({ follower: user._id }).populate(
      'user',
      'username email profilePicture'
    );
    const followingCount = following.length;

    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        profilePicture: user.profilePicture,
        isGoogleUser: user.isGoogleUser,
        followersCount,
        followingCount,
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

// Change Password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 1. Check if the currentPassword and newPassword are provided
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both current password and new password!',
    });
  }

  try {
    // 2. Find the user from the database
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
      });
    }

    // 3. Compare the current password with the one in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect!',
      });
    }

    // 4. Check if the new password is the same as the current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as the current password!',
      });
    }

    // 5. Hash the new password before saving it
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 6. Update the user's password in the database
    user.password = hashedNewPassword;
    await user.save();

    // 7. Send response
    res.status(200).json({
      success: true,
      message: 'Password changed successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Google token is required!',
    });
  }

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub: googleId } = ticket.getPayload();

    // Check if the user already exists in the database
    let user = await userModel.findOne({ email });

    if (!user) {
      // Create a new user if one doesn't exist
      user = new userModel({
        email,
        username: name,
        profilePicture: null,
        googleId,
        password: 'null',
        fullName: name,
        phoneNumber: 'null',
        isGoogleUser: true,
      });

      await user.save();
    }

    // Generate JWT token for the user
    const jwtToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );

    // Send response with the JWT token and user details
    res.status(200).json({
      success: true,
      message: 'Google login successful!',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Error during Google login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during Google login',
    });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await userModel.find();

    // If no users are found, send a response
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found',
      });
    }

    // Send the response with the list of users
    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin,
        isGoogleUser: user.isGoogleUser,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
export const getFollowersAndFollowing = async (req, res) => {
  try {
    // Fetch the user by ID
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch details of all followers
    const followers = await userModel
      .find({ _id: { $in: user.followers } })
      .select('id username email profilePicture');

    // Fetch details of all following
    const following = await userModel
      .find({ _id: { $in: user.following } })
      .select('id username email profilePicture');

    // Send the response with followers and following data, including their counts
    res.status(200).json({
      success: true,
      message: 'Followers and following fetched successfully',
      data: {
        followersCount: followers.length, // Count of followers
        followingCount: following.length, // Count of following
        followers,
        following,
      },
    });
  } catch (error) {
    console.error('Error fetching followers and following:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Request OTP for password reset
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email!',
    });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not registered!',
      });
    }

    // Generate a random OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set OTP and expiry in the database
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = Date.now() + 15 * 60 * 1000; // OTP valid for 15 minutes
    await user.save();

    // Configure nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It will expire in 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email.',
    });
  } catch (error) {
    console.error('Error during password reset request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// Verify OTP and reset the password
export const verifyResetOTP = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, OTP, and new password!',
    });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
      });
    }

    // Check if OTP matches and is not expired
    if (
      user.resetPasswordOTP !== otp ||
      !user.resetPasswordOTPExpiry ||
      user.resetPasswordOTPExpiry < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP!',
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and clear OTP fields
    user.password = hashedNewPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully!',
    });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { password } = req.body;

    // Check if the password is provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete the account',
      });
    }

    // Find the user by ID
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Compare the provided password with the stored password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Delete the user if the password matches
    await userModel.findByIdAndDelete(req.user.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
