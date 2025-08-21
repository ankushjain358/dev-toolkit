'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { Authenticator } from '@aws-amplify/ui-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  ImageIcon,
  Save,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { nanoid } from 'nanoid';

const client = generateClient<Schema>();

interface BlogEditorProps {
  params: Promise<{ id: string }>;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  state: 'PUBLISHED' | 'UNPUBLISHED';
  profileImage?: string;
  userId: string;
}

function BlogEditorContent({ params }: BlogEditorProps) {
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your blog post...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(true);
      debouncedSave();
    },
  });

  // Debounced auto-save function (15 seconds)
  const debouncedSave = useCallback(
    debounce(() => {
      if (hasUnsavedChanges && blog) {
        handleAutoSave();
      }
    }, 15000),
    [hasUnsavedChanges, blog]
  );

  useEffect(() => {
    initializeBlog();
  }, []);

  const initializeBlog = async () => {
    try {
      const { id } = await params;
      const user = await getCurrentUser();
      
      console.log('Current user in editor:', user);
      
      const { data } = await client.models.Blogs.get({ id });
      
      if (!data) {
        toast.error('Blog not found');
        router.push('/dashboard');
        return;
      }

      console.log('Loaded blog:', data);

      setBlog(data);
      setTitle(data.title);
      setCoverImage(data.profileImage || '');
      
      if (editor) {
        editor.commands.setContent(data.content || '');
      }
    } catch (error) {
      console.error('Error loading blog:', error);
      toast.error('Failed to load blog');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!blog || !editor || saving) return;

    setSaving(true);
    try {
      const content = editor.getHTML();
      
      await client.models.Blogs.update({
        id: blog.id,
        title,
        content,
        profileImage: coverImage || undefined,
      });

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success('Auto-saved', { duration: 2000 });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Auto-save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!blog || !editor) return;

    setSaving(true);
    try {
      const content = editor.getHTML();
      
      await client.models.Blogs.update({
        id: blog.id,
        title,
        content,
        profileImage: coverImage || undefined,
      });

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success('Blog saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !blog) return;

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `img_${nanoid()}.${fileExtension}`;
      const key = `blogs/${blog.id}/${fileName}`; // Removed 'public/' prefix

      toast.loading('Uploading image...', { id: 'image-upload' });

      const result = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      const url = await getUrl({ key: result.key });
      
      if (editor) {
        editor.chain().focus().setImage({ src: url.url.toString() }).run();
      }

      toast.success('Image uploaded successfully!', { id: 'image-upload' });
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image', { id: 'image-upload' });
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !blog) return;

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `cover_${nanoid()}.${fileExtension}`;
      const key = `blogs/${blog.id}/${fileName}`; // Removed 'public/' prefix

      toast.loading('Uploading cover image...', { id: 'cover-upload' });

      const result = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      const url = await getUrl({ key: result.key });
      setCoverImage(url.url.toString());
      setHasUnsavedChanges(true);

      toast.success('Cover image uploaded successfully!', { id: 'cover-upload' });
    } catch (error) {
      console.error('Cover image upload failed:', error);
      toast.error('Failed to upload cover image', { id: 'cover-upload' });
    }
  };

  const togglePublishState = async () => {
    if (!blog) return;

    try {
      const newState = blog.state === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
      
      await client.models.Blogs.update({
        id: blog.id,
        state: newState,
      });

      setBlog(prev => prev ? { ...prev, state: newState } : null);
      toast.success(`Blog ${newState.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Failed to update blog state:', error);
      toast.error('Failed to update blog state');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Blog not found</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Edit Blog</h1>
                {lastSaved && (
                  <p className="text-sm text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600">Unsaved changes</span>
              )}
              {saving && (
                <span className="text-sm text-blue-600">Saving...</span>
              )}
              
              <button
                onClick={handleManualSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save size={16} />
                Save
              </button>
              
              <button
                onClick={togglePublishState}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  blog.state === 'PUBLISHED'
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {blog.state === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                {blog.state === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Title and Cover Image Section */}
          <div className="p-6 border-b">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter blog title..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer transition-colors"
                >
                  Upload Cover Image
                </label>
                {coverImage && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={coverImage} 
                      alt="Cover" 
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <button
                      onClick={() => {
                        setCoverImage('');
                        setHasUnsavedChanges(true);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editor Toolbar */}
          <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor?.isActive('bold') ? 'bg-gray-200' : ''
              }`}
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor?.isActive('italic') ? 'bg-gray-200' : ''
              }`}
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor?.isActive('bulletList') ? 'bg-gray-200' : ''
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor?.isActive('orderedList') ? 'bg-gray-200' : ''
              }`}
            >
              <ListOrdered size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor?.isActive('blockquote') ? 'bg-gray-200' : ''
              }`}
            >
              <Quote size={16} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors"
            >
              <ImageIcon size={16} />
            </label>
            
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            
            <button
              onClick={() => editor?.chain().focus().undo().run()}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
            >
              <Redo size={16} />
            </button>
          </div>

          {/* Editor Content */}
          <div className="p-6">
            <EditorContent 
              editor={editor} 
              className="prose prose-lg max-w-none min-h-[400px] focus:outline-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function BlogEditorPage({ params }: BlogEditorProps) {
  return (
    <Authenticator>
      <BlogEditorContent params={params} />
    </Authenticator>
  );
}
