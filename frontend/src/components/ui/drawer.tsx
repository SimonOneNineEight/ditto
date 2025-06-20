"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

function Drawer({
    shouldScaleBackground = true,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
    return (
        <DrawerPrimitive.Root
            data-slot="drawer"
            shouldScaleBackground={shouldScaleBackground}
            {...props}
        />
    )
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
    return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
    return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
    return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
    return (
        <DrawerPrimitive.Overlay
            data-slot="drawer-overlay"
            className={cn("fixed inset-0 z-50 bg-black/80", className)}
            {...props}
        />
    )
}

const drawerContentVariants = cva(
    "fixed z-50 border bg-background",
    {
        variants: {
            side: {
                bottom: "inset-x-0 bottom-0 mt-24 flex h-auto flex-col rounded-t-[10px]",
                right: "right-0 inset-y-0 flex flex-col h-full rounded-l-[10px] border-l max-w-sm w-[20rem]",
            }
        },
        defaultVariants: {
            side: "bottom"
        }
    }
)

interface DrawerContentProps extends React.ComponentProps<typeof DrawerPrimitive.Content>, VariantProps<typeof drawerContentVariants> { }

function DrawerContent({
    className,
    children,
    side = "bottom",
    ...props
}: DrawerContentProps) {
    return (
        <DrawerPortal>
            <DrawerOverlay />
            <DrawerPrimitive.Content
                data-slot="drawer-content"
                className={cn(
                    drawerContentVariants({ side }),
                    className
                )}
                {...props}
            >
                {side === "bottom" ? (
                    <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
                ) : null
                }
                {children}
            </DrawerPrimitive.Content>
        </DrawerPortal>
    )
}

function DrawerHeader({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="drawer-header"
            className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
            {...props}
        />
    )
}

function DrawerFooter({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="drawer-footer"
            className={cn("mt-auto flex flex-col gap-2 p-4", className)}
            {...props}
        />
    )
}

function DrawerTitle({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
    return (
        <DrawerPrimitive.Title
            data-slot="drawer-title"
            className={cn(
                "text-lg font-semibold leading-none tracking-tight",
                className
            )}
            {...props}
        />
    )
}

function DrawerDescription({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
    return (
        <DrawerPrimitive.Description
            data-slot="drawer-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
}

export {
    Drawer,
    DrawerPortal,
    DrawerOverlay,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
}
