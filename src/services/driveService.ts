import { DriveFile } from '@/types';
import { googleAuth } from './googleAuth';

export class DriveService {
  private static instance: DriveService;
  private baseUrl = 'https://www.googleapis.com/drive/v3';

  private constructor() {}

  static getInstance(): DriveService {
    if (!DriveService.instance) {
      DriveService.instance = new DriveService();
    }
    return DriveService.instance;
  }

  async getFiles(
    query?: string,
    maxResults: number = 50,
    orderBy: string = 'modifiedTime desc'
  ): Promise<DriveFile[]> {
    try {
      const params = new URLSearchParams({
        pageSize: maxResults.toString(),
        orderBy,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents)',
        ...(query && { q: query })
      });

      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/files?${params}`
      );

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files?.map((file: any) => this.parseDriveFile(file)) || [];
    } catch (error) {
      console.error('Failed to fetch Drive files:', error);
      // Return demo data for development
      return this.getDemoFiles(query);
    }
  }

  async searchFiles(query: string): Promise<DriveFile[]> {
    const searchQuery = `name contains '${query}' or fullText contains '${query}'`;
    return this.getFiles(searchQuery);
  }

  async getFile(fileId: string): Promise<DriveFile | null> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents`
      );

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseDriveFile(data);
    } catch (error) {
      console.error('Failed to fetch Drive file:', error);
      return null;
    }
  }

  async uploadFile(
    file: File,
    parentFolderId?: string,
    description?: string
  ): Promise<DriveFile | null> {
    try {
      const metadata = {
        name: file.name,
        description,
        ...(parentFolderId && { parents: [parentFolderId] })
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await googleAuth.makeAuthenticatedRequest(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents`,
        {
          method: 'POST',
          body: form
        }
      );

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseDriveFile(data);
    } catch (error) {
      console.error('Failed to upload file to Drive:', error);
      // Return a demo file for development
      return {
        id: `demo-upload-${Date.now()}`,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        modifiedTime: new Date(),
        webViewLink: '#',
        parents: parentFolderId ? [parentFolderId] : []
      };
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/files/${fileId}`,
        {
          method: 'DELETE'
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to delete Drive file:', error);
      return false;
    }
  }

  async createFolder(name: string, parentFolderId?: string): Promise<DriveFile | null> {
    try {
      const metadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId && { parents: [parentFolderId] })
      };

      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/files?fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents`,
        {
          method: 'POST',
          body: JSON.stringify(metadata)
        }
      );

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseDriveFile(data);
    } catch (error) {
      console.error('Failed to create Drive folder:', error);
      return null;
    }
  }

  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'commenter' = 'reader'): Promise<boolean> {
    try {
      const permission = {
        type: 'user',
        role,
        emailAddress: email
      };

      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/files/${fileId}/permissions`,
        {
          method: 'POST',
          body: JSON.stringify(permission)
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to share Drive file:', error);
      return false;
    }
  }

  async downloadFile(fileId: string): Promise<Blob | null> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/files/${fileId}?alt=media`
      );

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download Drive file:', error);
      return null;
    }
  }

  private parseDriveFile(file: any): DriveFile {
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size) || 0,
      modifiedTime: new Date(file.modifiedTime),
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      parents: file.parents || []
    };
  }

  private getDemoFiles(query?: string): DriveFile[] {
    const demoFiles: DriveFile[] = [
      {
        id: 'demo-file-1',
        name: 'Q4 Planning Document.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 245760,
        modifiedTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        webViewLink: 'https://docs.google.com/document/d/demo-file-1',
        parents: ['root']
      },
      {
        id: 'demo-file-2',
        name: 'Budget Analysis.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 512000,
        modifiedTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        webViewLink: 'https://docs.google.com/spreadsheets/d/demo-file-2',
        parents: ['root']
      },
      {
        id: 'demo-file-3',
        name: 'Project Presentation.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 1024000,
        modifiedTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        webViewLink: 'https://docs.google.com/presentation/d/demo-file-3',
        parents: ['root']
      },
      {
        id: 'demo-file-4',
        name: 'Team Photo.jpg',
        mimeType: 'image/jpeg',
        size: 2048000,
        modifiedTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        webViewLink: 'https://drive.google.com/file/d/demo-file-4',
        thumbnailLink: 'https://drive.google.com/thumbnail?id=demo-file-4',
        parents: ['photos-folder']
      },
      {
        id: 'demo-file-5',
        name: 'Meeting Notes.pdf',
        mimeType: 'application/pdf',
        size: 156000,
        modifiedTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
        webViewLink: 'https://drive.google.com/file/d/demo-file-5',
        parents: ['meetings-folder']
      },
      {
        id: 'demo-folder-1',
        name: 'Projects',
        mimeType: 'application/vnd.google-apps.folder',
        size: 0,
        modifiedTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
        webViewLink: 'https://drive.google.com/drive/folders/demo-folder-1',
        parents: ['root']
      }
    ];

    if (query) {
      return demoFiles.filter(file =>
        file.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    return demoFiles;
  }

  async getFolders(): Promise<DriveFile[]> {
    return this.getFiles("mimeType='application/vnd.google-apps.folder'");
  }

  async getRecentFiles(maxResults: number = 20): Promise<DriveFile[]> {
    return this.getFiles(undefined, maxResults, 'viewedByMeTime desc');
  }

  async getSharedFiles(): Promise<DriveFile[]> {
    return this.getFiles('sharedWithMe=true');
  }
}

export const driveService = DriveService.getInstance();
