'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DbContext } from './dbContext';
import dbContext, { Workspace, Note } from '../libs/db';
import type { SidebarListItem } from './dbContext';

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [favoriteNotes, setFavoriteNotes] = useState<Note[]>([]);

    const refreshWorkspaces = async () => {
        const data = await dbContext.getAllWorkspaces();
        setWorkspaces(data);
    };

    const refreshNotes = async () => {
        const data = await dbContext.notes.toArray();
        setNotes(data);
    };
    const refreshFavoriteNotes = async () => {
        const allNotes = await dbContext.notes.toArray();
        const favs = allNotes.filter(note => note.favorite === true);
        setFavoriteNotes(favs);
    };


    useEffect(() => {
        refreshWorkspaces();
        refreshNotes();
        refreshFavoriteNotes();
    }, []);

    const sidebarItems: SidebarListItem[] = useMemo(() => {
        const grouped: SidebarListItem[] = [];

        for (const workspace of workspaces) {
            const workspaceNotes = notes.filter((n) => n.workspaceuuid === workspace.uuid);
            grouped.push({
                type: 'workspace',
                workspace,
                notes: workspaceNotes,
            });
        }

        const unsortedNotes = notes.filter((n) => !n.workspaceuuid);
        if (unsortedNotes.length > 0) {
            grouped.push({
                type: 'unsorted_notes',
                notes: unsortedNotes,
            });
        }

        return grouped;
    }, [workspaces, notes]);

    const value = {
        db: dbContext,
        workspaces,
        notes,
        favoriteNotes,
        sidebarItems,
        refreshWorkspaces,
        refreshNotes,
        refreshFavoriteNotes,
    };

    return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
};
