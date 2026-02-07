import DiscussionPost from '../models/DiscussionPost.js';
import Event from '../models/Event.js';

export const listPostsByEvent = async (req, res) => {
  const { eventId } = req.params;
  const posts = await DiscussionPost.find({ event: eventId })
    .populate('author', 'name role')
    .sort({ createdAt: 1 });
  res.json({ posts });
};

export const addPost = async (req, res) => {
  const { eventId } = req.params;
  const { content } = req.body;

  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const post = await DiscussionPost.create({
    event: eventId,
    author: req.user._id,
    content
  });

  const populated = await post.populate('author', 'name role');
  res.status(201).json({ post: populated });
};
