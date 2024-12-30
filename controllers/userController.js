import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
// const sentOtp = require('../service/sendOtp');
// const sendEmail = require('../service/otpEmailService');
// const { OAuth2Client } = require('google-auth-library');
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// const path = require('path');
// const axios = require('axios');
// const fs = require('fs');

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
  const { profilePicture } = req.body;
  if (!profilePicture) {
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
    user.profilePicture = profilePicture;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile Picture updated successfully',
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

export const getUserById = async (req, res) => {};
