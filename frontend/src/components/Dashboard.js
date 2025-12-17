import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ user, apiUrl, onStartInterview, onUploadResume, refreshTrigger, onOpenBugDebugging, onOpenDBLab }) {
  const [userStats, setUserStats] = useState({
    globalRank: 0,
    interviewsCompleted: 0,
    avgIntegrityScore: 0
  });
  const [resumeData, setResumeData] = useState(null);
  const [careerBlueprint, setCareerBlueprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user, refreshTrigger]); // Refresh when refreshTrigger changes
  
  // Also refresh when resume data changes
  useEffect(() => {
    if (resumeData) {
      // Reload blueprint when resume is loaded
      const token = localStorage.getItem('auth_token');
      if (token) {
        axios.get(`${apiUrl}/user/career-blueprint`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(response => {
          if (response.data) {
            setCareerBlueprint(response.data);
          }
        }).catch(error => {
          console.error('[Dashboard] Error reloading blueprint:', error);
        });
      }
    }
  }, [resumeData, apiUrl]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get authentication token once for all requests
      const token = localStorage.getItem('auth_token');
      
      // Load user stats using authentication token
      if (token) {
        try {
          const statsResponse = await axios.get(`${apiUrl}/user/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (statsResponse.data) {
            setUserStats({
              globalRank: statsResponse.data.global_rank || 1234,
              interviewsCompleted: statsResponse.data.total_interviews || 0,
              avgIntegrityScore: statsResponse.data.avg_integrity_score || 0
            });
          }
        } catch (error) {
          console.error('[Dashboard] Error loading user stats:', error);
          // Set default stats on error
          setUserStats({
            globalRank: 1234,
            interviewsCompleted: 0,
            avgIntegrityScore: 0
          });
        }
      } else {
        console.warn('[Dashboard] No auth token for stats - using defaults');
        setUserStats({
          globalRank: 1234,
          interviewsCompleted: 0,
          avgIntegrityScore: 0
        });
      }

      // Load resume data using authentication token
      if (token) {
        try {
          const resumeResponse = await axios.get(`${apiUrl}/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          console.log('[Dashboard] Profile response:', resumeResponse.data);
          console.log('[Dashboard] has_resume:', resumeResponse.data?.has_resume);
          console.log('[Dashboard] resume object:', resumeResponse.data?.resume);
          if (resumeResponse.data) {
            if (resumeResponse.data.resume) {
              console.log('[Dashboard] ✅ Resume data found:', resumeResponse.data.resume);
              console.log('[Dashboard] Skills:', resumeResponse.data.resume.skills);
              console.log('[Dashboard] Experience:', resumeResponse.data.resume.experience);
              console.log('[Dashboard] Summary:', resumeResponse.data.resume.summary);
              setResumeData(resumeResponse.data.resume);
            } else if (resumeResponse.data.has_resume) {
              console.log('[Dashboard] ⚠️ has_resume is true but no resume data in response');
              console.log('[Dashboard] Full response:', JSON.stringify(resumeResponse.data, null, 2));
              // Resume exists but data not loaded, try again after a short delay
              setTimeout(() => {
                console.log('[Dashboard] Retrying profile load...');
                loadUserData();
              }, 1000);
            } else {
              console.log('[Dashboard] ℹ️ No resume uploaded yet');
              console.log('[Dashboard] has_resume:', resumeResponse.data.has_resume);
              setResumeData(null);
            }
          }
        } catch (error) {
          console.error('[Dashboard] Error loading profile:', error);
          if (error.response?.status === 401) {
            console.error('[Dashboard] Authentication failed - token may be invalid');
          }
        }
      } else {
        console.warn('[Dashboard] No auth token found');
      }
      
      // Load career blueprint
      if (token) {
        try {
          const blueprintResponse = await axios.get(`${apiUrl}/user/career-blueprint`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (blueprintResponse.data) {
            console.log('[Dashboard] Career blueprint loaded:', blueprintResponse.data);
            setCareerBlueprint(blueprintResponse.data);
          }
        } catch (error) {
          console.error('[Dashboard] Error loading career blueprint:', error);
          // Set default blueprint
          setCareerBlueprint({
            career_level: "Junior Developer",
            skill_gaps: ["System Design"],
            estimated_time_to_senior: "6 Months",
            estimated_time_to_staff: "2 Years",
            progress_percentage: 50
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const skillProficiencyData = resumeData?.skills || ['Python', 'React', 'System Design', 'SQL', 'AWS'];
  const userName = user?.name || 'User';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo-icon">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="#0df259"></path>
              <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="#0df259" fillRule="evenodd"></path>
            </svg>
          </div>
          <div className="dashboard-brand-text">
            <h2 className="dashboard-brand-name">Aptiva</h2>
            <p className="dashboard-brand-tagline">Insight That Elevates</p>
          </div>
        </div>
        <p className="dashboard-title">Welcome back, {userName}!</p>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* Resume Profile Card */}
          <div className="dashboard-card">
            {resumeData ? (
              <>
                <p className="card-status success">Resume Parsed Successfully</p>
                <p className="card-title">Resume Profile</p>
                <div className="profile-info">
                  <p className="profile-text">{user?.name || 'User Name'}</p>
                  <p className="profile-text">{user?.email || 'user@email.com'}</p>
                  {resumeData.contact_info?.phone && (
                    <p className="profile-text">{resumeData.contact_info.phone}</p>
                  )}
                  {resumeData.contact_info?.location && (
                    <p className="profile-text">{resumeData.contact_info.location}</p>
                  )}
                </div>
                
                {resumeData.summary && (
                  <div className="resume-summary" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    <p className="card-title" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Summary</p>
                    <p className="profile-text" style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#9ca3af' }}>
                      {resumeData.summary.substring(0, 150)}{resumeData.summary.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )}
                
                {resumeData.analysis && (
                  <div className="resume-analysis" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    {resumeData.analysis.career_level && (
                      <p className="profile-text" style={{ fontSize: '0.85rem' }}>
                        <strong>Career Level:</strong> {resumeData.analysis.career_level}
                      </p>
                    )}
                    {resumeData.analysis.years_of_experience && (
                      <p className="profile-text" style={{ fontSize: '0.85rem' }}>
                        <strong>Experience:</strong> {resumeData.analysis.years_of_experience} years
                      </p>
                    )}
                  </div>
                )}
                
                <div className="skills-tags">
                  {skillProficiencyData.slice(0, 8).map((skill, index) => (
                    <div key={index} className="skill-tag">
                      <p>{typeof skill === 'string' ? skill : skill.name || skill}</p>
                    </div>
                  ))}
                </div>
                
                {resumeData.experience && resumeData.experience.length > 0 && (
                  <div className="resume-experience" style={{ marginTop: '1rem' }}>
                    <p className="card-title" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Experience</p>
                    {resumeData.experience.slice(0, 2).map((exp, idx) => (
                      <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <p className="profile-text" style={{ fontWeight: '600' }}>
                          {exp.title || exp.position || 'Position'} {exp.company ? `at ${exp.company}` : ''}
                        </p>
                        {exp.duration && (
                          <p className="profile-text" style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                            {exp.duration}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {resumeData.education && resumeData.education.length > 0 && (
                  <div className="resume-education" style={{ marginTop: '1rem' }}>
                    <p className="card-title" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Education</p>
                    {resumeData.education.slice(0, 2).map((edu, idx) => (
                      <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <p className="profile-text" style={{ fontWeight: '600' }}>
                          {edu.degree || edu.qualification || 'Degree'} {edu.institution ? `from ${edu.institution}` : ''}
                        </p>
                        {edu.year && (
                          <p className="profile-text" style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                            {edu.year}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn-primary" onClick={onUploadResume} style={{ marginTop: '1rem' }}>
                  Update Resume
                </button>
              </>
            ) : (
              <>
                <p className="card-title">Resume Profile</p>
                <p className="profile-text muted">No resume uploaded yet</p>
                <button className="btn-primary" onClick={onUploadResume}>
                  Upload Resume
                </button>
              </>
            )}
          </div>

          {/* Performance Overview Card */}
          <div className="dashboard-card">
            <p className="card-title">Performance Overview</p>
            <div className="stats-grid">
              <div className="stat-item">
                <p className="stat-label">Global Rank</p>
                <p className="stat-value">#{userStats.globalRank.toLocaleString()}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Interviews Completed</p>
                <p className="stat-value">{userStats.interviewsCompleted}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Average Integrity Score</p>
                <p className="stat-value">{userStats.avgIntegrityScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Proficiency Chart */}
        <div className="dashboard-card skill-chart-card">
          <p className="card-title">Skill Proficiency</p>
          <div className="chart-container">
            <div className="radar-chart-placeholder">
              <svg viewBox="0 0 600 600" className="radar-svg" preserveAspectRatio="xMidYMid meet">
                {/* Radar chart background - centered with padding */}
                <polygon
                  points="300,100 450,200 450,300 300,400 150,300 150,200"
                  fill="none"
                  stroke="rgba(36, 99, 235, 0.2)"
                  strokeWidth="1"
                />
                <polygon
                  points="300,150 400,225 400,275 300,350 200,275 200,225"
                  fill="none"
                  stroke="rgba(36, 99, 235, 0.2)"
                  strokeWidth="1"
                />
                <polygon
                  points="300,200 350,237.5 350,262.5 300,300 250,262.5 250,237.5"
                  fill="none"
                  stroke="rgba(36, 99, 235, 0.2)"
                  strokeWidth="1"
                />
                
                {/* Data polygon */}
                <polygon
                  points="300,130 420,210 410,290 300,370 190,280 180,210"
                  fill="rgba(36, 99, 235, 0.3)"
                  stroke="rgba(36, 99, 235, 0.8)"
                  strokeWidth="2"
                />
                
                {/* Axis lines */}
                <line x1="300" y1="250" x2="300" y2="100" stroke="rgba(36, 99, 235, 0.3)" strokeWidth="1"/>
                <line x1="300" y1="250" x2="450" y2="200" stroke="rgba(36, 99, 235, 0.3)" strokeWidth="1"/>
                <line x1="300" y1="250" x2="450" y2="300" stroke="rgba(36, 99, 235, 0.3)" strokeWidth="1"/>
                <line x1="300" y1="250" x2="300" y2="400" stroke="rgba(36, 99, 235, 0.3)" strokeWidth="1"/>
                <line x1="300" y1="250" x2="150" y2="300" stroke="rgba(36, 99, 235, 0.3)" strokeWidth="1"/>
                <line x1="300" y1="250" x2="150" y2="200" stroke="rgba(36, 99, 235, 0.3)" strokeWidth="1"/>
                
                {/* Labels - positioned further out with proper spacing */}
                <text x="300" y="80" textAnchor="middle" className="chart-label">Coding</text>
                <text x="480" y="205" textAnchor="start" className="chart-label">System Design</text>
                <text x="480" y="305" textAnchor="start" className="chart-label">Communication</text>
                <text x="300" y="440" textAnchor="middle" className="chart-label">Problem Solving</text>
                <text x="120" y="305" textAnchor="end" className="chart-label">Algorithms</text>
                <text x="120" y="205" textAnchor="end" className="chart-label">Data Structures</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Career Blueprint */}
        <div className="dashboard-card career-blueprint-card">
          <p className="card-title">Your Career Blueprint</p>
          <div className="career-timeline">
            <div className="timeline-track"></div>
            <div className="timeline-progress" style={{ width: `${careerBlueprint?.progress_percentage || 50}%` }}></div>
            
            <div className="timeline-points">
              <div className="timeline-point completed">
                <div className="point-circle">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <p className="point-label">{careerBlueprint?.career_level || 'Junior Developer'}</p>
              </div>
              
              {careerBlueprint?.skill_gaps && careerBlueprint.skill_gaps.length > 0 && (
                <div className="timeline-point active">
                  <div className="point-circle">
                    <span className="material-symbols-outlined">flag</span>
                  </div>
                  <p className="point-label">Skill Gap:<br/>{careerBlueprint.skill_gaps[0]}</p>
                </div>
              )}
              
              <div className="timeline-point">
                <div className="point-circle"></div>
                <p className="point-label muted">Senior Engineer<br/>(Est. {careerBlueprint?.estimated_time_to_senior || '6 Months'})</p>
              </div>
              
              <div className="timeline-point">
                <div className="point-circle"></div>
                <p className="point-label muted">Staff Engineer<br/>(Est. {careerBlueprint?.estimated_time_to_staff || '2 Years'})</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Practice Section */}
      <div className="dashboard-card advanced-practice-card">
        <p className="card-title">Advanced Technical Practice</p>
        <p className="profile-text muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
          Go beyond LeetCode with real-world engineering challenges
        </p>
        <div className="advanced-practice-grid">
          {onOpenBugDebugging && (
            <button className="practice-card" onClick={onOpenBugDebugging}>
              <div className="practice-icon">🐛</div>
              <h3>Broken Repo Debugging</h3>
              <p>Find and fix bugs in real codebases</p>
            </button>
          )}
          {onOpenDBLab && (
            <button className="practice-card" onClick={onOpenDBLab}>
              <div className="practice-icon">🗄️</div>
              <h3>Database Optimization Lab</h3>
              <p>Optimize SQL queries on 1M+ row datasets</p>
            </button>
          )}
        </div>
      </div>

      {/* Start Interview Button */}
      <div className="dashboard-actions">
        <button className="btn-start-interview" onClick={onStartInterview}>
          <span className="material-symbols-outlined">play_circle</span>
          <span>Start New Interview</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;

