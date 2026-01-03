"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { uploadData } from "aws-amplify/storage";
import { Save, Eye, EyeOff } from "lucide-react";
import TiptapEditor from "@/app/me/components/TiptapEditor";
import toast from "react-hot-toast";
import Link from "next/link";
import { nanoid } from "nanoid";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn, generateUniqueSlug, generateSlug } from "@/lib/utils";
import { QUERY_KEYS } from "@/lib/app-constants";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Plus, X } from "lucide-react";
import outputs from "@/../amplify_outputs.json";

const client = generateClient<Schema>();

const blogSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().optional(),
});

const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be less than 50 characters"),
});

type TagFormData = z.infer<typeof tagSchema>;
type BlogFormData = z.infer<typeof blogSchema>;

type Tag = {
  name: string;
  slug: string;
};

interface BlogEditorProps {
  params: Promise<{ id: string }>;
}

export default function BlogEditorPage({ params }: BlogEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const blogRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  const tagForm = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
    },
  });

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      coverImage: "",
    },
  });

  const uploadImageHandler = async (file: File, prefix = "img") => {
    try {
      if (!blogRef.current) return "";
      const fileExtension = file.name.split(".").pop();
      const fileName = `${prefix}_${nanoid()}.${fileExtension}`;
      const key = `public/blogs/${blogRef.current.id}/${fileName}`;

      const result = await uploadData({
        path: key,
        data: file,
      }).result;

      const distributionUrl = `https://${outputs.custom.distributionDomainName}/${key}`;
      return distributionUrl;
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
      return "";
    }
  };

  const [editorContent, setEditorContent] = useState(
    "<p>Start typing here...</p>",
  );

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    form.setValue("content", content, { shouldDirty: true });
  };

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        if (blogRef.current && form.formState.isDirty) {
          handleSave(true);
        }
      }, 15000),
    [form.formState.isDirty],
  );

  useEffect(() => {
    initializeBlog();
  }, []);

  useEffect(() => {
    if (form.formState.isDirty) {
      debouncedSave();
    }
  }, [form.formState.isDirty, debouncedSave]);

  const initializeBlog = async () => {
    try {
      const { id } = await params;
      const { data } = await client.models.Blogs.get({ id });

      if (!data) {
        toast.error("Blog not found");
        router.push("/me/blogs");
        return;
      }

      blogRef.current = data;
      form.setValue("title", data.title || "");
      const content = data.contentHtml || "<p>Start typing here...</p>";
      form.setValue("content", content);
      form.setValue("coverImage", data.coverImage || "");
      setEditorContent(content);
      setTags(data.tags?.filter((tag): tag is Tag => tag !== null) || []);
    } catch (error) {
      console.error("Error loading blog:", error);
      toast.error("Failed to load blog");
      router.push("/me/blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    if (!blogRef.current || saving) return;

    // Validate form before saving
    const isValid = await form.trigger();
    if (!isValid) {
      if (!isAutoSave) {
        toast.error("Please fix validation errors before saving");
      }
      return;
    }

    setSaving(true);
    try {
      const formData = form.getValues();

      const slug = await generateUniqueSlug(
        formData.title.trim(),
        blogRef.current.id,
      );

      await client.models.Blogs.update({
        id: blogRef.current.id,
        title: formData.title,
        slug: slug,
        contentHtml: formData.content,
        contentJson: formData.content,
        coverImage: formData.coverImage || undefined,
      });

      setLastSaved(new Date());
      form.reset(form.getValues()); // Reset dirty state while keeping current values

      // Invalidate blogs cache to refresh the list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BLOGS(blogRef.current.userId),
      });

      if (!isAutoSave) {
        toast.success("Blog saved successfully!");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(isAutoSave ? "Auto-save failed" : "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !blogRef.current) return;

    toast.loading("Uploading cover image...", { id: "cover-upload" });

    try {
      const url = await uploadImageHandler(file, "cover");
      form.setValue("coverImage", url, { shouldDirty: true });
      toast.success("Cover image uploaded successfully!", {
        id: "cover-upload",
      });
    } catch (error) {
      console.error("Cover image upload failed:", error);
      toast.error("Failed to upload cover image", { id: "cover-upload" });
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const url = await uploadImageHandler(file);
    if (url) {
      // Image uploads in editor content are handled by setValue in handleEditorChange
    }
    return url;
  };

  const togglePublishState = async () => {
    if (!blogRef.current) return;

    // Validate form before publishing
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Please fix validation errors before publishing");
      return;
    }

    try {
      const newState =
        blogRef.current.state === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";

      await client.models.Blogs.update({
        id: blogRef.current.id,
        state: newState,
      });

      blogRef.current = { ...blogRef.current, state: newState };

      // Invalidate blogs cache to refresh the list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BLOGS(blogRef.current.userId),
      });

      toast.success(`Blog ${newState.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Failed to update blog state:", error);
      toast.error("Failed to update blog state");
    }
  };

  const addTag = async (data: TagFormData) => {
    const trimmedName = data.name.trim();
    const slug = generateSlug(trimmedName);

    // Check for duplicate
    if (tags.some((tag) => tag.slug === slug)) {
      tagForm.setError("name", { message: "Tag already exists" });
      return;
    }

    const newTag: Tag = {
      name: trimmedName,
      slug: slug,
    };

    setTags((prev) => [...prev, newTag]);
    tagForm.reset();
    setTagDialogOpen(false);
  };

  const removeTag = (slugToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag.slug !== slugToRemove));
  };

  // This could be improved later using batch operations
  // https://docs.amplify.aws/react/build-a-backend/data/custom-business-logic/batch-ddb-operations/
  const saveTags = async () => {
    if (!blogRef.current) return;

    try {
      setSaving(true);

      // Delete existing tag references using the ref GSI
      const { data: existingRefs } =
        await client.models.TagReferences.listTagReferencesByRef({
          ref: `BLOG#${blogRef.current.id}`,
        });

      for (const ref of existingRefs || []) {
        await client.models.TagReferences.delete({ id: ref.id });
      }

      // Update blog with new tags
      await client.models.Blogs.update({
        id: blogRef.current.id,
        tags: tags,
      });

      // Create new tag references
      for (const tag of tags) {
        await client.models.TagReferences.create({
          slug: tag.slug,
          ref: `BLOG#${blogRef.current.id}`,
        });
      }

      blogRef.current = { ...blogRef.current, tags };
      setIsEditingTags(false);
      toast.success("Tags saved successfully!");

      // Invalidate blogs cache
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BLOGS(blogRef.current.userId),
      });
    } catch (error) {
      console.error("Failed to save tags:", error);
      toast.error("Failed to save tags");
    } finally {
      setSaving(false);
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
                <BreadcrumbLink asChild>
                  <Link href="/me">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/me/blogs">Blogs</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Blog</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            {form.formState.isDirty && (
              <span className="text-sm text-yellow-600 dark:text-yellow-500">
                Unsaved changes
              </span>
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
              disabled={saving || !form.formState.isDirty}
              className="gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              onClick={togglePublishState}
              variant={
                blogRef.current?.state === "PUBLISHED"
                  ? "destructive"
                  : "default"
              }
              className="gap-2 cursor-pointer"
            >
              {blogRef.current?.state === "PUBLISHED" ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {blogRef.current?.state === "PUBLISHED" ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      <Form {...form}>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter blog title..."
                          onChange={(e) => {
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image</FormLabel>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageUpload}
                          className="hidden"
                          id="cover-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="cover-upload">
                            Upload Cover Image
                          </label>
                        </Button>
                        {field.value && (
                          <div className="flex items-start gap-4">
                            <img
                              src={field.value}
                              alt="Cover"
                              className="max-w-48 max-h-32 object-contain rounded-md border"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                field.onChange("");
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    {!isEditingTags ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingTags(true)}
                        className="gap-2 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Tags
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTags(blogRef.current?.tags || []);
                            setIsEditingTags(false);
                          }}
                          className="cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={saveTags}
                          disabled={saving}
                          className="cursor-pointer"
                        >
                          Save Tags
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.slug}
                        variant="secondary"
                        className="gap-1"
                      >
                        {tag.name}
                        {isEditingTags && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeTag(tag.slug);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))}

                    {isEditingTags && (
                      <Dialog
                        open={tagDialogOpen}
                        onOpenChange={setTagDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1 h-6 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <small>Add Tag</small>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Tag</DialogTitle>
                          </DialogHeader>
                          <Form {...tagForm}>
                            <form
                              onSubmit={tagForm.handleSubmit(addTag)}
                              className="space-y-4"
                            >
                              <FormField
                                control={tagForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tag Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Enter tag name..."
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    tagForm.reset();
                                    setTagDialogOpen(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit">Add Tag</Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {tags.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        No tags added yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardContent className="p-0"> */}
          <TiptapEditor
            content={editorContent}
            onChange={handleEditorChange}
            onImageUpload={handleImageUpload}
          />
          {/* </CardContent>
          </Card> */}
        </div>
      </Form>
    </>
  );
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
