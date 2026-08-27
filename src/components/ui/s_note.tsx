import { CornerDownRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type SearchnoteProps = {
    set: (value: boolean) => void;
    note: {
        uuid: string;
        icon: string;
        title: string;
    };
};

export default function Searchnote(props: SearchnoteProps) {
    return (
        <Link onClick={() => props.set(false)} href={`/editor/${props.note.uuid}`} className="group flex items-center gap-2 cursor-pointer px-2 py-1 hover:bg-hover rounded">
            <Image src={`/icons/${props.note.icon}`} height={24} width={24} alt="search~note~icon" />
            <span className="flex-1">{props.note.title}</span>
            <CornerDownRight size={16} className="hidden group-hover:block" />
        </Link>
    )
}
