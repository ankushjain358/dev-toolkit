export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="w-full py-8 px-4 max-w-none">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">
                DT
              </span>
            </div>
            <span className="font-semibold text-lg">Dev Toolkit</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            A comprehensive productivity platform for developers. Manage your
            blogs, bookmarks, notes, and projects all in one place.
          </p>
          <div className="text-xs text-muted-foreground">
            © 2024 Dev Toolkit. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
