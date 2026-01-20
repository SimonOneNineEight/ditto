interface FormLabelProps {
    children: React.ReactNode;
    required?: boolean;
    className?: string;
}

export const FormLabel = ({ children, required, className = '' }: FormLabelProps) => {
    return (
        <label className={`text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1 ${className}`}>
            {children}
            {required && <span className="text-primary">*</span>}
        </label>
    );
};

interface FormFieldWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export const FormFieldWrapper = ({ children, className = '' }: FormFieldWrapperProps) => {
    return (
        <div className={`py-2 border-b border-transparent transition-all hover:border-border focus-within:border-border ${className}`}>
            {children}
        </div>
    );
};
