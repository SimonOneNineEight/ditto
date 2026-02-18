import { forwardRef, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormLabel, FormFieldWrapper } from './form-label';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    required?: boolean;
    multiline?: boolean;
    rows?: number;
    highlight?: boolean;
    error?: string;
}

const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
    ({ label, required, multiline, rows, highlight, error, id: propId, ...props }, ref) => {
        const generatedId = useId();
        const id = propId || generatedId;
        const errorId = `${id}-error`;

        return (
            <FormFieldWrapper className={highlight ? 'field-highlight' : ''}>
                <FormLabel htmlFor={id} required={required} error={!!error}>{label}</FormLabel>
                {multiline ? (
                    <Textarea
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        id={id}
                        rows={rows}
                        aria-required={required}
                        aria-invalid={!!error}
                        aria-describedby={error ? errorId : undefined}
                        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : (
                    <Input
                        ref={ref as React.Ref<HTMLInputElement>}
                        id={id}
                        aria-required={required}
                        aria-invalid={!!error}
                        aria-describedby={error ? errorId : undefined}
                        {...props}
                    />
                )}
                {error && <p id={errorId} role="alert" className="text-xs text-destructive mt-1">{error}</p>}
            </FormFieldWrapper>
        );
    }
);

FormField.displayName = 'FormField';

export default FormField;
