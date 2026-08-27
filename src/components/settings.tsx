'use client'
import { Settings2Icon, X } from "lucide-react"
import Shortcut from "./ui/shortcut"
import { useState, useEffect } from "react"
import { useTheme } from "@/contexts/themeContext"
import Image from "next/image"
type Theme = 'light' | 'dark';
export default function Settings() {
    const [expand, setExpand] = useState<boolean>(false)
    const { setTheme } = useTheme()
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === ',') {
                event.preventDefault();
                event.stopPropagation();
                setExpand(true)
            }
            if (event.key === "Escape" || event.key === "esc") {
                setExpand(false)
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, []);

    const switchTheme = (theme: Theme) => {
        setTheme(theme)
    }
    return (
        <div>
            <div onClick={() => setExpand(true)} className="flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-hover rounded">
                <div className="flex items-center gap-2"><Settings2Icon strokeWidth={1}/><span>Settings</span></div><Shortcut shortcut="," />
            </div>

            {
                expand && <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[2px] z-999">
                    <div className="w-[40vw] bg-background p-4 rounded-lg flex flex-col gap-10 outline outline-1 outline-outline">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl">Settings</h1>
                            <X onClick={() => setExpand(false)} className="cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-5">
                            <div>
                                <h1>Appearance</h1>
                                <p className="text-btnhover text-sm">this changes the whole UI + Editor looks</p>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <Image onClick={() => switchTheme('light')} height={180} width={320} src={'/theme/light.png'} alt="light" className="rounded cursor-pointer" />
                                <Image onClick={() => switchTheme('dark')} height={180} width={320} src={'/theme/dark.png'} alt="light" className="outline outline-1 outline-outline rounded cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}
