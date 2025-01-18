import Board from '../models/boardModel.js';
import Image from '../models/imageModel.js';

// Create a new board
export const createBoard = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if a board with the same title already exists for the user
    const existingBoard = await Board.findOne({ title, user: userId });
    if (existingBoard) {
      return res
        .status(400)
        .json({ error: 'A board with this title already exists' });
    }

    const newBoard = new Board({ title, user: userId });
    const savedBoard = await newBoard.save();

    res
      .status(201)
      .json({ message: 'Board created successfully', board: savedBoard });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error creating board', details: error.message });
  }
};

// Add multiple images to a board
export const addImagesToBoard = async (req, res) => {
  try {
    const { boardId, imageIds } = req.body; // `imageIds` should be an array of image IDs

    if (!boardId || !imageIds || !Array.isArray(imageIds)) {
      return res
        .status(400)
        .json({ error: 'Board ID and an array of Image IDs are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const validImageIds = [];
    for (const imageId of imageIds) {
      const image = await Image.findById(imageId);
      if (image && !board.lists.includes(imageId)) {
        validImageIds.push(imageId); // Add only valid and non-duplicate images
      }
    }

    if (validImageIds.length === 0) {
      return res.status(400).json({ error: 'No valid or new images to add' });
    }

    board.lists.push(...validImageIds);
    const updatedBoard = await board.save();

    res.status(200).json({
      message: 'Images added to board successfully',
      board: updatedBoard,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error adding images to board', details: error.message });
  }
};

// Remove an image from a board
export const removeImageFromBoard = async (req, res) => {
  try {
    const { boardId, imageId } = req.body;

    if (!boardId || !imageId) {
      return res
        .status(400)
        .json({ error: 'Board ID and Image ID are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const imageIndex = board.lists.indexOf(imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found in the board' });
    }

    board.lists.splice(imageIndex, 1); // Remove the image from the board
    const updatedBoard = await board.save();

    res.status(200).json({
      message: 'Image removed from board successfully',
      board: updatedBoard,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error removing image from board',
      details: error.message,
    });
  }
};

// Delete a board
export const deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }

    const board = await Board.findByIdAndDelete(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.status(200).json({ message: 'Board deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error deleting board', details: error.message });
  }
};

// View a specific board
export const viewBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }

    const board = await Board.findById(boardId)
      .populate('user', 'name email') // Adjust fields as necessary
      .populate('lists'); // Fetch full image details

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.status(200).json({ message: 'Board fetched successfully', board });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error fetching board', details: error.message });
  }
};

// Get all boards of a user
export const getAllBoardsOfUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const boards = await Board.find({ user: userId }).populate('lists');
    if (!boards || boards.length === 0) {
      return res.status(404).json({ error: 'No boards found for this user' });
    }

    res.status(200).json({ message: 'Boards fetched successfully', boards });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error fetching boards', details: error.message });
  }
};
