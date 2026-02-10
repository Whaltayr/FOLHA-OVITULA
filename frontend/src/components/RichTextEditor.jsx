// frontend/src/components/RichTextEditor.jsx
import { useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { uploadFile } from '../services/api';

/*
  Este componente encapsula a lógica complexa do editor.
  Ele intercepta o botão de imagem para fazer upload para o servidor
  em vez de converter para Base64 (que deixaria o banco de dados lento).
*/

export default function RichTextEditor({ value, onChange }) {
  const quillRef = useRef(null);

  // Custom Image Handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          // 1. Upload para o nosso backend
          const res = await uploadFile(file);
          const url = res.url; // A URL retornada pelo backend

          // 2. Inserir a imagem no editor na posição do cursor
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          
          // Insere a tag <img src="url" />
          quill.insertEmbed(range.index, 'image', url);
          
          // Move o cursor para depois da imagem
          quill.setSelection(range.index + 1);

        } catch (err) {
          console.error('Erro no upload de imagem do editor:', err);
          alert('Falha ao enviar imagem. Tente novamente.');
        }
      }
    };
  };

  // Configuração dos Módulos (Barra de Ferramentas)
  // Usamos useMemo para evitar que o editor recarregue a cada digitação
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [2, 3, false] }], // H2, H3, Normal
        ['bold', 'italic', 'underline', 'strike'], // Formatação básica
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Listas
        ['link', 'image', 'video'], // Mídia
        ['clean'] // Limpar formatação
      ],
      handlers: {
        image: imageHandler // Substitui o handler padrão pelo nosso
      }
    }
  }), []);

  return (
    <div className="bg-white">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        className="h-96 mb-12" // Altura fixa com margem para a barra de status
      />
    </div>
  );
}