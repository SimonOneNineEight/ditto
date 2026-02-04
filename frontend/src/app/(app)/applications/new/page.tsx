import { PageHeader } from '@/components/page-header';
import ApplicationForm from './add-application-form';

const AddApplicationPage = () => {
    return (
        <div className="w-full max-w-[720px] mx-auto">
            <PageHeader
                title="New Application"
                subtitle="Add a new job application to track"
                breadcrumbs={[{ label: 'Applications', href: '/applications' }]}
            />
            <ApplicationForm mode="create" />
        </div>
    );
};

export default AddApplicationPage;
