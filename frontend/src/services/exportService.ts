import api from '@/lib/axios';
import { ApplicationFilters } from './application-service';

function buildExportParams(filters?: ApplicationFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (!filters) return params;

  if (filters.status_ids && filters.status_ids.length > 0) {
    params.set('status_ids', filters.status_ids.join(','));
  }
  if (filters.company_name) params.set('company_name', filters.company_name);
  if (filters.job_title) params.set('job_title', filters.job_title);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.has_interviews !== undefined) params.set('has_interviews', String(filters.has_interviews));
  if (filters.has_assessments !== undefined) params.set('has_assessments', String(filters.has_assessments));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  return params;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportApplications(filters?: ApplicationFilters): Promise<void> {
  const params = buildExportParams(filters);
  const query = params.toString();
  const url = `/api/export/applications${query ? `?${query}` : ''}`;

  const response = await api.get(url, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = `applications_${new Date().toISOString().split('T')[0]}.csv`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename=([^;]+)/);
    if (match) {
      filename = match[1].trim();
    }
  }

  downloadBlob(response.data, filename);
}

export async function exportInterviews(filters?: ApplicationFilters): Promise<void> {
  const params = buildExportParams(filters);
  const query = params.toString();
  const url = `/api/export/interviews${query ? `?${query}` : ''}`;

  const response = await api.get(url, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = `interviews_${new Date().toISOString().split('T')[0]}.csv`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename=([^;]+)/);
    if (match) {
      filename = match[1].trim();
    }
  }

  downloadBlob(response.data, filename);
}

export async function exportBoth(filters?: ApplicationFilters): Promise<void> {
  await exportApplications(filters);
  await exportInterviews(filters);
}

export async function exportFullBackup(): Promise<void> {
  const response = await api.get('/api/export/full', {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = `ditto-backup-${new Date().toISOString().split('T')[0]}.json`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename=([^;]+)/);
    if (match) {
      filename = match[1].trim();
    }
  }

  downloadBlob(response.data, filename);
}
