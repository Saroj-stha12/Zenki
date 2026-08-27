import { ThemeProvider } from "@/contexts/themeContext";
import Createfolder from "./createfolder";
import Createnote from "./createnote";
import Favourites from "./favourites";
import Links from "./links";
import Search from "./search";
import Settings from "./settings";
import Branding from "./ui/branding";
import Workspaces from "./workspaces";
import Cheatsheet from "./cheatsheet";

export default function Sidebar() {
    return (
        <div className="flex flex-col h-[100vh] w-[25rem] p-1 bg-sidebar border-r-[1px] border-outline">
            <>
                <Branding />
                <Search />
                <Createfolder />
                <Createnote />
            </>
            <div className="h-5"></div>
            <Favourites />
            <div className="h-5"></div>
            <Workspaces />
            <>
                <ThemeProvider>
                    <Settings />
                </ThemeProvider>
                <Cheatsheet />
                <Links />
            </>
        </div>
    )
}