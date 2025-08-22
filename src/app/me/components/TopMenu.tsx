"use client"

import { Button } from "@/components/ui/button"
import { signOut } from 'aws-amplify/auth'

export function TopMenu() {
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.log('error signing out:', error)
    }
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
