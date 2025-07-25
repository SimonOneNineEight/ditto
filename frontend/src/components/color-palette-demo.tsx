'use client';

import React from 'react';

export function ColorPaletteDemo() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-6">Color System</h2>
                <p className="text-body-large text-muted-foreground mb-8">
                    Purple, orange, and yellow color palette with semantic tokens for light and dark modes.
                </p>
            </div>

            {/* Primary Colors */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Primary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 bg-primary rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Primary</div>
                            <div className="text-muted-foreground">Blue #219BF3</div>
                            <code className="text-xs">bg-primary</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-primary-foreground rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Primary Foreground</div>
                            <div className="text-muted-foreground">White</div>
                            <code className="text-xs">bg-primary-foreground</code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Colors */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Secondary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 bg-secondary rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Secondary</div>
                            <div className="text-muted-foreground">Orange #FF7C2A</div>
                            <code className="text-xs">bg-secondary</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-secondary-foreground rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Secondary Foreground</div>
                            <div className="text-muted-foreground">White</div>
                            <code className="text-xs">bg-secondary-foreground</code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accent Colors */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Accent Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 bg-accent rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Accent</div>
                            <div className="text-muted-foreground">Yellow #F2C744</div>
                            <code className="text-xs">bg-accent</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-accent-foreground rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Accent Foreground</div>
                            <div className="text-muted-foreground">Black</div>
                            <code className="text-xs">bg-accent-foreground</code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Semantic Colors */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Semantic Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 bg-warning rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Warning</div>
                            <div className="text-muted-foreground">Orange</div>
                            <code className="text-xs">bg-warning</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-info rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Info</div>
                            <div className="text-muted-foreground">Blue</div>
                            <code className="text-xs">bg-info</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-destructive rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Destructive</div>
                            <div className="text-muted-foreground">Red</div>
                            <code className="text-xs">bg-destructive</code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background & Surface Colors */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Background & Surface</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 bg-background rounded-lg border-2"></div>
                        <div className="text-caption">
                            <div className="font-medium">Background</div>
                            <div className="text-muted-foreground">App background</div>
                            <code className="text-xs">bg-background</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-card rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Card</div>
                            <div className="text-muted-foreground">Card background</div>
                            <code className="text-xs">bg-card</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-muted rounded-lg border"></div>
                        <div className="text-caption">
                            <div className="font-medium">Muted</div>
                            <div className="text-muted-foreground">Subtle background</div>
                            <code className="text-xs">bg-muted</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-popover rounded-lg border shadow-lg"></div>
                        <div className="text-caption">
                            <div className="font-medium">Popover</div>
                            <div className="text-muted-foreground">Overlay background</div>
                            <code className="text-xs">bg-popover</code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Text Colors */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Text Colors</h3>
                <div className="space-y-4 border rounded-lg p-6 bg-muted/20">
                    <div className="flex items-center gap-4">
                        <span className="text-foreground">Primary Text</span>
                        <code className="text-caption text-muted-foreground">text-foreground</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Secondary Text</span>
                        <code className="text-caption text-muted-foreground">text-muted-foreground</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-primary">Primary Link</span>
                        <code className="text-caption text-muted-foreground">text-primary</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-warning">Warning Text</span>
                        <code className="text-caption text-muted-foreground">text-warning</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-destructive">Destructive Text</span>
                        <code className="text-caption text-muted-foreground">text-destructive</code>
                    </div>
                </div>
            </div>

            {/* Border Colors */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Border & Ring Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 bg-background border-4 border-border rounded-lg"></div>
                        <div className="text-caption">
                            <div className="font-medium">Border</div>
                            <div className="text-muted-foreground">Default borders</div>
                            <code className="text-xs">border-border</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-background border-4 border-input rounded-lg"></div>
                        <div className="text-caption">
                            <div className="font-medium">Input</div>
                            <div className="text-muted-foreground">Form borders</div>
                            <code className="text-xs">border-input</code>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 bg-background border-4 border-ring rounded-lg"></div>
                        <div className="text-caption">
                            <div className="font-medium">Ring</div>
                            <div className="text-muted-foreground">Focus rings</div>
                            <code className="text-xs">border-ring</code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Examples */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Usage Examples</h3>
                <div className="space-y-4">
                    {/* Status badges */}
                    <div className="border rounded-lg p-4 bg-muted/20">
                        <h4 className="text-subheading font-medium mb-3">Status Indicators</h4>
                        <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                                Applied
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                                Interviewing
                            </span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-xs font-medium">
                                Waiting
                            </span>
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full text-xs font-medium">
                                Offered
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full text-xs font-medium">
                                Not Applied
                            </span>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="border rounded-lg p-4 bg-muted/20">
                        <h4 className="text-subheading font-medium mb-3">Card Variations</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card border rounded-lg p-4">
                                <h5 className="font-medium mb-2">Default Card</h5>
                                <p className="text-caption text-muted-foreground">Standard card background</p>
                            </div>
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                <h5 className="font-medium mb-2 text-primary">Primary Card</h5>
                                <p className="text-caption text-muted-foreground">Primary themed card</p>
                            </div>
                            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                                <h5 className="font-medium mb-2 text-warning">Warning Card</h5>
                                <p className="text-caption text-muted-foreground">Warning themed card</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}