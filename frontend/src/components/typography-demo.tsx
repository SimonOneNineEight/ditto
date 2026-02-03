'use client';

import React from 'react';

export function TypographyDemo() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-6">Typography System</h2>
                <p className="text-body-large text-muted-foreground mb-8">
                    A comprehensive typography system using Geist Sans with semantic scales and utility classes.
                </p>
            </div>

            {/* Semantic Scale */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Semantic Typography Scale</h3>
                <div className="space-y-4 border rounded-lg p-6 bg-muted/20">
                    <div className="flex items-baseline gap-4">
                        <div className="text-display">Display</div>
                        <code className="text-caption text-muted-foreground">text-display • 56px • Hero text</code>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div className="text-title">Title</div>
                        <code className="text-caption text-muted-foreground">text-title • 32px • Page titles</code>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div className="text-headline">Headline</div>
                        <code className="text-caption text-muted-foreground">text-headline • 24px • Section headings</code>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div className="text-subheading">Subheading</div>
                        <code className="text-caption text-muted-foreground">text-subheading • 20px • Subsection titles</code>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div className="text-body-large">Body Large</div>
                        <code className="text-caption text-muted-foreground">text-body-large • 18px • Large body text</code>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div className="text-body">Body</div>
                        <code className="text-caption text-muted-foreground">text-body • 16px • Main content</code>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div className="text-caption">Caption</div>
                        <code className="text-caption text-muted-foreground">text-caption • 14px • Supporting text</code>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div className="text-overline">OVERLINE</div>
                        <code className="text-caption text-muted-foreground">text-overline • 12px • Labels, metadata</code>
                    </div>
                </div>
            </div>

            {/* Heading System */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Heading System (h1-h6)</h3>
                <div className="space-y-4 border rounded-lg p-6 bg-muted/20">
                    <h1>Heading 1 - Display sized, bold, tracking tight</h1>
                    <h2>Heading 2 - Title sized, semibold, with border</h2>
                    <h3>Heading 3 - Headline sized, semibold</h3>
                    <h4>Heading 4 - Subheading sized, semibold</h4>
                    <h5>Heading 5 - Body large, medium weight, muted</h5>
                    <h6>Heading 6 - Body sized, medium weight, muted</h6>
                </div>
            </div>

            {/* Job Application Specific */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Job Application Specific</h3>
                <div className="space-y-4 border rounded-lg p-6 bg-muted/20">
                    <div className="flex items-center gap-4">
                        <span className="text-status">Applied</span>
                        <code className="text-caption text-muted-foreground">text-status • Status indicators</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-metadata">Total Applications: 25</span>
                        <code className="text-caption text-muted-foreground">text-metadata • Metadata labels</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-emphasis">Important Information</span>
                        <code className="text-caption text-muted-foreground">text-emphasis • Emphasized text</code>
                    </div>
                </div>
            </div>

            {/* Semantic Colors */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Semantic Text Colors</h3>
                <div className="grid grid-cols-2 gap-4 border rounded-lg p-6 bg-muted/20">
                    <div className="flex items-center gap-4">
                        <span className="text-success">Success Message</span>
                        <code className="text-caption text-muted-foreground">text-success</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-warning">Warning Message</span>
                        <code className="text-caption text-muted-foreground">text-warning</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-error">Error Message</span>
                        <code className="text-caption text-muted-foreground">text-error</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-info">Info Message</span>
                        <code className="text-caption text-muted-foreground">text-info</code>
                    </div>
                </div>
            </div>

            {/* Text Elements */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Text Elements</h3>
                <div className="space-y-4 border rounded-lg p-6 bg-muted/20">
                    <p>
                        This is a paragraph with normal text. It includes <strong>strong text</strong>, <em>emphasized text</em>,
                        and <a href="#" className="link-primary">a primary link</a>. Here&apos;s some <code>inline code</code> as well.
                    </p>

                    <blockquote>
                        &quot;This is a blockquote that demonstrates how quoted text appears in the design system.&quot;
                    </blockquote>

                    <ul>
                        <li>This is a bulleted list item</li>
                        <li>Another list item with some longer content to show wrapping</li>
                        <li>Third item in the list</li>
                    </ul>

                    <ol>
                        <li>Numbered list item</li>
                        <li>Second numbered item</li>
                        <li>Third numbered item</li>
                    </ol>

                    <pre><code>{`// Code block example
function greet(name: string) {
  return \`Hello, \${name}!\`;
}`}</code></pre>
                </div>
            </div>

            {/* Link Variants */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Link Variants</h3>
                <div className="space-y-4 border rounded-lg p-6 bg-muted/20">
                    <div className="space-y-2">
                        <h4 className="text-subheading font-medium">Available Link Styles:</h4>
                        <div className="flex gap-4 flex-wrap">
                            <a href="#" className="link-primary">Primary Link</a>
                            <a href="#">Default Link (inherits color)</a>
                            <a href="#" className="link-muted">Muted Link</a>
                            <a href="#" className="link-subtle">Subtle Link</a>
                            <a href="#" className="link-button">Button-style Link</a>
                        </div>
                    </div>
                    <div className="text-caption text-muted-foreground space-y-1">
                        <div><code>link-primary</code> - Blue primary color with hover underline</div>
                        <div><code>default</code> - Inherits text color, focus ring only</div>
                        <div><code>link-muted</code> - Muted color, brightens on hover</div>
                        <div><code>link-subtle</code> - Inherits color, underline on hover</div>
                        <div><code>link-button</code> - No underlines, for button-like links</div>
                    </div>
                </div>
            </div>

            {/* Legacy Utilities */}
            <div>
                <h3 className="text-headline font-semibold mb-4">Legacy Compatibility</h3>
                <div className="space-y-2 border rounded-lg p-6 bg-muted/20">
                    <div className="flex items-center gap-4">
                        <span className="lead">Lead text for introductions</span>
                        <code className="text-caption text-muted-foreground">lead (legacy)</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="large">Large text for emphasis</span>
                        <code className="text-caption text-muted-foreground">large (legacy)</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="small">Small text for fine print</span>
                        <code className="text-caption text-muted-foreground">small (legacy)</code>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="muted">Muted text for less important content</span>
                        <code className="text-caption text-muted-foreground">muted (legacy)</code>
                    </div>
                </div>
            </div>
        </div>
    );
}