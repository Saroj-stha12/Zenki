'use client';

import { LoaderCircleIcon, SearchIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useMemo, useCallback } from 'react';

type EmojiItem = {
    icon: string;
    title: string;
};

type EmojiProps = {
    icons: string;
    set: (icon: string) => void;
    enlarged?: boolean;
};

export default function Emoji(props: EmojiProps) {
    const [expand, setExpand] = useState(false);
    const [emojis, setEmojis] = useState<EmojiItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState<string>(props.icons);

    const cachedEmojis = useMemo(() => {
        return emojis.filter((emoji: { title: string; icon: string }) =>
            emoji.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [emojis, searchTerm]);

    useEffect(() => {
        const loadIcons = async () => {
            try {
                const response = await fetch('/emoji.json');
                const emojiData = await response.json();
                setEmojis(emojiData);
            } catch (err) {
                console.error('Error loading emojis:', err);
            }
        };
        loadIcons();
    }, []);

    const handleEmojiSelect = useCallback((emojiIcon: string) => {
        setSelectedEmoji(emojiIcon);
        props.set(emojiIcon);
        setExpand(false);
    }, [props]);

    return (
        <div className="relative">
            <div onClick={() => setExpand(true)} className="cursor-pointer">
                <Image
                    src={`/icons/${selectedEmoji}`}
                    alt="emoji"
                    height={props.enlarged ? 100 : 32}
                    width={props.enlarged ? 100 : 32}
                    priority
                    className="object-cover"
                />
            </div>
            {expand && (
                <div className="absolute mt-2 w-[20rem] h-[20rem] flex flex-col gap-5 p-2 bg-[#ffffff50] backdrop-blur-sm rounded-lg z-99">
                    <div className="flex items-center gap-2">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search emojis : 🤬"
                            className="flex-1 bg-transparent border-none outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus={true}
                        />
                        <X onClick={() => setExpand(false)} className="cursor-pointer" />
                    </div>
                    {emojis && emojis.length > 0 ? (
                        <div className="flex flex-1 flex-wrap gap-2 overflow-y-scroll">
                            {cachedEmojis.map((emoji: { icon: string; title: string }, index) => (
                                <div key={index} className="w-8 h-8">
                                    <Image
                                        loading="lazy"
                                        src={`/icons/${emoji.icon}`}
                                        height={38}
                                        width={38}
                                        alt={emoji.title}
                                        className="cursor-pointer object-cover"
                                        onClick={() => handleEmojiSelect(emoji.icon)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <LoaderCircleIcon className="animate-spin" />
                    )}
                </div>
            )}
        </div>
    );
}
