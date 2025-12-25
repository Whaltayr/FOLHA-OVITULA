import { useEffect, useState } from 'react';
import { getPosts } from './services/posts';

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getPosts().then(data => setPosts(data.data)).catch(console.error);
  }, []);

  return (
    <div>
      <h1>Posts</h1>
      {posts.map(post => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.slug}</p>
        </div>
      ))}
    </div>
  );
}
