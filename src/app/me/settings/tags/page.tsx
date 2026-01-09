"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { generateSlug } from "@/lib/utils";
import toast from "react-hot-toast";
import { QUERY_KEYS } from "@/lib/app-constants";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const client = generateClient<Schema>();

const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be less than 50 characters"),
});

type TagFormData = z.infer<typeof tagSchema>;

export default function TagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const { data } = await client.models.Tag.list();
      setTags(data || []);
    } catch (error) {
      console.error("Error loading tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async (data: TagFormData) => {
    const trimmedName = data.name.trim();
    const slug = generateSlug(trimmedName);

    if (tags.some((tag) => tag.slug === slug)) {
      form.setError("name", { message: "Tag already exists" });
      return;
    }

    setSaving(true);
    try {
      const { data: newTag } = await client.models.Tag.create({
        name: trimmedName,
        slug,
      });

      if (newTag) {
        setTags((prev) => [...prev, newTag]);
        form.reset();
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAGS });
        toast.success("Tag created successfully!");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { data: blogTags } = await client.models.BlogTag.list({
        filter: { tagId: { eq: tagId } },
      });

      if (blogTags && blogTags.length > 0) {
        toast.error("Cannot delete tag that is associated with blogs");
        return;
      }

      await client.models.Tag.delete({ id: tagId });
      setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAGS });
      toast.success("Tag deleted successfully!");
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    }
  };

  const handleEditTag = (tag: any) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
  };

  const handleSaveEdit = async (tagId: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    const slug = generateSlug(trimmedName);
    if (tags.some((tag) => tag.slug === slug && tag.id !== tagId)) {
      toast.error("Tag name already exists");
      return;
    }

    try {
      await client.models.Tag.update({
        id: tagId,
        name: trimmedName,
        slug,
      });

      setTags((prev) =>
        prev.map((tag) =>
          tag.id === tagId ? { ...tag, name: trimmedName, slug } : tag,
        ),
      );
      setEditingTag(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAGS });
      toast.success("Tag updated successfully!");
    } catch (error) {
      console.error("Error updating tag:", error);
      toast.error("Failed to update tag");
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditName("");
  };

  if (loading) {
    return <div className="p-6">Loading tags...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tag Management</h1>
        <p className="text-muted-foreground">Manage tags for your blog posts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddTag)}
              className="flex gap-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Enter tag name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={saving}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Tags ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-muted-foreground">No tags created yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-2 border rounded-lg"
                >
                  {editingTag === tag.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-6 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(tag.id);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <Button size="sm" onClick={() => handleSaveEdit(tag.id)}>
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Badge variant="secondary">{tag.name}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTag(tag)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{tag.name}
                              &quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTag(tag.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
