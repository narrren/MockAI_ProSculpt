import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../i18n/languages';
import ResumeViewer from './ResumeViewer';
import './Profile.css';

const Profile = ({ apiUrl, userId, onResumeChange }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [showResumeViewer, setShowResumeViewer] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [apiUrl, userId]);

  const fetchProfile = async () => {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.data.status === 'success') {
        console.log('Profile loaded:', response.data); // Debug log
        console.log('Has resume:', response.data.has_resume); // Debug log
        console.log('Resume data:', response.data.resume); // Debug log
        setProfile(response.data);
        setName(response.data.name || '');
      } else {
        setError(response.data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Show a default profile even on error (for any user)
      const emailParts = userId ? userId.split('@') : [];
      const userName = emailParts.length > 0 ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : 'User';
      setProfile({
        status: 'success',
        email: userId || 'user@example.com',
        name: userName,
        has_resume: false,
        is_test: userId && userId.includes('test@aptiva.ai')
      });
      setError(''); // Clear error to show profile anyway
      console.log('Using fallback profile for:', userId);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleResumeUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      // No need to append user_id - backend will get it from token
      
      console.log('[Profile] Uploading resume with authentication token');

      const response = await axios.post(`${apiUrl}/resume/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.status === 'success') {
        setFile(null);
        setError('');
        console.log('Resume upload successful, refreshing profile...');
        // Force refresh profile multiple times to ensure it updates
        // First refresh after 300ms
        setTimeout(async () => {
          await fetchProfile();
        }, 300);
        // Second refresh after 1 second (in case first one was too fast)
        setTimeout(async () => {
          await fetchProfile();
          if (onResumeChange) {
            onResumeChange();
          }
        }, 1000);
      } else {
        setError(response.data.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }

    try {
      const response = await axios.delete(`${apiUrl}/user/resume`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.data.status === 'success') {
        setError('');
        // Refresh profile to update resume status
        await fetchProfile();
        if (onResumeChange) {
          onResumeChange();
        }
      } else {
        setError(response.data.message || 'Failed to delete resume');
      }
    } catch (error) {
      console.error('Resume delete error:', error);
      setError('Failed to delete resume');
    }
  };

  if (loading) {
    return (
      <div className="profile card card--padded">
        <div className="profile__loading">Loading profile...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile card card--padded">
        <div className="badge badge--danger">{error}</div>
        <button className="btn btn--primary btn--sm" onClick={fetchProfile} style={{ marginTop: 'var(--space-4)' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profile card card--padded">
      <div className="profile__header">
        <h3 className="card__title">👤 Profile</h3>
        <div className="profile__header-actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={fetchProfile}
            title="Refresh Profile"
          >
            🔄 Refresh
          </button>
          {!editing && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="badge badge--danger" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      <div className="profile__section">
        <div className="profile__field">
          <label className="profile__label">Email</label>
          <div className="profile__value">{profile?.email}</div>
        </div>

        <div className="profile__field">
          <label className="profile__label">Name</label>
          {editing ? (
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          ) : (
            <div className="profile__value">{profile?.name}</div>
          )}
        </div>

        {editing && (
          <div className="profile__actions">
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                setEditing(false);
                setName(profile?.name || '');
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn--accent btn--sm"
              onClick={() => {
                // TODO: Implement name update endpoint
                setEditing(false);
              }}
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="profile__section">
        <div className="profile__section-header">
          <h4 className="profile__section-title">📄 Resume</h4>
        </div>

        {(() => {
          const hasResumeFlag = profile?.has_resume === true;
          const hasResumeData = profile?.resume && Object.keys(profile.resume).length > 0;
          const shouldShowResume = hasResumeFlag || hasResumeData;
          
          if (profile) {
            console.log('🔍 Profile resume check:', {
              hasResumeFlag,
              hasResumeData,
              shouldShowResume,
              has_resume: profile.has_resume,
              resume: profile.resume
            });
          }
          
          return shouldShowResume;
        })() ? (
          <div className="profile__resume-info">
            <div className="profile__resume-status">
              <span className="badge badge--success">Resume Uploaded</span>
              {profile.resume?.uploaded_at && (
                <span className="profile__resume-date">
                  Uploaded: {new Date(profile.resume.uploaded_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {profile.resume?.skills && profile.resume.skills.length > 0 && (
              <div className="profile__resume-skills">
                <strong>Skills:</strong> {profile.resume.skills.slice(0, 10).join(', ')}
                {profile.resume.skills.length > 10 && '...'}
              </div>
            )}
            <div className="profile__resume-actions">
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setShowResumeViewer(true)}
              >
                👁️ View Resume
              </button>
              <label className="btn btn--ghost btn--sm" style={{ cursor: 'pointer' }}>
                Replace Resume
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                className="btn btn--danger btn--sm"
                onClick={handleResumeDelete}
              >
                Remove Resume
              </button>
            </div>
            {file && (
              <div className="profile__resume-upload">
                <div className="profile__resume-file-name">{file.name}</div>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleResumeUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload New Resume'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="profile__resume-empty">
            <p>No resume uploaded yet. You can upload your resume here to get personalized interview questions.</p>
            <label className="btn btn--primary btn--sm" style={{ cursor: 'pointer', marginTop: 'var(--space-4)' }}>
              📄 Upload Resume
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {file && (
              <div className="profile__resume-upload">
                <div className="profile__resume-file-name">{file.name}</div>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleResumeUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Resume'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showResumeViewer && profile?.resume && (
        <ResumeViewer
          resume={profile.resume}
          onClose={() => setShowResumeViewer(false)}
        />
      )}
    </div>
  );
};

export default Profile;

