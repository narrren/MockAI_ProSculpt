import React, { useState } from 'react';
import axios from 'axios';
import { t } from '../i18n/languages';
import './ResumeUpload.css';

const ResumeUpload = ({ apiUrl, userId, onUploadSuccess }) => {
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

    if (!userId || userId === 'user') {
      setError('User ID is required. Please log in again.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      
      console.log('[ResumeUpload] Uploading resume for userId:', userId);

      const response = await axios.post(`${apiUrl}/resume/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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
      setError(error.response?.data?.error || 'Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resume-upload-container">
      <div className="resume-upload card card--padded">
        <div className="resume-upload__header">
          <h2 className="resume-upload__title">📄 Upload Your Resume</h2>
          <p className="resume-upload__subtitle">
            Upload your resume to get personalized interview questions and career insights.
          </p>
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

            <button
              type="submit"
              className="btn btn--primary"
              disabled={!file || uploading}
              style={{ marginTop: 'var(--space-6)', width: '100%' }}
            >
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;

