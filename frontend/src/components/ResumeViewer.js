import React from 'react';
import './ResumeViewer.css';

const ResumeViewer = ({ resume, onClose }) => {
  if (!resume) {
    return null;
  }

  return (
    <div className="resume-viewer-overlay" onClick={onClose}>
      <div className="resume-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="resume-viewer__header">
          <h2 className="resume-viewer__title">📄 Resume Details</h2>
          <button
            className="resume-viewer__close"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="resume-viewer__content">
          {resume.uploaded_at && (
            <div className="resume-viewer__meta">
              <span className="resume-viewer__meta-label">Uploaded:</span>
              <span className="resume-viewer__meta-value">
                {new Date(resume.uploaded_at).toLocaleString()}
              </span>
            </div>
          )}

          {resume.skills && resume.skills.length > 0 && (
            <div className="resume-viewer__section">
              <h3 className="resume-viewer__section-title">🛠️ Skills</h3>
              <div className="resume-viewer__skills">
                {resume.skills.map((skill, index) => (
                  <span key={index} className="resume-viewer__skill-badge">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resume.experience && resume.experience.length > 0 && (
            <div className="resume-viewer__section">
              <h3 className="resume-viewer__section-title">💼 Work Experience</h3>
              <div className="resume-viewer__experience">
                {resume.experience.map((exp, index) => (
                  <div key={index} className="resume-viewer__experience-item">
                    <div className="resume-viewer__experience-header">
                      <strong className="resume-viewer__experience-title">
                        {exp.title || exp.position || 'Position'}
                      </strong>
                      {exp.company && (
                        <span className="resume-viewer__experience-company">
                          at {exp.company}
                        </span>
                      )}
                    </div>
                    {exp.duration && (
                      <div className="resume-viewer__experience-duration">
                        {exp.duration}
                      </div>
                    )}
                    {exp.description && (
                      <div className="resume-viewer__experience-description">
                        {exp.description}
                      </div>
                    )}
                    {exp.responsibilities && Array.isArray(exp.responsibilities) && (
                      <ul className="resume-viewer__experience-list">
                        {exp.responsibilities.map((resp, i) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.education && resume.education.length > 0 && (
            <div className="resume-viewer__section">
              <h3 className="resume-viewer__section-title">🎓 Education</h3>
              <div className="resume-viewer__education">
                {resume.education.map((edu, index) => (
                  <div key={index} className="resume-viewer__education-item">
                    <div className="resume-viewer__education-header">
                      <strong className="resume-viewer__education-degree">
                        {edu.degree || edu.course || 'Degree'}
                      </strong>
                      {edu.institution && (
                        <span className="resume-viewer__education-institution">
                          {edu.institution}
                        </span>
                      )}
                    </div>
                    {edu.year && (
                      <div className="resume-viewer__education-year">
                        {edu.year}
                      </div>
                    )}
                    {edu.gpa && (
                      <div className="resume-viewer__education-gpa">
                        GPA: {edu.gpa}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.raw_text && (
            <div className="resume-viewer__section">
              <h3 className="resume-viewer__section-title">📝 Full Text</h3>
              <div className="resume-viewer__raw-text">
                {resume.raw_text}
              </div>
            </div>
          )}

          {(!resume.skills || resume.skills.length === 0) &&
           (!resume.experience || resume.experience.length === 0) &&
           (!resume.education || resume.education.length === 0) && (
            <div className="resume-viewer__empty">
              <p>No resume details available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeViewer;

