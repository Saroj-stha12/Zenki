import { CommandIcon } from "lucide-react";

export default function Shortcut(props: { shortcut: string }) {
    return (
        <div className="flex items-center gap-2 p-1 text-alt">
            <CommandIcon />
            <span>{props.shortcut}</span>
        </div>
    )
}