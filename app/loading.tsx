"use client"

import { usePathname } from "next/navigation"
import LoadingScreen from "@/components/ui/loading-screen"

export default function Loading() {
    const pathname = usePathname()

    // Don't show loading screen on the home page route
    if (pathname === "/") {
        return null
    }

    return <LoadingScreen />
}
