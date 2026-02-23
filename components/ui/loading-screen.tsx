import { Loader2 } from "lucide-react"

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
            <div className="relative flex flex-col items-center">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/30"></div>

                {/* Spinner */}
                <Loader2 className="h-16 w-16 animate-spin text-blue-600 dark:text-blue-500" />

                {/* Pulsing Core (Optional visual flair) */}
                <div className="absolute inset-0 m-auto h-8 w-8 animate-pulse rounded-full bg-blue-400/20 blur-xl"></div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 animate-pulse">
                    Loading...
                </h3>
                <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600"></div>
                </div>
            </div>
        </div>
    )
}
