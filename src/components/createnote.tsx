'use client';

import { PlusSquareIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDbContext } from '../contexts/dbContext';
import db from '../libs/db';
import Shortcut from './ui/shortcut';
import { useCallback, useEffect } from 'react';
export default function Createnote() {
    const { refreshNotes } = useDbContext();
    const router = useRouter();

    const handleCreateNote = useCallback(async () => {
        const newNote = await db.createNote({
            title: 'Untitled note',
            icon: 'grinning-face.png',
            content: '',
            workspaceuuid: '',
            favorite: false,
        });

        refreshNotes();
        router.push(`/editor/${newNote.uuid}`);
    }, [refreshNotes, router]);
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n' && !event.shiftKey) {
                event.preventDefault()
                event.stopPropagation()
                handleCreateNote()
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [handleCreateNote]);

    return (
        <div
            className="flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-hover rounded"
            onClick={handleCreateNote}
        >
            <div className="flex items-center gap-2">
                <PlusSquareIcon strokeWidth={1} />
                <span>Create new note</span>
            </div>
            <Shortcut shortcut='N' />
        </div>
    );
}
