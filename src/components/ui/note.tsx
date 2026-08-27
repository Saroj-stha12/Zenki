'use client';

import { EllipsisIcon, StarOffIcon, StarIcon, Trash2Icon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import db from '../../libs/db';
import { useDbContext } from '@/contexts/dbContext';
import { usePathname, useRouter } from 'next/navigation';
interface NoteProps {
  note: {
    uuid: string;
    icon: string;
    title: string;
    content: unknown;
    favorite?: boolean;
  };
}

export default function Note({ note }: NoteProps) {
  const router = useRouter()
  const path = usePathname();
  const [expand, setExpand] = useState(false);
  const [isFavorite, setIsFavorite] = useState(note.favorite ?? false);
  const [isVisible, setIsVisible] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { refreshNotes, refreshFavoriteNotes, refreshWorkspaces } = useDbContext()


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExpand(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleEllipsisClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpand(prev => !prev);
  };

  const handleMenuMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const toggleFavorite = async () => {
    const newStatus = !isFavorite;
    await db.notes.update(note.uuid, { favorite: newStatus });
    setIsFavorite(newStatus);
    setExpand(false);
    refreshNotes()
    refreshFavoriteNotes()
  };

  const deleteNote = async () => {
    await db.notes.delete(note.uuid);
    if (path.includes(note.uuid.toString())) {
      router.push('/')
    }
    setIsVisible(false);
    refreshNotes()
    refreshFavoriteNotes()
    refreshWorkspaces()
  };

  if (!isVisible) return null;

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-hover rounded">
      <Link href={`/editor/${note.uuid}`} className="flex items-center gap-2">
        <Image src={`/icons/${note.icon}`} height={24} width={24} alt={note.uuid} />
        <span className="truncated">{note.title}</span>
      </Link>
      <div className="relative">
        <EllipsisIcon onClick={handleEllipsisClick} className="cursor-pointer" />
        {expand && (
          <div
            ref={menuRef}
            className="fixed mt-2 flex flex-col gap-2 w-[20rem] p-2 bg-background z-999 rounded outline outline-[1px] outline-outline"
            onMouseDown={handleMenuMouseDown}
          >
            <div
              onClick={toggleFavorite}
              className="flex items-center gap-5 px-2 py-1 cursor-pointer hover:bg-hover rounded"
            >
              {isFavorite ? <StarOffIcon strokeWidth={1} /> : <StarIcon strokeWidth={1} />}
              <span>{isFavorite ? 'Remove from favourites' : 'Mark as favourite'}</span>
            </div>
            <div
              onClick={deleteNote}
              className="flex items-center gap-5 px-2 py-1 cursor-pointer  hover:bg-hover rounded"
            >
              <Trash2Icon strokeWidth={1} />
              <span>Delete note permanently</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
