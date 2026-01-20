import { PageHeader } from '@/components/page-header';
import AddApplicationForm from './add-application-form';

const AddApplicationPage = () => {
    return (
        <div className="w-full max-w-[720px] mx-auto">
            <PageHeader
                title="Add Application"
                breadcrumbs={[{ label: 'Applications', href: '/applications' }]}
            />
            <AddApplicationForm />
        </div>
    );
};

export default AddApplicationPage;
