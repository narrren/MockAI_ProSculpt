import React, { useState } from 'react';
import axios from 'axios';
import { t } from '../i18n/languages';
import './ResumeUpload.css';

const ResumeUpload = ({ apiUrl, userId, onUploadSuccess, onCancel }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    console.log('[ResumeUpload] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    
    if (!token || token === 'authenticated' || token === 'null' || token === 'undefined') {
      console.error('[ResumeUpload] No valid token found. Token value:', token);
      setError('Authentication required. Please log in again.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // No need to append user_id - backend will get it from token
      
      console.log('[ResumeUpload] Uploading resume with authentication token');
      console.log('[ResumeUpload] API URL:', `${apiUrl}/resume/upload`);
      console.log('[ResumeUpload] Token (first 20 chars):', token.substring(0, 20));

      const response = await axios.post(`${apiUrl}/resume/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('[ResumeUpload] Upload response:', response.data);

      if (response.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          if (onUploadSuccess) {
            onUploadSuccess(response.data);
          }
        }, 1500);
      } else {
        setError(response.data.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 413) {
        setError('File size too large. Maximum size is 5MB.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.message) {
        setError(`Upload failed: ${error.message}`);
      } else {
        setError('Failed to upload resume. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resume-upload-container">
      <div className="resume-upload card card--padded">
        <div className="resume-upload__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ flex: 1 }}>
              <h2 className="resume-upload__title">📄 Upload Your Resume</h2>
              <p className="resume-upload__subtitle">
                Upload your resume to get personalized interview questions and career insights.
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="resume-upload__close"
                title="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: '#6b7280',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#111318'}
                onMouseLeave={(e) => e.target.style.color = '#6b7280'}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {success ? (
          <div className="resume-upload__success">
            <div className="resume-upload__success-icon">✅</div>
            <h3>Resume Uploaded Successfully!</h3>
            <p>Redirecting to interview page...</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="resume-upload__form">
            <div className="resume-upload__file-section">
              <label htmlFor="resume-file" className="resume-upload__file-label">
                <div className="resume-upload__file-box">
                  <div className="resume-upload__file-icon">📎</div>
                  <div className="resume-upload__file-text">
                    {file ? file.name : 'Click to select PDF file'}
                  </div>
                  <div className="resume-upload__file-hint">PDF only, max 5MB</div>
                </div>
                <input
                  id="resume-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="resume-upload__file-input"
                  disabled={uploading}
                />
              </label>
            </div>

            {error && (
              <div className="badge badge--danger" style={{ marginTop: 'var(--space-4)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn btn--ghost"
                  disabled={uploading}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!file || uploading}
                style={{ flex: 1 }}
              >
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;

