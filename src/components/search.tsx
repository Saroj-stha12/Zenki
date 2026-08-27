'use client';

import { SearchIcon, X } from "lucide-react";
import Shortcut from "./ui/shortcut";
import Searchnote from "./ui/s_note";
import { useState, useMemo, useEffect } from "react";
import { useDbContext } from "@/contexts/dbContext";

export default function Search() {
    const [expand, setExpand] = useState(false);
    const [query, setQuery] = useState('');
    const { notes } = useDbContext();

    const filteredNotes = useMemo(() => {
        if (!query.trim()) return notes;
        return notes.filter(note =>
            note.title?.toLowerCase().includes(query.toLowerCase())
        );
    }, [query, notes]);

    useEffect(() => {
        setQuery('')
    }, [expand])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
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

    return (
        <div>
            {/* searchbtn */}
            <div
                onClick={() => setExpand(true)}
                className="flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-hover rounded"
            >
                <div className="flex items-center gap-2">
                    <SearchIcon strokeWidth={1} />
                    <span>Search</span>
                </div>
                <Shortcut shortcut="P" />
            </div>

            {/* searchtab */}
            {expand && (
                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px] z-50">
                    <div className="w-[40rem] flex flex-col gap-3 px-2 py-3 bg-background rounded outline outline-[1px] outline-outline">
                        <div className="flex items-center gap-2">
                            <SearchIcon strokeWidth={1} />
                            <input
                                type="text"
                                placeholder="Search notes"
                                className="flex-1 bg-transparent outline-none border-none"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            <X onClick={() => setExpand(false)} className="cursor-pointer" />
                        </div>
                        <div className="h-[1px] bg-outline"></div>

                        {/* results */}
                        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
                            {filteredNotes.length > 0 ? (
                                filteredNotes.map((note) => (
                                    <Searchnote set={setExpand} note={note} key={note.uuid} />
                                ))
                            ) : (
                                <div className="text-sm text-center px-2 py-1">No results found</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
