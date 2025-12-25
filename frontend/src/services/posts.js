const API = import.meta.env.VITE_API_URL;

export async function getPosts() {
  const res = await fetch(`${API}/posts`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function getPostBySlug(slug) {
  const res = await fetch(`${API}/posts/${slug}`);
  if (!res.ok) throw new Error('Post not found');
  return res.json();
}

export async function createPost(data, token) {
  const res = await fetch(`${API}/posts/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}
