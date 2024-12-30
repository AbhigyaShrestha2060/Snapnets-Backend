import path from 'path';
import imageModel from '../models/imageModel.js';

export const addImage = async (req, res) => {
  console.log('body', req.body);
  console.log('files', req.files);

  const { title, description, isPortrait } = req.body;

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

  // Access the authenticated user's ID from the token
  const uploadedBy = req.user.id;
  console.log('uploadedBy', uploadedBy);

  const { newImage } = req.files;
  const imageName = `${Date.now()}_${newImage.name}`;
  const imagePath = path.join(
    'D:SoftwaricaLast SemUIUXSnapnetssnapnets-backend', // Ensure you're using the correct directory path
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
      uploadedBy: uploadedBy, // Use the user ID from the token
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
      .populate('uploadedBy', 'username');

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
