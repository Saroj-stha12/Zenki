'use client';

import { useDbContext } from '../contexts/dbContext';
import Folder from './ui/folder';
import Note from './ui/note';

export default function Workspaces() {
    const { sidebarItems } = useDbContext();

    return (
        <div className="flex flex-1 flex-col gap-2 px-2 py-1">
            <h1>Workspaces</h1>
            <div className="flex flex-col gap-1">
                {sidebarItems.map((item) => {
                    if (item.type === 'workspace') {
                        return (
                            <Folder
                                key={item.workspace.uuid}
                                workspace={item.workspace}
                                notes={item.notes}
                            />
                        );
                    } else if (item.type === 'unsorted_notes') {
                        return item.notes.map((note) => (
                            <Note key={note.uuid} note={note} />
                        ));
                    }
                    return null;
                })}
            </div>
        </div>
    );
}
