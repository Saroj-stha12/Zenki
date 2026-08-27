'use client';

import { ChevronDownCircleIcon, ChevronRightCircleIcon, EllipsisIcon, Trash2Icon } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useDbContext } from '../../contexts/dbContext';
import Note from './note';
import { Workspace, Note as NoteType } from '../../libs/db';
import db from '../../libs/db'
interface FolderProps {
    workspace: Workspace;
    notes: NoteType[];
}

export default function Folder({ workspace, notes }: FolderProps) {
    const [expand, setExpand] = useState<boolean>(false);
    const [show, setShow] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const { refreshWorkspaces, refreshFavoriteNotes, refreshNotes } = useDbContext();

    // Close the dropdown menu if clicked outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setExpand(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleEllipsisClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpand((prev) => !prev);
    };

    const handleMenuMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // Delete the workspace
    const handleDeleteWorkspace = async () => {
        await db.deleteWorkspace(workspace.uuid);

        refreshWorkspaces();
        refreshNotes();
        refreshFavoriteNotes()
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-hover rounded">
                <div
                    onClick={() => setShow(!show)}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    {show ? (
                        <ChevronDownCircleIcon strokeWidth={1} />
                    ) : (
                        <ChevronRightCircleIcon strokeWidth={1} />
                    )}
                    <Image
                        src={`/icons/${workspace.icon}`}
                        height={24}
                        width={24}
                        alt={workspace.uuid}
                    />
                    <span className="truncated">{workspace.title}</span>
                </div>
                <div className="relative">
                    <EllipsisIcon
                        onClick={handleEllipsisClick}
                        className="cursor-pointer"
                    />
                    {expand && (
                        <div
                            ref={menuRef}
                            className="fixed mt-2 flex flex-col gap-1 w-[20rem] bg-background z-99 rounded p-2"
                            onMouseDown={handleMenuMouseDown}
                        >
                            <div
                                onClick={handleDeleteWorkspace}
                                className="flex items-center gap-5 px-2 py-1 cursor-pointer hover:bg-hover rounded"
                            >
                                <Trash2Icon strokeWidth={1} />
                                <span>Delete this workspace</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {show && (
                <div className="ml-8 border-l-[1px] border-alt">
                    {notes.map((note) => (
                        <Note key={note.uuid} note={note} />
                    ))}
                </div>
            )}
        </div>
    );
}
