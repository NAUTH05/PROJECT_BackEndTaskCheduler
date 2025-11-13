import Comment from '../Public/models/Comment.js';

export const checkCommentOwner = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }

    if (comment.CreatedByUserID !== userId) {
      return res.status(403).json({
        message: 'You can only edit or delete your own comments'
      });
    }

    req.comment = comment;
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Error checking comment ownership',
      error: error.message
    });
  }
};
