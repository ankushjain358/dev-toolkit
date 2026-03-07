import { ExternalLayout } from "@/components/layout/external-layout";
import { getSiteSettings } from "@/services/common.service";
import outputs from "@/../amplify_outputs.json";
import { marked } from "marked";

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const photoUrl = settings.aboutPhotoUrl
    ? `https://${outputs.custom.distributionDomainName}/${settings.aboutPhotoUrl}`
    : null;

  const aboutHtml = settings.aboutText
    ? await marked(settings.aboutText)
    : null;

  return (
    <ExternalLayout>
      <div className="container max-w-5xl mx-auto py-16 px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">About</h1>
          <div className="w-20 h-1 bg-primary mx-auto" />
        </div>

        {photoUrl && (
          <div className="mb-12 flex justify-center">
            <img
              src={photoUrl}
              alt="About"
              className="w-full max-w-md max-h-96 object-cover rounded-2xl shadow-xl"
            />
          </div>
        )}
        <div className="max-w-3xl mx-auto">
          {aboutHtml ? (
            <div
              className="tiptap prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No about information available yet.</p>
            </div>
          )}
        </div>
      </div>
    </ExternalLayout>
  );
}
