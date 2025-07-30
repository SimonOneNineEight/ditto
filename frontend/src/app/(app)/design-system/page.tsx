'use client';

import React from 'react';
import { ButtonDemo } from '@/components/button-demo';
import { TypographyDemo } from '@/components/typography-demo';
import { ColorPaletteDemo } from '@/components/color-palette-demo';

export default function DesignSystemPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="mb-2">Design System Gallery</h1>
                    <p className="text-body-large text-muted-foreground">
                        A comprehensive showcase of typography, colors, and all components
                    </p>
                </div>

                {/* Navigation */}
                <div className="mb-8">
                    <nav className="flex gap-2 justify-center flex-wrap">
                        <a href="#typography" className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-caption font-medium">
                            Typography
                        </a>
                        <a href="#colors" className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-caption font-medium">
                            Colors
                        </a>
                        <a href="#buttons" className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-caption font-medium">
                            Buttons
                        </a>
                        <a href="#cards" className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-caption font-medium">
                            Cards
                        </a>
                        <a href="#forms" className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-caption font-medium">
                            Forms
                        </a>
                        <a href="#tables" className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-caption font-medium">
                            Tables
                        </a>
                    </nav>
                </div>

                {/* Content */}
                <div className="space-y-16">
                    {/* Typography Section */}
                    <section id="typography" className="scroll-mt-16">
                        <div className="bg-card rounded-lg border p-6">
                            <TypographyDemo />
                        </div>
                    </section>

                    {/* Colors Section */}
                    <section id="colors" className="scroll-mt-16">
                        <div className="bg-card rounded-lg border p-6">
                            <ColorPaletteDemo />
                        </div>
                    </section>

                    {/* Buttons Section */}
                    <section id="buttons" className="scroll-mt-16">
                        <div className="bg-card rounded-lg border p-6">
                            <ButtonDemo />
                        </div>
                    </section>

                    {/* Cards Section */}
                    <section id="cards" className="scroll-mt-16">
                        <div className="bg-card rounded-lg border p-6">
                            <h2 className="text-2xl font-bold mb-6">Cards</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-card border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Basic Card</h3>
                                    <p className="text-sm text-muted-foreground">
                                        This is a basic card component with some content.
                                    </p>
                                </div>
                                <div className="bg-card border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Card with Header</h3>
                                    <p className="text-sm text-muted-foreground">
                                        This card includes a header and body content.
                                    </p>
                                </div>
                                <div className="bg-card border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Card with Actions</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        This card includes action buttons.
                                    </p>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                                            Action
                                        </button>
                                        <button className="px-3 py-1 border rounded text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Forms Section */}
                    <section id="forms" className="scroll-mt-16">
                        <div className="bg-card rounded-lg border p-6">
                            <h2 className="text-2xl font-bold mb-6">Forms</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Text Input
                                        </label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder="Enter text..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Email Input
                                        </label>
                                        <input 
                                            type="email" 
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder="Enter email..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Textarea
                                        </label>
                                        <textarea 
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                            rows={4}
                                            placeholder="Enter message..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Select
                                        </label>
                                        <select className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                                            <option>Option 1</option>
                                            <option>Option 2</option>
                                            <option>Option 3</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" className="rounded border-gray-300" />
                                            <span className="text-sm">Checkbox option</span>
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" name="radio" className="border-gray-300" />
                                            <span className="text-sm">Radio option 1</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" name="radio" className="border-gray-300" />
                                            <span className="text-sm">Radio option 2</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tables Section */}
                    <section id="tables" className="scroll-mt-16">
                        <div className="bg-card rounded-lg border p-6">
                            <h2 className="text-2xl font-bold mb-6">Tables</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-medium">Name</th>
                                            <th className="text-left p-2 font-medium">Email</th>
                                            <th className="text-left p-2 font-medium">Role</th>
                                            <th className="text-left p-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="p-2">John Doe</td>
                                            <td className="p-2">john@example.com</td>
                                            <td className="p-2">Admin</td>
                                            <td className="p-2">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2">Jane Smith</td>
                                            <td className="p-2">jane@example.com</td>
                                            <td className="p-2">User</td>
                                            <td className="p-2">
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                                    Pending
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-2">Bob Johnson</td>
                                            <td className="p-2">bob@example.com</td>
                                            <td className="p-2">User</td>
                                            <td className="p-2">
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                    Inactive
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-muted-foreground">
                    <p>Design System Gallery • Built with Next.js, Tailwind CSS, and Radix UI</p>
                </div>
            </div>
        </div>
    );
}