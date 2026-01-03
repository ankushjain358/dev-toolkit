"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { uploadData } from "aws-amplify/storage";
import { Save, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getUserInfo } from "@/lib/utils";
import outputs from "@/../amplify_outputs.json";

const client = generateClient<Schema>();

const profileSchema = z.object({
  displayName: z
    .string()
    .max(100, "Display name must be less than 100 characters")
    .optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatarUrl: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),
  twitterUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identityId, setIdentityId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      avatarUrl: "",
      website: "",
      location: "",
      twitterUrl: "",
      linkedinUrl: "",
      githubUrl: "",
    },
  });

  useEffect(() => {
    initializeProfile();
  }, []);

  const initializeProfile = async () => {
    try {
      const { identityId, userId } = await getUserInfo();

      setUserId(userId);
      setIdentityId(identityId);

      // Try to get existing profile
      const { data } = await client.models.Profile.get({ userId: userId });

      if (data) {
        form.setValue("displayName", data.displayName || "");
        form.setValue("bio", data.bio || "");
        form.setValue("avatarUrl", data.avatarUrl || "");
        form.setValue("website", data.website || "");
        form.setValue("location", data.location || "");
        form.setValue("twitterUrl", data.twitterUrl || "");
        form.setValue("linkedinUrl", data.linkedinUrl || "");
        form.setValue("githubUrl", data.githubUrl || "");

        if (data.avatarUrl) {
          const distributionUrl = `https://${outputs.custom.distributionDomainName}/${data.avatarUrl}`;
          setAvatarPreview(distributionUrl);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const uploadImageHandler = async (file: File) => {
    try {
      const fileExtension = file.name.split(".").pop();
      const fileName = `user_${nanoid()}.${fileExtension}`;
      const key = `public/users/${identityId}/${fileName}`;

      await uploadData({
        path: key,
        data: file,
      }).result;

      return key;
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
      return "";
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.loading("Uploading avatar...", { id: "avatar-upload" });

    try {
      const key = await uploadImageHandler(file);
      if (key) {
        form.setValue("avatarUrl", key, { shouldDirty: true });
        const distributionUrl = `https://${outputs.custom.distributionDomainName}/${key}`;
        setAvatarPreview(distributionUrl);
        toast.success("Avatar uploaded successfully!", { id: "avatar-upload" });
      }
    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast.error("Failed to upload avatar", { id: "avatar-upload" });
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId || saving) return;

    setSaving(true);
    try {
      // Check if profile exists
      const { data: existingProfile } = await client.models.Profile.get({
        userId,
      });

      if (existingProfile) {
        // Update existing profile
        await client.models.Profile.update({
          userId,
          displayName: data.displayName || undefined,
          bio: data.bio || undefined,
          avatarUrl: data.avatarUrl || undefined,
          website: data.website || undefined,
          location: data.location || undefined,
          twitterUrl: data.twitterUrl || undefined,
          linkedinUrl: data.linkedinUrl || undefined,
          githubUrl: data.githubUrl || undefined,
        });
      } else {
        // Create new profile
        await client.models.Profile.create({
          userId,
          displayName: data.displayName || undefined,
          bio: data.bio || undefined,
          avatarUrl: data.avatarUrl || undefined,
          website: data.website || undefined,
          location: data.location || undefined,
          twitterUrl: data.twitterUrl || undefined,
          linkedinUrl: data.linkedinUrl || undefined,
          githubUrl: data.githubUrl || undefined,
        });
      }

      form.reset(data); // Reset dirty state
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback>
                    {form.watch("displayName")?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Avatar
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourwebsite.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://twitter.com/username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://github.com/username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={saving || !form.formState.isDirty}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
