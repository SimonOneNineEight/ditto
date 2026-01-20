import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormLabel, FormFieldWrapper } from './form-label';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    required?: boolean;
    multiline?: boolean;
}

const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
    ({ label, required, multiline, ...props }, ref) => {
        return (
            <FormFieldWrapper>
                <FormLabel required={required}>{label}</FormLabel>
                {multiline ? (
                    <Textarea
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : (
                    <Input ref={ref as React.Ref<HTMLInputElement>} {...props} />
                )}
            </FormFieldWrapper>
        );
    }
);

FormField.displayName = 'FormField';

export default FormField;
