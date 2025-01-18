import Comments from '../models/commentModel.js';
import Images from '../models/imageModel.js';

export const addCommentToImage = async (req, res) => {
  const { imageId, comment } = req.body;

  // 1. Validate the data
  if (!imageId || !comment) {
    return res.status(400).json({
      success: false,
      message: 'Image ID and comment are required!',
    });
  }

  try {
    // 2. Fetch the image by imageId
    const image = await Images.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found!',
      });
    }

    // 3. Fetch the user from req.user.id (user is authenticated)
    const user = req.user.id; // User ID is already available via token
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated!',
      });
    }

    // 4. Create a new comment document
    const newComment = new Comments({
      comment: comment,
      commentedBy: user, // Store the user who commented
    });

    // 5. Save the comment to the database
    await newComment.save();

    // 6. Add the comment reference to the image
    image.comments.push(newComment._id); // Push the comment ID into the comments array
    await image.save();

    // 7. Return success response with the updated image
    res.status(201).json({
      success: true,
      message: 'Comment added successfully!',
      image: image, // You can also return the updated comments array here
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
export const getCommentsForImage = async (req, res) => {
  try {
    // 2. Fetch the image by imageId
    const image = await Images.findById(req.params.id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found!',
      });
    }

    // 3. Populate the comments with actual comment data and sort by commentDate (including time)
    const populatedImage = await Images.findById(req.params.id)
      .populate({
        path: 'comments',
        populate: {
          path: 'commentedBy', // Populate the user info who commented
          select: 'username email profilePicture', // Select fields to return for the user (e.g., username, email)
        },
        options: {
          sort: { commentDate: -1 }, // Sort comments by commentDate (descending, latest first)
        },
      })
      .exec();

    // 4. Return the image with populated comments
    res.status(200).json({
      success: true,
      image: populatedImage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
