'use client'
import { Layers3Icon, SearchIcon, X } from "lucide-react"
import Shortcut from "./ui/shortcut"
import { useState, useEffect } from "react"

const shortcuts = [
    {
        category: "Navigation",
        shortcuts: [
            { action: "Search", shortcut: "P" },
            { action: "Open Cheatsheet", shortcut: "/" },
            { action: "Help and Feedback", shortcut: "." },
            { action: "Open GitHub", shortcut: "G" },
            { action: "Open Settings", shortcut: "," }
        ]
    },
    {
        category: "Notes",
        shortcuts: [
            { action: "Create new note", shortcut: "N" },
            { action: "Create new folder", shortcut: "Shift + N" }
        ]
    },
    {
        category: "Editor",
        shortcuts: [
            { action: "Bold", shortcut: "Ctrl + B" },
            { action: "Italic", shortcut: "Ctrl + I" },
            { action: "Underline", shortcut: "Ctrl + U" },
            { action: "Strikethrough", shortcut: "Ctrl + Shift + S" },
            { action: "Code block", shortcut: "Ctrl + Alt + C" },
            { action: "Inline code", shortcut: "`" },
            { action: "Quote block", shortcut: "Ctrl + Alt + Q" },
            { action: "Bullet list", shortcut: "Ctrl + Shift + 8" },
            { action: "Numbered list", shortcut: "Ctrl + Shift + 7" },
            { action: "Task list", shortcut: "Ctrl + Shift + 9" },
            { action: "Heading 1", shortcut: "Ctrl + Alt + 1" },
            { action: "Heading 2", shortcut: "Ctrl + Alt + 2" },
            { action: "Heading 3", shortcut: "Ctrl + Alt + 3" },
            { action: "Insert link", shortcut: "Ctrl + K" },
            { action: "Insert image", shortcut: "Ctrl + Shift + I" },
            { action: "Undo", shortcut: "Ctrl + Z" },
            { action: "Redo", shortcut: "Ctrl + Y / Ctrl + Shift + Z" },
            { action: "Select all", shortcut: "Ctrl + A" }
        ]
    }
]

export default function Cheatsheet() {
    const [expand, setExpand] = useState(false)
    const [query, setQuery] = useState("")

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault()
                setExpand(true)
            }
            if (event.key === "Escape") {
                setExpand(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Filter shortcuts by query
    const filtered = shortcuts.map(section => ({
        ...section,
        shortcuts: section.shortcuts.filter(s =>
            s.action.toLowerCase().includes(query.toLowerCase())
        )
    })).filter(section => section.shortcuts.length > 0)

    // Group left/right
    const leftSections = filtered.filter(s => s.category === "Navigation" || s.category === "Notes")
    const rightSections = filtered.filter(s => s.category === "Editor")

    return (
        <div>
            <div
                onClick={() => setExpand(true)}
                className="flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-hover rounded"
            >
                <div className="flex items-center gap-2">
                    <Layers3Icon strokeWidth={1} />
                    <span>Cheatsheet</span>
                </div>
                <Shortcut shortcut="/" />
            </div>

            {expand && (
                <div className="fixed inset-0 flex items-center justify-center z-[999] backdrop-blur-sm">
                    <div className="w-[90vw] max-w-[1000px] bg-background p-4 rounded-lg outline outline-1 outline-outline flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h1 className="">Keyboard Shortcuts</h1>
                            <X onClick={() => setExpand(false)} className="cursor-pointer" />
                        </div>

                        {/* Search bar */}
                        <div className="flex items-center gap-2 p-2 rounded bg-muted outline outline-[1px] outline-outline">
                            <SearchIcon strokeWidth={1} />
                            <input
                                type="text"
                                placeholder="Search shortcuts..."
                                className="flex-1 bg-transparent border-none outline-none"
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>

                        {/* Two-column layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto">
                            {/* Left Column: Navigation + Notes */}
                            <div className="flex flex-col gap-4">
                                {leftSections.map(section => (
                                    <div
                                        key={section.category}
                                        className="p-3 bg-muted rounded border border-outline"
                                    >
                                        <h2 className="p-2">{section.category}</h2>
                                        <div className="flex flex-col gap-1">
                                            {section.shortcuts.map(item => (
                                                <div
                                                    key={`${section.category}-${item.shortcut}`}
                                                    className="flex items-center justify-between px-2 py-1 hover:bg-hover rounded"
                                                >
                                                    <span>{item.action}</span>
                                                    <Shortcut shortcut={item.shortcut} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right Column: Editor */}
                            <div className="flex flex-col gap-4">
                                {rightSections.map(section => (
                                    <div
                                        key={section.category}
                                        className="p-3 bg-muted rounded border border-outline"
                                    >
                                        <h2 className="p-2">{section.category}</h2>
                                        <div className="flex flex-col gap-2">
                                            {section.shortcuts.map(item => (
                                                <div
                                                    key={`${section.category}-${item.shortcut}`}
                                                    className="flex items-center justify-between px-2 py-1 hover:bg-hover rounded"
                                                >
                                                    <span>{item.action}</span>
                                                    <span className="text-alt">{item.shortcut}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
