'use client';

import { useDbContext } from '../contexts/dbContext';
import Note from './ui/note';

export default function Favourites() {
  const { favoriteNotes } = useDbContext();

  return (
    <div className="flex flex-col gap-2 px-2 py-1">
      <h1>Favourites</h1>
      <div className="flex flex-col gap-1">
        {favoriteNotes.length === 0 ? (
          <p className='text-alt px-2 py-1'>No favourite notes yet.</p>
        ) : (
          favoriteNotes.map((note) => <Note key={note.uuid} note={note} />)
        )}
      </div>
    </div>
  );
}
