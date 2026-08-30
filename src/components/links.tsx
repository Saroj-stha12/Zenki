import { GithubIcon, HelpCircleIcon } from "lucide-react";
import Shortcut from "./ui/shortcut";

export default function Links() {
    return (
        <div className="flex flex-col gap-1">
            <a
                href="https://github.com/Saroj-stha12/Zenki"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-hover rounded"
                aria-label="Open the Zenki GitHub repository"
            >
                <div className="flex items-center gap-2"><GithubIcon strokeWidth={1} /><span>Github</span></div><Shortcut shortcut="G" />
            </a>
            <a
                href="https://github.com/Saroj-stha12/Zenki/blob/main/README.md"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-hover rounded"
                aria-label="Open the Zenki README documentation"
            >
                <div className="flex items-center gap-2"><HelpCircleIcon strokeWidth={1} /><span>Help & documentation</span></div><Shortcut shortcut="." />
            </a>

        </div>
    )
}
