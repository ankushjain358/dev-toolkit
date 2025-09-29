"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { uploadData, getUrl } from "aws-amplify/storage";
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
import { cn, generateUniqueSlug } from "@/lib/utils";
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

type BlogFormData = z.infer<typeof blogSchema>;

interface BlogEditorProps {
  params: Promise<{ id: string }>;
}

export default function BlogEditorPage({ params }: BlogEditorProps) {
  const router = useRouter();
  const blogRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    form.setValue("content", content);
    setHasUnsavedChanges(true);
  };

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        if (blogRef.current && hasUnsavedChanges) {
          handleSave(true);
        }
      }, 15000),
    [hasUnsavedChanges],
  );

  useEffect(() => {
    initializeBlog();
  }, []);

  useEffect(() => {
    if (hasUnsavedChanges) {
      debouncedSave();
    }
  }, [hasUnsavedChanges, debouncedSave]);

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

      const slug = await generateUniqueSlug(formData.title.trim());

      await client.models.Blogs.update({
        id: blogRef.current.id,
        title: formData.title,
        slug: slug,
        contentHtml: formData.content,
        contentJson: formData.content,
        coverImage: formData.coverImage || undefined,
      });

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

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
      form.setValue("coverImage", url);
      setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(true);
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
      toast.success(`Blog ${newState.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Failed to update blog state:", error);
      toast.error("Failed to update blog state");
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
                <BreadcrumbLink href="/me">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/me/blogs">Blogs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Blog</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
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
              disabled={saving}
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
                            setHasUnsavedChanges(true);
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
                                setHasUnsavedChanges(true);
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <TiptapEditor
                content={editorContent}
                onChange={handleEditorChange}
                onImageUpload={handleImageUpload}
              />
            </CardContent>
          </Card>
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
