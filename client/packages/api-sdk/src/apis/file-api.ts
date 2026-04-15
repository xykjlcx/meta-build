import { getClient } from '../config';
import { deleteFileById, postFile } from '../generated/endpoints/file-controller/file-controller';
import type { FileUploadView as GeneratedFileUploadView } from '../generated/models';

export type FileUploadView = GeneratedFileUploadView;

export const fileApi = {
  upload(file: File): Promise<FileUploadView> {
    return postFile({ file });
  },
  download(fileId: number): Promise<Blob> {
    return getClient().request<Blob>(`/api/v1/files/${fileId}/download`, {
      method: 'GET',
      responseType: 'blob',
    });
  },
  remove: deleteFileById,
};
