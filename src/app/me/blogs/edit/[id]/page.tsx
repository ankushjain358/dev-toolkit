"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { uploadData } from "aws-amplify/storage";
import { Save, Eye, EyeOff, Tags, X, Plus } from "lucide-react";
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
import { generateUniqueSlug } from "@/lib/utils";
import { QUERY_KEYS } from "@/lib/app-constants";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

type SelectedTag = {
  id: string;
  name: string;
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
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  const [originalTags, setOriginalTags] = useState<SelectedTag[]>([]);
  const [tagComboOpen, setTagComboOpen] = useState(false);
  const [savingTags, setSavingTags] = useState(false);

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

      await uploadData({
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

  const { data: availableTags = [] } = useQuery({
    queryKey: QUERY_KEYS.TAGS,
    queryFn: async () => {
      const { data } = await client.models.Tag.list();
      return data || [];
    },
  });

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

      // Load tags using lazy loading from blog's hasMany relationship
      try {
        const blogTagsResult = await data.tags();
        const blogTags = blogTagsResult.data || [];
        const validTags: SelectedTag[] = [];

        for (const blogTag of blogTags) {
          // const tag = availableTags.find(item => item.id == blogTag.tagId)
          // if (tag) {
          //   validTags.push({ id: tag.id, name: tag.name });
          // }
          const tag = await blogTag.tag();
          if (tag.data) {
            validTags.push({ id: tag.data.id, name: tag.data.name });
          }
        }
        setSelectedTags(validTags);
        setOriginalTags(validTags);
      } catch (tagError) {
        console.error("Error loading tags:", tagError);
      }
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
      form.reset(form.getValues());

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
    return url;
  };

  const togglePublishState = async () => {
    if (!blogRef.current) return;

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

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BLOGS(blogRef.current.userId),
      });

      toast.success(`Blog ${newState.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Failed to update blog state:", error);
      toast.error("Failed to update blog state");
    }
  };

  const handleSaveTags = async () => {
    if (!blogRef.current) return;

    setSavingTags(true);
    try {
      // Delete existing tags using lazy loading
      const existingBlogTagsResult = await blogRef.current.tags();
      const existingBlogTags = existingBlogTagsResult.data || [];
      if (existingBlogTags.length > 0) {
        await Promise.all(
          existingBlogTags.map((bt: any) =>
            client.models.BlogTag.delete({ id: bt.id }),
          ),
        );
      }

      // Validate selected tags still exist
      const validTagIds: string[] = [];
      const invalidTags: string[] = [];

      for (const selectedTag of selectedTags) {
        const tagExists = availableTags.find((t) => t.id === selectedTag.id);
        if (tagExists) {
          validTagIds.push(selectedTag.id);
        } else {
          invalidTags.push(selectedTag.name);
        }
      }

      // Show warning for deleted tags
      if (invalidTags.length > 0) {
        toast.error(`Some tags were deleted: ${invalidTags.join(", ")}`);
      }

      await Promise.all(
        validTagIds.map((tagId) =>
          client.models.BlogTag.create({
            blogId: blogRef.current.id,
            tagId,
          }),
        ),
      );

      const validSelectedTags = selectedTags.filter((st) =>
        validTagIds.includes(st.id),
      );
      setSelectedTags(validSelectedTags);
      setOriginalTags(validSelectedTags);

      toast.success("Tags saved successfully!");
    } catch (error) {
      console.error("Error saving tags:", error);
      toast.error("Failed to save tags");
    } finally {
      setSavingTags(false);
    }
  };

  const addTag = (tag: BlogTag) => {
    if (selectedTags.length >= 5) {
      toast.error("Maximum 5 tags allowed");
      return;
    }
    if (!selectedTags.find((t) => t.id === tag.id)) {
      setSelectedTags((prev) => [...prev, { id: tag.id, name: tag.name }]);
    }
    setTagComboOpen(false);
  };

  const removeTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const tagsChanged =
    JSON.stringify(selectedTags) !== JSON.stringify(originalTags);

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
                        <Input {...field} placeholder="Enter blog title..." />
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
                              onClick={() => field.onChange("")}
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
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveTags}
                      disabled={savingTags || !tagsChanged}
                      className="cursor-pointer"
                    >
                      <Tags className="h-4 w-4 mr-2" />
                      Save Tags
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                    {selectedTags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="gap-1">
                        {tag.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                          onClick={() => removeTag(tag.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}

                    <Popover open={tagComboOpen} onOpenChange={setTagComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 h-6 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          disabled={selectedTags.length >= 5}
                        >
                          <Plus className="h-3 w-3" />
                          Add Tag
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search tags..." />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2 text-sm text-muted-foreground">
                                No tags found.{" "}
                                <Link
                                  href="/me/settings/tags"
                                  className="text-primary underline"
                                >
                                  Create tags
                                </Link>{" "}
                                in settings.
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {availableTags
                                .filter(
                                  (tag) =>
                                    !selectedTags.find(
                                      (st) => st.id === tag.id,
                                    ),
                                )
                                .map((tag) => (
                                  <CommandItem
                                    key={tag.id}
                                    onSelect={() => addTag(tag)}
                                  >
                                    {tag.name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {selectedTags.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        No tags added yet
                      </span>
                    )}
                    {selectedTags.length >= 5 && (
                      <span className="text-muted-foreground text-xs">
                        Maximum 5 tags allowed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <TiptapEditor
            content={editorContent}
            onChange={handleEditorChange}
            onImageUpload={handleImageUpload}
          />
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
