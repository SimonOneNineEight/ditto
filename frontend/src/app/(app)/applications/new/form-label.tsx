interface FormLabelProps {
    children: React.ReactNode;
    required?: boolean;
    error?: boolean;
    className?: string;
}

export const FormLabel = ({ children, required, error, className = '' }: FormLabelProps) => {
    return (
        <label className={`text-xs font-medium uppercase tracking-wider flex items-center gap-1 ${error ? 'text-destructive' : 'text-muted-foreground'} ${className}`}>
            {children}
            {required && <span className={error ? 'text-destructive' : 'text-primary'}>*</span>}
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
