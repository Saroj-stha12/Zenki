'use client';

import { createContext, useContext } from 'react';
import type { Workspace, Note } from '../libs/db';
import dbContext from '../libs/db';

export interface SidebarItem {
  type: 'workspace';
  workspace: Workspace;
  notes: Note[];
}

export interface UnsortedNotesItem {
  type: 'unsorted_notes';
  notes: Note[];
}

export type SidebarListItem = SidebarItem | UnsortedNotesItem;

export interface DbContextValue {
  db: typeof dbContext;
  workspaces: Workspace[];
  notes: Note[];
  favoriteNotes: Note[];
  sidebarItems: SidebarListItem[];
  refreshWorkspaces: () => void;
  refreshNotes: () => void;
  refreshFavoriteNotes: () => void;
}

export const DbContext = createContext<DbContextValue | null>(null);

export const useDbContext = (): DbContextValue => {
  const context = useContext(DbContext);
  if (!context) {
    throw new Error('useDbContext must be used within a DbProvider');
  }
  return context;
};
