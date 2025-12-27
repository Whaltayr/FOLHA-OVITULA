import { Link } from 'react-router-dom';
import { useEffect,useState } from 'react';
import { getAdminPosts,  deletePost } from '../../services/api';

export default function AdminPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    
    useEffect(()=>{
        setLoading(true);
        getAdminPosts().then(data => setPosts(data)).catch(err => setError(err.message || 'Falha ao Carregar')).finally(()=> setLoading(false));
    }, []);

    async function handeDelete(id) {
        if(!confirm('Deletar post?')) return;
        setDeletingId(id);
        try {
            await deletePost(id);
            setPosts(ps => ps.filter(p => p.id !== id));
        } catch (err) {
            alert('Falha ao deletar: ' + (err.message || ''));
        } finally{
            setDeletingId(null);
        }
    }
    if (loading) {
        return <div className='p-6'>Carregando...</div>;
    }
    if (error) {
        return <div className='p-6 text-red-600'>Erro: {error}</div>;
    }


    return(
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className='font-bold text-2xl'>Posts</h1>
                <Link to="/admin/posts/new" className='px-3 py-2 rounded bg-blue-600 text-white'>Novo Post</Link>
            </div>

            <div className="space-y-4">
                {posts.length===0 && <div className='text-gray-600'>Sem posts ainda.</div>}
                {posts.map(p =>(
                    <div key={p.id} className='bg-white p-4 rounded shadow flex justify-between items-start'>
                        <div >
                            <Link to={`/post${p.slug}`} className='text-lg font-semibold hover:underline'>{p.title}</Link>
                            <div className="text-sm text-gray-500">{p.slug} | {p.status} | {p.published_at ? new Date(p.published_at).toLocaleString() :'-'}</div>

                            <div className="flex gap-2">
                                <Link to={`/admin/posts/${p.id}/edit`} className='px-3 py-1 mt-2 bg-yellow-50 border rounded-4xl text-sm'>Editar</Link>
                                <button onClick={()=> handeDelete(p.id)}
                                    className='px-3 py-1  bg-red-50 border rounded-4xl mt-2 text-sm text-red-600'>Deletar</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}