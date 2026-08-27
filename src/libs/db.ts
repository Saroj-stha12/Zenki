'use client';

import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

export interface Workspace {
    uuid: string;
    title: string;
    icon: string;
    createdAt: string;
}

export interface Note {
    uuid: string;
    title: string;
    icon: string;
    content: unknown;
    workspaceuuid: string;
    createdAt: string;
    lastModified: string;
    favorite?: boolean;
}

class NoteEditorDB extends Dexie {
    workspaces!: Table<Workspace, string>;
    notes!: Table<Note, string>;

    constructor() {
        super('note_editor_db');

        this.version(1).stores({
            workspaces: 'uuid, title, icon, createdAt',
            notes: 'uuid, title, icon, content, workspaceuuid, createdAt, lastModified, favorite',
        });

        this.workspaces = this.table('workspaces');
        this.notes = this.table('notes');
    }

    private now(): string {
        return new Date().toISOString();
    }

    async createWorkspace(input: Pick<Workspace, 'title' | 'icon'>): Promise<Workspace> {
        const workspace: Workspace = {
            uuid: uuidv4(),
            title: input.title,
            icon: input.icon,
            createdAt: this.now(),
        };
        await this.workspaces.add(workspace);
        return workspace;
    }

    async getAllWorkspaces(): Promise<Workspace[]> {
        return this.workspaces.toArray();
    }

    async getWorkspace(uuid: string): Promise<Workspace | undefined> {
        return this.workspaces.get(uuid);
    }

    async updateWorkspace(uuid: string, updates: Partial<Omit<Workspace, 'uuid' | 'createdAt'>>): Promise<number> {
        return this.workspaces.update(uuid, updates);
    }

    async deleteWorkspace(uuid: string): Promise<void> {
        await this.notes.where('workspaceuuid').equals(uuid).delete();
        await this.workspaces.delete(uuid);
    }

    async createNote(input: Pick<Note, 'title' | 'icon' | 'content' | 'workspaceuuid' | 'favorite'>): Promise<Note> {
        const now = this.now();
        const note: Note = {
            uuid: uuidv4(),
            title: input.title,
            icon: input.icon,
            content: input.content,
            workspaceuuid: input.workspaceuuid,
            createdAt: now,
            lastModified: now,
            favorite: input.favorite ?? false,
        };
        await this.notes.add(note);
        return note;
    }

    async getNote(uuid: string): Promise<Note | undefined> {
        return this.notes.get(uuid);
    }

    async getNotesByWorkspace(workspaceuuid: string): Promise<Note[]> {
        return this.notes.where('workspaceuuid').equals(workspaceuuid).toArray();
    }

    async updateNote(
        uuid: string,
        updates: Partial<Omit<Note, 'uuid' | 'workspaceuuid' | 'createdAt'>>
    ): Promise<number> {
        return this.notes.update(uuid, {
            ...updates,
            lastModified: this.now(),
        });
    }

    async deleteNote(uuid: string): Promise<void> {
        await this.notes.delete(uuid);
    }
}

const dbContext = new NoteEditorDB();
export default dbContext;
export { dbContext };
