import { forwardRef } from 'react';
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
    ({ label, required, multiline, rows, highlight, error, ...props }, ref) => {
        return (
            <FormFieldWrapper className={highlight ? 'field-highlight' : ''}>
                <FormLabel required={required} error={!!error}>{label}</FormLabel>
                {multiline ? (
                    <Textarea
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        rows={rows}
                        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : (
                    <Input ref={ref as React.Ref<HTMLInputElement>} {...props} />
                )}
                {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </FormFieldWrapper>
        );
    }
);

FormField.displayName = 'FormField';

export default FormField;
