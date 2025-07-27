import React, { useRef, useState } from 'react';
import { Upload, X, Image, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useFileUpload, useMultipleFileUpload, useDragAndDrop } from '@/hooks/useStorage';

// ===========================================
// SINGLE FILE UPLOAD COMPONENT
// ===========================================

interface SingleFileUploadProps {
  path: string;
  acceptedTypes?: string[];
  maxSize?: number;
  onUploadComplete?: (url: string) => void;
  onError?: (error: string) => void;
  className?: string;
  placeholder?: string;
}

export function SingleFileUpload({
  path,
  acceptedTypes = ['image/*'],
  maxSize = 5 * 1024 * 1024, // 5MB
  onUploadComplete,
  onError,
  className = '',
  placeholder = 'Click to upload or drag and drop',
}: SingleFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadFile, uploading, progress, error, downloadURL } = useFileUpload();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file size
      if (file.size > maxSize) {
        const errorMsg = `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`;
        onError?.(errorMsg);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const { isDragging, dragHandlers } = useDragAndDrop(handleFileSelect, acceptedTypes);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const url = await uploadFile(path, selectedFile);
      onUploadComplete?.(url);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...dragHandlers}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
        <p className="text-xs text-gray-500">
          Accepted: {acceptedTypes.join(', ')} • Max: {maxSize / (1024 * 1024)}MB
        </p>
      </div>

      {/* Selected File */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {selectedFile.type.startsWith('image/') ? (
              <Image className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-gray-500" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!uploading && (
              <button
                onClick={handleUpload}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Upload
              </button>
            )}
            <button
              onClick={handleRemove}
              className="p-1 text-gray-400 hover:text-gray-600"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {uploading && progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(progress.percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Success */}
      {downloadURL && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-700">Upload successful!</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
    </div>
  );
}

// ===========================================
// MULTIPLE FILE UPLOAD COMPONENT
// ===========================================

interface MultipleFileUploadProps {
  path: string;
  acceptedTypes?: string[];
  maxSize?: number;
  maxFiles?: number;
  onUploadComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
  className?: string;
  placeholder?: string;
}

export function MultipleFileUpload({
  path,
  acceptedTypes = ['image/*'],
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 10,
  onUploadComplete,
  onError,
  className = '',
  placeholder = 'Click to upload or drag and drop multiple files',
}: MultipleFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { uploadFiles, uploading, progress, error, downloadURLs, completed, total } = useMultipleFileUpload();

  const handleFileSelect = (files: File[]) => {
    // Validate file count
    if (files.length > maxFiles) {
      onError?.(`Too many files. Maximum: ${maxFiles}`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      onError?.(`Some files are too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setSelectedFiles(files);
  };

  const { isDragging, dragHandlers } = useDragAndDrop(handleFileSelect, acceptedTypes);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const urls = await uploadFiles(path, selectedFiles);
      onUploadComplete?.(urls);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...dragHandlers}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
        <p className="text-xs text-gray-500">
          Accepted: {acceptedTypes.join(', ')} • Max: {maxFiles} files, {maxSize / (1024 * 1024)}MB each
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="space-x-2">
              {!uploading && (
                <button
                  onClick={handleUpload}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Upload All
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                disabled={uploading}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {progress[index] && (
                    <div className="w-16 text-xs text-gray-500">
                      {Math.round(progress[index].percentage)}%
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Progress */}
      {uploading && total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading files...</span>
            <span>{completed} of {total} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Success */}
      {downloadURLs.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-700">
            {downloadURLs.length} file(s) uploaded successfully!
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
    </div>
  );
}

// ===========================================
// IMAGE PREVIEW COMPONENT
// ===========================================

interface ImagePreviewProps {
  files: File[];
  onRemove?: (index: number) => void;
  className?: string;
}

export function ImagePreview({ files, onRemove, className = '' }: ImagePreviewProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {files.map((file, index) => (
        <div key={index} className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <p className="mt-2 text-xs text-gray-500 truncate">{file.name}</p>
        </div>
      ))}
    </div>
  );
}

export default SingleFileUpload;