'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { BlockNoteView } from "@blocknote/shadcn";
import { uploadData, getUrl } from 'aws-amplify/storage';
import { BlockNoteEditor, PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';

import {
    Save,
    Eye,
    EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn, convertToHTML } from "@/lib/utils";
import outputs from '@/../amplify_outputs.json';

const client = generateClient<Schema>();

interface BlogEditorProps {
    params: Promise<{ id: string }>;
}

export default function BlogEditorPage({ params }: BlogEditorProps) {
    const router = useRouter();
    const blogRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [coverImage, setCoverImage] = useState<string>('');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const uploadImageHandler = async (file: File, blockId?: string) => {
        try {
            if (!blogRef.current) return "";
            const fileExtension = file.name.split('.').pop();
            const fileName = `img_${nanoid()}.${fileExtension}`;
            const key = `public/blogs/${blogRef.current.id}/${fileName}`;

            const result = await uploadData({
                path: key,
                data: file,
            }).result;

            const url = await getUrl({ path: result.path });
            const distributionUrl = `https://${outputs.custom.distributionDomainName}/${key}`;
            return distributionUrl;
        } catch (error) {
            console.error('Image upload failed:', error);
            toast.error('Failed to upload image');
            return "";
        }
    };

    const onEditorContentChange = () => {
        setHasUnsavedChanges(true);
        debouncedSave();
    };

    const handlePaste = ({ event, editor, defaultPasteHandler }: any) => {
        const items = event.clipboardData?.items;
        if (!items) return defaultPasteHandler();

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file && blogRef.current) {
                    uploadImageHandler(file).then(url => {
                        if (url) {
                            editor.insertBlocks(
                                [{
                                    type: "image",
                                    props: {
                                        url: url,
                                        caption: ""
                                    }
                                }],
                                editor.getTextCursorPosition().block,
                                "after"
                            );
                        }
                    });
                }
                return true;
            }
        }

        return defaultPasteHandler();
    };

    const editor = useCreateBlockNote({
        initialContent: [
            {
                type: "paragraph",
                content: "Start typing here...",
            },
        ],
        uploadFile: async (file: File, blockId?: string | undefined) => {
            if (!blogRef.current) return "";
            return await uploadImageHandler(file, blockId);
        },
        pasteHandler: handlePaste,
    });

    const debouncedSave = debounce(() => {
        if (hasUnsavedChanges && blogRef.current) {
            handleSave(true);
        }
    }, 15000);

    useEffect(() => {
        initializeBlog();
    }, []);

    const initializeBlog = async () => {
        try {
            const { id } = await params;
            const { data } = await client.models.Blogs.get({ id });

            if (!data) {
                toast.error('Blog not found');
                router.push('/me/blogs');
                return;
            }

            blogRef.current = data;
            setTitle(data.title);
            setCoverImage(data.profileImage || '');

            if (editor && data.contentJson) {
                try {
                    const blocks = JSON.parse(data.contentJson) as PartialBlock[];
                    editor.replaceBlocks(editor.document, blocks);
                } catch (e) {
                    // If the content is not in BlockNote JSON format, create a text block with the content
                    editor.replaceBlocks(editor.document, [{
                        type: 'paragraph',
                        content: data.contentJson
                    }]);
                }
            }
        } catch (error) {
            console.error('Error loading blog:', error);
            toast.error('Failed to load blog');
            router.push('/me/blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (isAutoSave = false) => {
        if (!blogRef.current || !editor || saving) return;

        setSaving(true);
        try {
            const fixedHtml = await convertToHTML(editor);
            
            await client.models.Blogs.update({
                id: blogRef.current.id,
                title,
                contentJson: JSON.stringify(editor.document),
                contentHtml: fixedHtml,
                profileImage: coverImage || undefined,
            });

            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            toast.success(isAutoSave ? 'Auto-saved' : 'Blog saved successfully!', 
                isAutoSave ? { duration: 2000 } : undefined);
        } catch (error) {
            console.error('Save failed:', error);
            toast.error(isAutoSave ? 'Auto-save failed' : 'Failed to save blog');
        } finally {
            setSaving(false);
        }
    };



    const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !blogRef.current) return;

        try {
            const fileExtension = file.name.split('.').pop();
            const fileName = `cover_${nanoid()}.${fileExtension}`;
            const key = `public/blogs/${blogRef.current.id}/${fileName}`;

            toast.loading('Uploading cover image...', { id: 'cover-upload' });

            const result = await uploadData({
                path: key,
                data: file,
            }).result;

            const url = await getUrl({
                path: result.path
            });
            setCoverImage(url.url.toString());
            setHasUnsavedChanges(true);

            toast.success('Cover image uploaded successfully!', { id: 'cover-upload' });
        } catch (error) {
            console.error('Cover image upload failed:', error);
            toast.error('Failed to upload cover image', { id: 'cover-upload' });
        }
    };

    const togglePublishState = async () => {
        if (!blogRef.current) return;

        try {
            const newState = blogRef.current.state === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';

            await client.models.Blogs.update({
                id: blogRef.current.id,
                state: newState,
            });

            blogRef.current = { ...blogRef.current, state: newState };
            toast.success(`Blog ${newState.toLowerCase()} successfully!`);
        } catch (error) {
            console.error('Failed to update blog state:', error);
            toast.error('Failed to update blog state');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading editor...</p>
                </div>
            </div>
        );
    }

    if (!blogRef.current) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">Blog not found</p>
                    <Button variant="link" asChild>
                        <Link href="/me/blogs">Return to Blog Management</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                />
                <div className="flex flex-1 items-center justify-between">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href='/me'>
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href='/me/blogs'>
                                    Blogs
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Edit Blog</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-yellow-600 dark:text-yellow-500">Unsaved changes</span>
                        )}
                        {saving && (
                            <span className="text-sm text-muted-foreground">Saving...</span>
                        )}
                        {lastSaved && (
                            <span className="text-sm text-muted-foreground">
                                Last saved: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <Button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                        <Button
                            onClick={togglePublishState}
                            variant={blogRef.current?.state === 'PUBLISHED' ? "destructive" : "default"}
                            className="gap-2"
                        >
                            {blogRef.current?.state === 'PUBLISHED' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {blogRef.current?.state === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Blog Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setHasUnsavedChanges(true);
                                    }}
                                    placeholder="Enter blog title..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverImageUpload}
                                        className="hidden"
                                        id="cover-upload"
                                    />
                                    <Button
                                        variant="outline"
                                        asChild
                                    >
                                        <label htmlFor="cover-upload">
                                            Upload Cover Image
                                        </label>
                                    </Button>
                                    {coverImage && (
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={coverImage}
                                                alt="Cover"
                                                className="w-16 h-16 object-cover rounded-md"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setCoverImage('');
                                                    setHasUnsavedChanges(true);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <BlockNoteView
                            editor={editor}
                            theme="light"
                            className="min-h-[400px]"
                            onChange={onEditorContentChange}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

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
