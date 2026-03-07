"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { uploadData } from "aws-amplify/storage";
import { Save, Upload, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getUserInfo } from "@/lib/utils";
import outputs from "@/../amplify_outputs.json";

const client = generateClient<Schema>();

// Fixed ID for SiteSettings - only one record per site
const SITE_SETTINGS_ID = "site-settings-default";

const siteSettingsSchema = z.object({
  // Branding
  siteName: z
    .string()
    .max(100, "Site name must be less than 100 characters")
    .optional(),
  tagline: z
    .string()
    .max(200, "Tagline must be less than 200 characters")
    .optional(),
  logoLightUrl: z.string().optional(),
  logoDarkUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  bannerTitle: z
    .string()
    .max(150, "Banner title must be less than 150 characters")
    .optional(),
  bannerDescription: z
    .string()
    .max(500, "Banner description must be less than 500 characters")
    .optional(),

  // Social & Contact
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  website: z.url("Must be a valid URL").optional().or(z.literal("")),
  twitterUrl: z.url("Must be a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.url("Must be a valid URL").optional().or(z.literal("")),
  githubUrl: z.url("Must be a valid URL").optional().or(z.literal("")),
  instagramUrl: z.url("Must be a valid URL").optional().or(z.literal("")),

  // About
  aboutPhotoUrl: z.string().optional(),
  aboutText: z
    .string()
    .max(2000, "About text must be less than 2000 characters")
    .optional(),

  // SEO
  metaTitle: z
    .string()
    .max(60, "Meta title must be less than 60 characters")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description must be less than 160 characters")
    .optional(),
  ogImageUrl: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  keywords: z.string().optional(),
});

type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identityId, setIdentityId] = useState<string>("");
  const [logoLightPreview, setLogoLightPreview] = useState<string>("");
  const [logoDarkPreview, setLogoDarkPreview] = useState<string>("");
  const [aboutPhotoPreview, setAboutPhotoPreview] = useState<string>("");
  const [ogImagePreview, setOgImagePreview] = useState<string>("");

  const form = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: "",
      tagline: "",
      logoLightUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
      bannerTitle: "",
      bannerDescription: "",
      email: "",
      website: "",
      twitterUrl: "",
      linkedinUrl: "",
      githubUrl: "",
      instagramUrl: "",
      aboutPhotoUrl: "",
      aboutText: "",
      metaTitle: "",
      metaDescription: "",
      ogImageUrl: "",
      googleAnalyticsId: "",
      keywords: "",
    },
  });

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      const { identityId } = await getUserInfo();
      setIdentityId(identityId);

      const { data } = await client.models.SiteSettings.get({
        id: SITE_SETTINGS_ID,
      });

      if (data) {
        form.reset({
          siteName: data.siteName || "",
          tagline: data.tagline || "",
          logoLightUrl: data.logoLightUrl || "",
          logoDarkUrl: data.logoDarkUrl || "",
          faviconUrl: data.faviconUrl || "",
          bannerTitle: data.bannerTitle || "",
          bannerDescription: data.bannerDescription || "",
          email: data.email || "",
          website: data.website || "",
          twitterUrl: data.twitterUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          githubUrl: data.githubUrl || "",
          instagramUrl: data.instagramUrl || "",
          aboutPhotoUrl: data.aboutPhotoUrl || "",
          aboutText: data.aboutText || "",
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          ogImageUrl: data.ogImageUrl || "",
          googleAnalyticsId: data.googleAnalyticsId || "",
          keywords: data.keywords || "",
        });

        if (data.logoLightUrl) {
          setLogoLightPreview(
            `https://${outputs.custom.distributionDomainName}/${data.logoLightUrl}`,
          );
        }
        if (data.logoDarkUrl) {
          setLogoDarkPreview(
            `https://${outputs.custom.distributionDomainName}/${data.logoDarkUrl}`,
          );
        }
        if (data.aboutPhotoUrl) {
          setAboutPhotoPreview(
            `https://${outputs.custom.distributionDomainName}/${data.aboutPhotoUrl}`,
          );
        }
        if (data.ogImageUrl) {
          setOgImagePreview(
            `https://${outputs.custom.distributionDomainName}/${data.ogImageUrl}`,
          );
        }
      }
    } catch (error) {
      console.error("Error loading site settings:", error);
      toast.error("Failed to load site settings");
    } finally {
      setLoading(false);
    }
  };

  const uploadImageHandler = async (file: File) => {
    try {
      const fileExtension = file.name.split(".").pop();
      const fileName = `site_${nanoid()}.${fileExtension}`;
      const key = `public/site/${fileName}`;

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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof SiteSettingsFormData,
    setPreview: (url: string) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.loading("Uploading image...", { id: "image-upload" });

    try {
      const key = await uploadImageHandler(file);
      if (key) {
        form.setValue(fieldName, key, { shouldDirty: true });
        const distributionUrl = `https://${outputs.custom.distributionDomainName}/${key}`;
        setPreview(distributionUrl);
        toast.success("Image uploaded successfully!", { id: "image-upload" });
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image", { id: "image-upload" });
    }
  };

  const onSubmit = async (data: SiteSettingsFormData) => {
    if (saving) return;

    setSaving(true);
    try {
      const { data: existingSettings } = await client.models.SiteSettings.get({
        id: SITE_SETTINGS_ID,
      });

      if (existingSettings) {
        await client.models.SiteSettings.update({
          id: SITE_SETTINGS_ID,
          ...data,
        });
      } else {
        await client.models.SiteSettings.create({
          id: SITE_SETTINGS_ID,
          ...data,
        });
      }

      form.reset(data);
      toast.success("Site settings updated successfully!");
    } catch (error) {
      console.error("Failed to save site settings:", error);
      toast.error("Failed to save site settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading site settings...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 pb-24">
      <h1 className="text-3xl font-bold mb-6">Site Settings</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Branding Settings */}
          <Collapsible defaultOpen className="border rounded-lg">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent cursor-pointer">
              <h2 className="text-lg font-semibold">Branding Settings</h2>
              <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-4 space-y-6">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your site name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline / Subtitle</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A short tagline for your site"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Logo (Light Mode)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Recommended: 200x200px, square
                  </p>
                  {logoLightPreview && (
                    <div className="relative inline-block">
                      <img
                        src={logoLightPreview}
                        alt="Logo Light"
                        className="w-20 h-20 max-w-full max-h-20 mb-2 rounded object-contain"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 bg-accent hover:bg-accent"
                        onClick={() => {
                          form.setValue("logoLightUrl", "", {
                            shouldDirty: true,
                          });
                          setLogoLightPreview("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Label
                      htmlFor="logo-light-upload"
                      className="cursor-pointer"
                    >
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </Label>
                  </div>
                  <Input
                    id="logo-light-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(e, "logoLightUrl", setLogoLightPreview)
                    }
                    className="hidden"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Logo (Dark Mode)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Recommended: 200x200px, square
                  </p>
                  {logoDarkPreview && (
                    <div className="relative inline-block">
                      <img
                        src={logoDarkPreview}
                        alt="Logo Dark"
                        className="w-20 h-20 max-w-full max-h-20 mb-2 rounded object-contain"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 bg-accent hover:bg-accent"
                        onClick={() => {
                          form.setValue("logoDarkUrl", "", {
                            shouldDirty: true,
                          });
                          setLogoDarkPreview("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Label
                      htmlFor="logo-dark-upload"
                      className="cursor-pointer"
                    >
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </Label>
                  </div>
                  <Input
                    id="logo-dark-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(e, "logoDarkUrl", setLogoDarkPreview)
                    }
                    className="hidden"
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="faviconUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon</FormLabel>
                    <FormControl>
                      <Input placeholder="Favicon URL or path" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bannerTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Banner title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bannerDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Banner description"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Social & Contact */}
          <Collapsible defaultOpen className="border rounded-lg">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent cursor-pointer">
              <h2 className="text-lg font-semibold">Social & Contact</h2>
              <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-4 space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@example.com" {...field} />
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

              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://instagram.com/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* About Section */}
          <Collapsible defaultOpen className="border rounded-lg">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent cursor-pointer">
              <h2 className="text-lg font-semibold">About Section</h2>
              <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-4 space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  About Photo
                </Label>
                {aboutPhotoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={aboutPhotoPreview}
                      alt="About Photo"
                      className="w-32 h-32 max-w-full max-h-32 mb-2 rounded object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 bg-accent hover:bg-accent"
                      onClick={() => {
                        form.setValue("aboutPhotoUrl", "", {
                          shouldDirty: true,
                        });
                        setAboutPhotoPreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Label htmlFor="about-photo-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                </Label>
                <Input
                  id="about-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(e, "aboutPhotoUrl", setAboutPhotoPreview)
                  }
                  className="hidden"
                />
              </div>

              <FormField
                control={form.control}
                name="aboutText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      About Text{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (Markdown supported)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell visitors about yourself or your site..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* SEO Fields */}
          <Collapsible className="border rounded-lg">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent cursor-pointer">
              <h2 className="text-lg font-semibold">SEO Settings</h2>
              <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-4 space-y-6">
              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Meta Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Default page title (max 60 chars)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Default page description (max 160 chars)"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Default OG Image
                </Label>
                {ogImagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={ogImagePreview}
                      alt="OG Image"
                      className="w-full max-w-md h-32 mb-2 rounded object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 bg-accent hover:bg-accent"
                      onClick={() => {
                        form.setValue("ogImageUrl", "", { shouldDirty: true });
                        setOgImagePreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Label htmlFor="og-image-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                </Label>
                <Input
                  id="og-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(e, "ogImageUrl", setOgImagePreview)
                  }
                  className="hidden"
                />
              </div>

              <FormField
                control={form.control}
                name="googleAnalyticsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Analytics ID</FormLabel>
                    <FormControl>
                      <Input placeholder="G-XXXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter keywords separated by commas (e.g., blog, tech, development)"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Separate keywords with commas
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>
        </form>
      </Form>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={saving || !form.formState.isDirty}
          size="lg"
          className="shadow-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
