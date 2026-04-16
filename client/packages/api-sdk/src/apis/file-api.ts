import { getClient } from '../config';
import { deleteFileById, postFile } from '../generated/endpoints/file-controller/file-controller';
import type { FileUploadVo as GeneratedFileUploadVo } from '../generated/models';

export type FileUploadVo = GeneratedFileUploadVo;

export const fileApi = {
  upload(file: File): Promise<FileUploadVo> {
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
