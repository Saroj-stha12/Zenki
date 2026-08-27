import Image from "next/image";
import Link from "next/link";

export default function Branding() {
    return (
        <Link href="/" className="flex items-center gap-2 px-2 py-1 hover:bg-hover rounded">
            <Image src={'/logo.png'} height={24} width={24} alt="bugso1~logo" className="" />
            <span>zenki</span>
        </Link>
    )
}