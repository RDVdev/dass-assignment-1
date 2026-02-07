import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function ForumPage() {
  const [eventId, setEventId] = useState('');
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');

  const loadPosts = async (id) => {
    if (!id) return;
    const { data } = await api.get(`/forum/events/${id}/posts`);
    setPosts(data.posts || []);
  };

  useEffect(() => {
    loadPosts(eventId);
  }, [eventId]);

  const submit = async (e) => {
    e.preventDefault();
    await api.post(`/forum/events/${eventId}/posts`, { content });
    setContent('');
    loadPosts(eventId);
  };

  return (
    <section>
      <h2>Discussion Forum</h2>
      <div className="card">
        <input placeholder="Event ID" value={eventId} onChange={(e) => setEventId(e.target.value)} />
      </div>
      <form className="card" onSubmit={submit}>
        <textarea placeholder="Ask a question / post update" value={content} onChange={(e) => setContent(e.target.value)} required />
        <button type="submit">Post</button>
      </form>
      <div className="grid">
        {posts.map((post) => (
          <article className="card" key={post._id}>
            <p>{post.content}</p>
            <small>
              {post.author?.name} ({post.author?.role})
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
