"use client";
import { useState, useRef, useEffect } from "react";
import HeaderMenu from "../menus/headerMenu";
import CartButton from "./cartButton";
import DefaultProfilePhoto from "../defaultProfilePhoto";

const HeaderMenuButton = () => {
    const [menuShown, setMenuShown] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const outsideMenu = !containerRef.current?.contains(target);
            const outsideButton = !buttonRef.current?.contains(target);
            
            if (outsideMenu && outsideButton) {
                setMenuShown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            {menuShown && <HeaderMenu ref={containerRef} />}
            <div
                ref={buttonRef}
                className="flex items-center gap-[15px] relative border border-transparent hover:border-third/50 rounded-full p-[5px] pl-[10px] hover:bg-primary-dark/50 duration-[200ms] hover:scale-[105%] cursor-pointer"
                onClick={() => setMenuShown(prev => !prev)}
            >
                <CartButton />
                <DefaultProfilePhoto totalHeight={30} headSize={10} />
            </div>
        </>
    );
};

export default HeaderMenuButton;
