import path from 'path';
import imageModel from '../models/imageModel.js';
import userModel from '../models/userModel.js';

export const addImage = async (req, res) => {
  const { title, description, isPortrait, keywords } = req.body;

  // Validate required fields
  if (!title || !description || !isPortrait) {
    return res.status(400).json({
      success: false,
      message: 'Please enter all fields!',
    });
  }

  if (!req.files || !req.files.newImage) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image!',
    });
  }

  // Validate keywords
  const keywordArray = keywords
    ? keywords.split(',').map((kw) => kw.trim())
    : [];
  if (keywordArray.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least 3 keywords!',
    });
  }

  const uploadedBy = req.user.id;
  const { newImage } = req.files;
  const imageName = `${Date.now()}_${newImage.name}`;
  const imagePath = path.join(
    'D:SoftwaricaLast SemUIUXSnapnetssnapnets-backend',
    '../public/images/',
    imageName
  );

  try {
    // Move the uploaded file to the desired location
    await newImage.mv(imagePath);

    // Create a new image document in the database
    const image = new imageModel({
      image: imageName,
      imageTitle: title,
      imageDescription: description,
      isPortrait: isPortrait,
      keywords: keywordArray, // Store the keywords array
      uploadedBy: uploadedBy,
    });

    await image.save();

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image: image,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAllImages = async (req, res) => {
  try {
    const images = await imageModel.find();
    res.status(200).json({
      success: true,
      message: 'All images fetched successfully',
      images: images,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getImageById = async (req, res) => {
  try {
    const image = await imageModel
      .findById(req.params.id)
      .populate('uploadedBy', 'username profilePicture');

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image fetched successfully',
      image: image,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const image = await imageModel.findById(req.params.id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }
    await imageModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const toggleImageLike = async (req, res) => {
  try {
    // Access the authenticated user's ID from the token
    const userId = req.user.id;
    console.log('userId', userId);

    const image = await imageModel.findById(req.params.id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    // Check if the user has already liked the image
    const userIndex = image.likedBy.indexOf(userId);

    if (userIndex !== -1) {
      // User has already liked the image, so unlike it
      image.likedBy.splice(userIndex, 1); // Remove userId from likedBy array
      image.totalLikes -= 1; // Decrement like count
      await image.save();

      return res.status(200).json({
        success: true,
        message: 'Image unliked successfully',
        likes: image.totalLikes,
      });
    } else {
      // User has not liked the image, so like it
      image.likedBy.push(userId); // Add userId to likedBy array
      image.totalLikes += 1; // Increment like count
      await image.save();

      return res.status(200).json({
        success: true,
        message: 'Image liked successfully',
        likes: image.totalLikes,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAllImagesWithLikeStatus = async (req, res) => {
  try {
    // Access the authenticated user's ID from the token
    const userId = req.user.id;

    // Fetch all images from the database
    const images = await imageModel.find().populate('uploadedBy', 'username');

    // Map over the images and include the like status for the authenticated user
    const imagesWithLikeStatus = images.map((image) => ({
      ...image.toObject(),
      isLikedByUser: image.likedBy.includes(userId), // Check if the user ID is in the likedBy array
    }));

    res.status(200).json({
      success: true,
      message: 'All images fetched successfully with like status',
      images: imagesWithLikeStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getLikedImagesByUser = async (req, res) => {
  try {
    // Access the authenticated user's ID from the token
    const userId = req.user.id;
    console.log('userId', userId);

    // Fetch all images where the user is in the likedBy array
    const likedImages = await imageModel
      .find({ likedBy: userId }) // Filter images by the user ID in the likedBy array
      .populate('uploadedBy', 'username'); // Optional: populate the uploadedBy field to get user information

    if (likedImages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No liked images found for this user',
      });
    }

    // Add isLikedByUser property to each image
    const responseImages = likedImages.map((image) => ({
      ...image.toObject(), // Convert the Mongoose document to a plain object
      isLikedByUser: image.likedBy.includes(userId), // Check if the current user has liked this image
    }));

    res.status(200).json({
      success: true,
      message: 'Liked images fetched successfully',
      total_likedImages: likedImages.length,
      images: responseImages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const searchImagesByKeywords = async (req, res) => {
  const { keywords } = req.query;

  if (!keywords) {
    return res.status(400).json({
      success: false,
      message: 'Please provide keywords to search!',
    });
  }

  try {
    const keywordArray = keywords
      .split(',')
      .map((kw) => kw.trim().toLowerCase());
    const images = await imageModel
      .find({
        keywords: { $in: keywordArray }, // Match any of the keywords
      })
      .populate('uploadedBy', 'username');

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found for the provided keywords',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Images fetched successfully',
      images: images,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getImagesUploadedByUser = async (req, res) => {
  try {
    // Access the authenticated user's ID from the token
    const userId = req.user.id;

    // Fetch all images uploaded by the user
    const userImages = await imageModel
      .find({ uploadedBy: userId }) // Filter images by the user ID in the uploadedBy field
      .populate('uploadedBy', 'username'); // Optional: populate the uploadedBy field to get user information

    if (userImages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found uploaded by this user',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Images uploaded by the user fetched successfully',
      total_userImages: userImages.length,
      images: userImages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
export const editImage = async (req, res) => {
  const userId = req.user.id; // Retrieve user ID from the token
  const { id } = req.params; // Get the image ID from the URL params
  const { title, description, isPortrait, keywords } = req.body; // Data to update

  try {
    // Fetch the image by ID
    const image = await imageModel.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    // Check if the authenticated user is the uploader
    if (image.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this image',
      });
    }

    // Validate keywords
    let keywordArray = [];
    if (keywords) {
      keywordArray = keywords.split(',').map((kw) => kw.trim());
      if (keywordArray.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least 3 keywords!',
        });
      }
    }

    // Update the image details
    image.imageTitle = title || image.imageTitle;
    image.imageDescription = description || image.imageDescription;
    image.isPortrait = isPortrait !== undefined ? isPortrait : image.isPortrait;
    if (keywords) image.keywords = keywordArray;

    await image.save();

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      image: image,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMostLikedImages = async (req, res) => {
  try {
    const { limit = 10 } = req.query; // Allow a limit to be passed via query params, default to 10

    // Find images sorted by totalLikes in descending order
    const mostLikedImages = await imageModel
      .find()
      .sort({ totalLikes: -1 }) // Sort by totalLikes in descending order
      .limit(parseInt(limit)) // Limit the number of images fetched
      .populate('uploadedBy', 'username'); // Optionally, populate the uploadedBy field

    if (!mostLikedImages.length) {
      return res.status(404).json({
        success: false,
        message: 'No images found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Most liked images fetched successfully',
      images: mostLikedImages, // This will be an array of image objects
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getImagesByUserIdWithLikeStatus = async (req, res) => {
  try {
    const loggedInUserId = req.user.id; // Logged-in user's ID
    const { userId } = req.params; // ID of the user whose images we are fetching

    // Fetch user details (username and profilePicture)
    const user = await userModel
      .findById(userId)
      .select('username profilePicture');

    // If user does not exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch all images uploaded by the specified user
    const userImages = await imageModel.find({ uploadedBy: userId }); // No need to populate 'uploadedBy'

    // If no images are found for the user
    if (userImages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found uploaded by this user',
        username: user.username,
        profilePicture: user.profilePicture,
        totalImages: 0,
        totalLikes: 0,
        images: [],
      });
    }

    // Calculate total likes across all images by the user
    const totalLikes = userImages.reduce(
      (sum, image) => sum + (image.totalLikes || 0),
      0
    );

    // Map images with like status for the logged-in user
    const imagesWithLikeStatus = userImages.map((image) => ({
      ...image.toObject(),
      isLikedByLoggedInUser: image.likedBy.includes(loggedInUserId),
    }));

    res.status(200).json({
      success: true,
      message:
        'Images uploaded by the user fetched successfully with like status',
      username: user.username,
      profilePicture: user.profilePicture,
      totalImages: imagesWithLikeStatus.length,
      totalLikes: totalLikes,
      images: imagesWithLikeStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
