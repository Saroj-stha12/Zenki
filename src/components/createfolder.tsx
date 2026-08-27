'use client';

import { CirclePlusIcon, X } from "lucide-react";
import Shortcut from "./ui/shortcut";
import { useEffect, useState } from "react";
import Emoji from "./ui/emoji";
import { dbContext } from '../libs/db'
import { useDbContext } from "@/contexts/dbContext";

export default function Createfolder() {
    const [expand, setExpand] = useState(false);
    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState('grinning-face.png');
    const [error, setError] = useState<string | null>(null);
    const { refreshWorkspaces } = useDbContext()
    useEffect(() => {
        if (expand) {
            setTitle('');
            setEmoji('grinning-face.png');
            setError(null);
        }
    }, [expand]);
    // keycheck
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'n') {
                event.preventDefault();
                event.stopPropagation();
                setExpand(true)
            }
            if (event.key === "Escape" || event.key === "esc") {
                setExpand(false)
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, []);


    const handleCreate = async () => {
        if (!title.trim()) {
            setError('Folder name is required');
            return;
        }

        try {
            await dbContext.createWorkspace({
                title: title.trim(),
                icon: emoji,
            });
            refreshWorkspaces()
            setExpand(false);
        } catch (err) {
            console.error("Error creating folder:", err);
            setError("Failed to create folder. Try again.");
        }
    };

    return (
        <div>
            {/* trigger button */}
            <div
                onClick={() => setExpand(true)}
                className="flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-hover rounded"
            >
                <div className="flex items-center gap-2">
                    <CirclePlusIcon strokeWidth={1} />
                    <span>Create new folder</span>
                </div>
                <Shortcut shortcut="Shift N" />
            </div>

            {/* modal */}
            {expand && (
                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[2px] z-50">
                    <div className="w-[30rem] flex flex-col gap-5 p-4 bg-background rounded-lg outline outline-[1px] outline-outline">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h1 className="text-lg font-semibold">Create new folder</h1>
                                <p className="text-sm text-gray-500">This will add a folder to your workspace.</p>
                            </div>
                            <X onClick={() => setExpand(false)} className="cursor-pointer" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Emoji set={setEmoji} icons={emoji} />
                            <input
                                type="text"
                                placeholder="Untitled workspace"
                                className="flex-1 bg-transparent outline-none border-none"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setError(null);
                                }}
                                autoFocus
                            />
                        </div>

                        {/* error message */}
                        {error && (
                            <div className="text-sm text-red-500 px-1 -mt-2">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-5">
                            <button onClick={() => setExpand(false)} className="cursor-pointer px-2 py-1 text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="cursor-pointer px-2 py-1 bg-btn hover:bg-btnhover text-background rounded text-sm"
                            >
                                Save changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
