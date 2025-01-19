import moment from 'moment';
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
    // Fetch the image by imageId and populate uploader and comments
    const populatedImage = await Images.findById(req.params.id)
      .populate({
        path: 'uploadedBy', // Populate the uploader's details
        select: 'username email profilePicture', // Select specific fields for uploader
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'commentedBy', // Populate the user who commented
          select: 'username email profilePicture', // Select specific fields for the commenter
        },
        options: {
          sort: { commentDate: -1 }, // Sort comments by commentDate (descending)
        },
      })
      .exec();

    // Check if the image exists
    if (!populatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Image not found!',
      });
    }

    // Format comments with properly formatted dates
    const formattedComments = populatedImage.comments.map((comment) => ({
      id: comment._id,
      comment: comment.comment,
      commentedBy: comment.commentedBy,
      commentDate: moment(comment.commentDate).format('YYYY-MM-DD HH:mm:ss'), // Format comment date
    }));

    // Format the uploaded date
    const formattedUploadedDate = moment(populatedImage.uploadDate).format(
      'YYYY-MM-DD HH:mm:ss'
    ); // Format upload date

    // Check if the current user has liked the image
    const hasLiked = populatedImage.likedBy.includes(req.user.id);

    // Return the image with all its details, uploader, like status, and comments
    res.status(200).json({
      success: true,
      image: {
        id: populatedImage._id,
        imageTitle: populatedImage.imageTitle,
        imageDescription: populatedImage.imageDescription,
        image: populatedImage.image, // Image URL or path
        totalLikes: populatedImage.totalLikes, // Number of likes
        likedBy: populatedImage.likedBy, // Users who liked the image
        keywords: populatedImage.keywords, // Keywords associated with the image
        isPortrait: populatedImage.isPortrait, // Whether the image is portrait
        isReadyToBid: populatedImage.isReadyToBid, // Image availability for bidding
        uploadedBy: populatedImage.uploadedBy, // Include uploader details
        uploadedDate: formattedUploadedDate, // Include formatted uploaded date
        hasLiked: hasLiked, // New field to indicate if the current user has liked the image
        comments: formattedComments, // Include formatted comments
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
