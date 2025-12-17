import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import { t } from '../i18n/languages';
import './InterviewerAvatar.css';

const InterviewerAvatar = ({ isSpeaking, interviewerName = null, currentSpeech = null, apiUrl = null, onAvatarReady = null }) => {
  const displayName = interviewerName || t('app.interviewer');
  const [avatarReady, setAvatarReady] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const sessionInfoRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const roomRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const webSocketRef = useRef(null);

  // Notify parent when avatar status changes
  useEffect(() => {
    if (onAvatarReady) {
      if (avatarReady) {
        onAvatarReady(true);
      } else if (error) {
        // Avatar failed to load
        onAvatarReady(false);
      } else {
        // Avatar is still loading/initializing - notify parent that avatar exists
        // This prevents browser TTS from speaking while avatar is loading
        onAvatarReady(null);
      }
    }
  }, [avatarReady, error, onAvatarReady]);

  // HeyGen API Configuration
  const HEYGEN_CONFIG = {
    serverUrl: "https://api.heygen.com",
    avatarId: "SilasHR_public", // Professional avatar ID
    voiceId: "" // Optional: specify voice ID
  };

  // Get session token from backend
  const getSessionToken = async () => {
    try {
      console.log("[Avatar] Fetching session token from:", `${apiUrl || 'http://localhost:8000'}/api/heygen/token`);
      const response = await fetch(`${apiUrl || 'http://localhost:8000'}/api/heygen/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("[Avatar] Token response status:", response.status);

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = `HeyGen API authentication failed (401). The API key may be invalid or expired. Please check backend/.env file. ${errorData.detail || ''}`;
        setError(errorMsg);
        setStatus("Failed to get session token");
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
        throw new Error(errorMsg);
      }

      if (!response.ok) {
        const errorMsg = `Failed to get session token: ${response.status}`;
        setError(errorMsg);
        setStatus("Failed to get session token");
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.token) {
        const errorMsg = 'Invalid response from HeyGen API: missing token';
        setError(errorMsg);
        setStatus("Failed to get session token");
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
        throw new Error(errorMsg);
      }
      sessionTokenRef.current = data.token;
      setStatus("Session token obtained");
      return data.token;
    } catch (error) {
      const errorMsg = error.message || 'Failed to get session token';
      console.error("Error getting session token:", error);
      setStatus("Failed to get session token");
      setError(errorMsg);
      // Mark avatar as failed so browser TTS can be used
      setAvatarReady(false);
      if (onAvatarReady) {
        onAvatarReady(false);
      }
      throw error;
    }
  };

  // Connect WebSocket
  const connectWebSocket = async (sessionId) => {
    try {
      const params = new URLSearchParams({
        session_id: sessionId,
        session_token: sessionTokenRef.current,
        silence_response: false,
      });
      const wsUrl = `wss://${new URL(HEYGEN_CONFIG.serverUrl).hostname}/v1/ws/streaming.chat?${params}`;

      const ws = new WebSocket(wsUrl);

      ws.addEventListener("open", () => {
        console.log("WebSocket connected");
        setStatus("WebSocket connected");
      });

      ws.addEventListener("message", (event) => {
        const eventData = JSON.parse(event.data);
        console.log("WS event:", eventData);
      });

      ws.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
      });

      ws.addEventListener("close", () => {
        console.log("WebSocket closed");
      });

      webSocketRef.current = ws;
      return ws;
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      throw error;
    }
  };

  // Create HeyGen session
  const createHeyGenSession = async () => {
    try {
      if (!sessionTokenRef.current) {
        await getSessionToken();
      }

      const response = await fetch(`${HEYGEN_CONFIG.serverUrl}/v1/streaming.new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionTokenRef.current}`,
        },
        body: JSON.stringify({
          quality: "high",
          avatar_name: HEYGEN_CONFIG.avatarId,
          voice: HEYGEN_CONFIG.voiceId ? { voice_id: HEYGEN_CONFIG.voiceId } : undefined,
          version: "v2",
          video_encoding: "H264",
        }),
      });

      if (response.status === 401) {
        // Token expired, get a new one and retry
        console.log("Session token expired, getting new token...");
        await getSessionToken();
        // Retry with new token
        const retryResponse = await fetch(`${HEYGEN_CONFIG.serverUrl}/v1/streaming.new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionTokenRef.current}`,
          },
          body: JSON.stringify({
            quality: "high",
            avatar_name: HEYGEN_CONFIG.avatarId,
            voice: HEYGEN_CONFIG.voiceId ? { voice_id: HEYGEN_CONFIG.voiceId } : undefined,
            version: "v2",
            video_encoding: "H264",
          }),
        });
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text().catch(() => 'Unknown error');
          const errorMsg = `Failed to create session after token refresh: ${retryResponse.status} - ${errorText.substring(0, 200)}`;
          setError(errorMsg);
          setStatus("Failed to create avatar session");
          setAvatarReady(false);
          if (onAvatarReady) {
            onAvatarReady(false);
          }
          throw new Error(errorMsg);
        }
        
        const retryData = await retryResponse.json();
        if (!retryData.data) {
          const errorMsg = 'Invalid response from HeyGen API: missing data field';
          setError(errorMsg);
          setStatus("Failed to create avatar session");
          setAvatarReady(false);
          if (onAvatarReady) {
            onAvatarReady(false);
          }
          throw new Error(errorMsg);
        }
        sessionInfoRef.current = retryData.data;
      } else if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMsg = `Failed to create session: ${response.status} - ${errorText.substring(0, 200)}`;
        let retrySucceeded = false;
        
        // Check for specific HeyGen API errors
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.code === 10004 || errorData.message?.includes('Concurrent limit') || errorData.message?.includes('concurrent')) {
            // HeyGen free/trial plans often have a limit of 1 concurrent session
            // Try to stop all sessions and retry once
            console.log("[Avatar] Concurrent limit reached - attempting to stop all sessions and retry...");
            setStatus("Clearing existing sessions...");
            
            try {
              // Call stop-all endpoint to clear all sessions
              const stopAllResponse = await fetch(`${apiUrl || 'http://localhost:8000'}/api/heygen/stop-all`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              });
              console.log("[Avatar] Stop-all response:", stopAllResponse.status);
              
              // Wait for HeyGen to process the stop request
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Get a fresh token
              await getSessionToken();
              
              // Retry creating the session
              console.log("[Avatar] Retrying session creation after cleanup...");
              const retryResponse = await fetch(`${HEYGEN_CONFIG.serverUrl}/v1/streaming.new`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionTokenRef.current}`,
                },
                body: JSON.stringify({
                  quality: "high",
                  avatar_name: HEYGEN_CONFIG.avatarId,
                  voice: HEYGEN_CONFIG.voiceId ? { voice_id: HEYGEN_CONFIG.voiceId } : undefined,
                  version: "v2",
                  video_encoding: "H264",
                }),
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.data) {
                  console.log("[Avatar] Session created successfully after cleanup!");
                  sessionInfoRef.current = retryData.data;
                  retrySucceeded = true;
                  // Clear error message since retry succeeded
                  errorMsg = null;
                  // Continue with normal flow - LiveKit will be initialized below
                  console.log("[Avatar] Continuing with LiveKit initialization after successful retry...");
                } else {
                  // Retry succeeded but no data
                  errorMsg = 'Invalid response from HeyGen API after retry: missing data field';
                }
              } else {
                // Retry also failed, fall back to browser TTS
                const retryErrorText = await retryResponse.text().catch(() => 'Unknown error');
                console.warn("[Avatar] Retry after cleanup also failed:", retryErrorText);
                errorMsg = 'HeyGen API: Concurrent session limit reached. This usually means there\'s an active session from a previous page load. Please close all browser tabs/windows, wait 30 seconds, then refresh. Browser TTS is active and working perfectly - the interview will continue normally.';
              }
            } catch (retryError) {
              console.warn("[Avatar] Error during concurrent session cleanup/retry:", retryError);
              errorMsg = 'HeyGen API: Concurrent session limit reached. This usually means there\'s an active session from a previous page load. Please close all browser tabs/windows, wait 30 seconds, then refresh. Browser TTS is active and working perfectly - the interview will continue normally.';
            }
          } else if (errorData.message?.includes('quota') || errorData.message?.includes('Quota') || errorData.code === 10005) {
            // HeyGen quota/credit limit reached
            errorMsg = 'HeyGen API: Quota limit reached. The HeyGen account has run out of credits. Browser TTS is active and working perfectly - the interview will continue normally.';
          } else if (errorData.message) {
            errorMsg = `HeyGen API Error: ${errorData.message}. Browser TTS is active and working perfectly - the interview will continue normally.`;
          }
        } catch (e) {
          // If JSON parsing fails, use the original error message
        }
        
        // Only set error and throw if retry didn't succeed
        if (!retrySucceeded && errorMsg) {
          console.error("[Avatar] HeyGen session creation failed:", errorMsg);
          setError(errorMsg);
          setStatus("Avatar unavailable (using browser TTS)");
          setAvatarReady(false);
          if (onAvatarReady) {
            onAvatarReady(false); // Immediately notify parent that avatar failed
          }
          throw new Error(errorMsg);
        }
        // If retry succeeded, continue with normal flow (sessionInfoRef.current is already set)
      } else {
        const data = await response.json();
        if (!data.data) {
          const errorMsg = 'Invalid response from HeyGen API: missing data field';
          setError(errorMsg);
          setStatus("Failed to create avatar session");
          setAvatarReady(false);
          if (onAvatarReady) {
            onAvatarReady(false); // Immediately notify parent that avatar failed
          }
          throw new Error(errorMsg);
        }
        sessionInfoRef.current = data.data;
      }

      // LiveKit is now imported as npm package, no need to load from CDN
      console.log("[Avatar] LiveKit client available (npm package), initializing room...");
      // Use setTimeout to ensure this happens asynchronously and doesn't block
      setTimeout(() => {
        console.log("[Avatar] Calling initializeLiveKitRoom() now...");
        initializeLiveKitRoom();
      }, 50);
    } catch (error) {
      const errorMsg = error.message || 'Failed to create avatar session';
      console.error("Error creating HeyGen session:", error);
      setStatus("Failed to create avatar session");
      setError(errorMsg);
      // Mark avatar as failed so browser TTS can be used
      setAvatarReady(false);
      if (onAvatarReady) {
        onAvatarReady(false);
      }
      throw error;
    }
  };

  // Initialize LiveKit Room
  const initializeLiveKitRoom = () => {
    try {
      console.log("[Avatar] Initializing LiveKit room...");
      
      if (!sessionInfoRef.current || !sessionInfoRef.current.url || !sessionInfoRef.current.access_token) {
        const errorMsg = "Missing session information. Please refresh the page.";
        console.error("[Avatar]", errorMsg);
        console.error("[Avatar] Session info:", sessionInfoRef.current);
        setError(errorMsg);
        setStatus("Failed to initialize room");
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
        return;
      }

      console.log("[Avatar] Session info available, creating room...");

      const room = new Room();
      const mediaStream = new MediaStream();

      // Handle track subscribed events
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log(`[Avatar] Track subscribed: ${track.kind} from ${participant?.identity || 'unknown'}`);
        if (track.kind === "video" || track.kind === "audio") {
          mediaStream.addTrack(track.mediaStreamTrack);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            console.log(`[Avatar] ${track.kind} track added to video element`);
            if (track.kind === "video") {
              // Video track received - avatar is ready!
              setStatus("Avatar ready");
              setAvatarReady(true);
              if (onAvatarReady) {
                onAvatarReady(true);
              }
              // Clear video track timeout since we got the track
              if (sessionInfoRef.current?.videoTrackTimeout) {
                clearTimeout(sessionInfoRef.current.videoTrackTimeout);
                delete sessionInfoRef.current.videoTrackTimeout;
              }
            }
          }
        }
      });
      
      // Also handle track published events (tracks that become available)
      room.on(RoomEvent.TrackPublished, (publication, participant) => {
        console.log(`[Avatar] Track published: ${publication.kind} from ${participant?.identity || 'unknown'}`);
        // Automatically subscribe to published tracks
        if (publication.kind === "video" || publication.kind === "audio") {
          console.log(`[Avatar] Auto-subscribing to ${publication.kind} track`);
          // Use the correct LiveKit API method - setTrackSubscribed or subscribeToTrack
          try {
            if (publication.setSubscribed) {
              publication.setSubscribed(true);
            } else if (participant.setTrackSubscribed) {
              participant.setTrackSubscribed(publication.trackSid, true);
            } else if (room.setTrackSubscribed) {
              room.setTrackSubscribed(publication.trackSid, true);
            } else {
              // Tracks are auto-subscribed by default in LiveKit, so this might not be needed
              console.log(`[Avatar] Track will be auto-subscribed by LiveKit`);
            }
          } catch (err) {
            console.warn(`[Avatar] Could not explicitly subscribe to track (may auto-subscribe):`, err);
          }
        }
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log("Room disconnected:", reason);
        setStatus(`Room disconnected: ${reason}`);
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
      });

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log("Connection state changed:", state);
        if (state === ConnectionState.Disconnected) {
          setStatus("Connection lost");
          setAvatarReady(false);
          if (onAvatarReady) {
            onAvatarReady(false);
          }
        }
      });

      roomRef.current = room;
      mediaStreamRef.current = mediaStream;

      // Now start the HeyGen streaming session
      // This will connect the room and start the video stream
      setStatus("Starting avatar stream...");
      console.log("[Avatar] LiveKit room initialized, starting HeyGen streaming...");
      
      // Start streaming - this will also connect the room
      // Use a small delay to ensure room is fully set up
      setTimeout(() => {
        console.log("[Avatar] Calling startHeyGenSession() now...");
        startHeyGenSession().catch((err) => {
          console.error("[Avatar] Error in startHeyGenSession:", err);
          // Error is already handled in startHeyGenSession
        });
      }, 100);
    } catch (error) {
      const errorMsg = error.message || 'Failed to initialize LiveKit room';
      console.error("Error initializing LiveKit room:", error);
      setStatus("Failed to initialize room");
      setError(errorMsg);
      setAvatarReady(false);
      if (onAvatarReady) {
        onAvatarReady(false);
      }
    }
  };

  // Start HeyGen streaming session
  const startHeyGenSession = async () => {
    try {
      if (!sessionInfoRef.current || !sessionInfoRef.current.session_id) {
        throw new Error('Session info is missing. Please create a session first.');
      }

      // Refresh session token before starting (tokens may expire quickly)
      console.log("[Avatar] Refreshing session token before starting stream...");
      try {
        await getSessionToken();
        console.log("[Avatar] Session token refreshed");
      } catch (tokenError) {
        console.warn("[Avatar] Failed to refresh token, using existing token:", tokenError);
        // Continue with existing token if refresh fails
      }

      if (!sessionTokenRef.current) {
        throw new Error('Session token is missing');
      }

      console.log("[Avatar] Starting HeyGen streaming session via backend proxy...");
      // Use backend proxy endpoint to ensure API key is used correctly
      const startResponse = await fetch(`${apiUrl || 'http://localhost:8000'}/api/heygen/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionInfoRef.current.session_id,
          session_token: sessionTokenRef.current, // Pass token for reference, backend uses API key
        }),
      });

      if (startResponse.status === 401) {
        // Try refreshing token one more time and retry
        console.log("[Avatar] 401 error, refreshing token and retrying...");
        try {
          await getSessionToken();
          const retryResponse = await fetch(`${apiUrl || 'http://localhost:8000'}/api/heygen/start`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              session_id: sessionInfoRef.current.session_id,
              session_token: sessionTokenRef.current,
            }),
          });
          
          if (retryResponse.status === 401) {
            const errorData = await retryResponse.json().catch(() => ({}));
            const errorMsg = `HeyGen API authentication failed (401). The API key may be invalid or expired. Please check backend/.env file. ${errorData.detail || ''}`;
            setError(errorMsg);
            setStatus("Failed to start streaming");
            setAvatarReady(false);
            if (onAvatarReady) {
              onAvatarReady(false);
            }
            throw new Error(errorMsg);
          }
          
          // Retry succeeded, continue with normal flow
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text().catch(() => 'Unknown error');
            const errorMsg = `Failed to start streaming: ${retryResponse.status} - ${errorText.substring(0, 200)}`;
            setError(errorMsg);
            setStatus("Failed to start streaming");
            setAvatarReady(false);
            if (onAvatarReady) {
              onAvatarReady(false);
            }
            throw new Error(errorMsg);
          }
          
          // Success - continue with connection (use retryResponse as the response)
          console.log("[Avatar] Streaming started successfully after token refresh");
          // Continue with normal flow using retryResponse
          setStatus("Connecting to avatar...");
          
          // Clear the streaming timeout since we're starting now
          if (sessionInfoRef.current?.streamingTimeout) {
            clearTimeout(sessionInfoRef.current.streamingTimeout);
            delete sessionInfoRef.current.streamingTimeout;
          }
          
          // Now connect to the LiveKit room after streaming has started
          if (!roomRef.current) {
            const errorMsg = 'LiveKit room is not initialized';
            console.error("[Avatar]", errorMsg);
            setError(errorMsg);
            setStatus("Failed to start streaming");
            setAvatarReady(false);
            if (onAvatarReady) {
              onAvatarReady(false);
            }
            throw new Error(errorMsg);
          }
          
          if (!sessionInfoRef.current.url || !sessionInfoRef.current.access_token) {
            const errorMsg = 'Missing LiveKit connection details';
            console.error("[Avatar]", errorMsg);
            setError(errorMsg);
            setStatus("Failed to start streaming");
            setAvatarReady(false);
            if (onAvatarReady) {
              onAvatarReady(false);
            }
            throw new Error(errorMsg);
          }

          console.log("[Avatar] Connecting to LiveKit room...");
          await roomRef.current.connect(sessionInfoRef.current.url, sessionInfoRef.current.access_token);
          setStatus("Avatar streaming started");
          console.log("[Avatar] LiveKit room connected. Waiting for video track...");
          return; // Exit early since we handled the retry
        } catch (retryError) {
          const errorData = await startResponse.json().catch(() => ({}));
          const errorMsg = `HeyGen API authentication failed (401). The API key may be invalid or expired. Please check backend/.env file. ${errorData.detail || ''}`;
          setError(errorMsg);
          setStatus("Failed to start streaming");
          setAvatarReady(false);
          if (onAvatarReady) {
            onAvatarReady(false);
          }
          throw new Error(errorMsg);
        }
      } else if (!startResponse.ok) {
        const errorText = await startResponse.text().catch(() => 'Unknown error');
        const errorMsg = `Failed to start streaming: ${startResponse.status} - ${errorText.substring(0, 200)}`;
        setError(errorMsg);
        setStatus("Failed to start streaming");
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
        throw new Error(errorMsg);
      }

      console.log("[Avatar] Streaming started successfully");
      setStatus("Connecting to avatar...");
      
      // Clear the streaming timeout since we're starting now
      if (sessionInfoRef.current?.streamingTimeout) {
        clearTimeout(sessionInfoRef.current.streamingTimeout);
        delete sessionInfoRef.current.streamingTimeout;
      }
      
      // Now connect to the LiveKit room after streaming has started
      if (!roomRef.current) {
        const errorMsg = 'LiveKit room is not initialized';
        console.error("[Avatar]", errorMsg);
        setError(errorMsg);
        setStatus("Failed to start streaming");
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
        throw new Error(errorMsg);
      }
      
      if (!sessionInfoRef.current.url || !sessionInfoRef.current.access_token) {
        const errorMsg = 'Missing LiveKit connection details';
        console.error("[Avatar]", errorMsg);
        setError(errorMsg);
        setStatus("Failed to start streaming");
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
        throw new Error(errorMsg);
      }

      // Connect to the room with timeout
      try {
        console.log("[Avatar] Connecting to LiveKit room...");
        const connectPromise = roomRef.current.connect(sessionInfoRef.current.url, sessionInfoRef.current.access_token);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        console.log("[Avatar] Room connected successfully");
        setStatus("Avatar streaming...");
        
        // Explicitly subscribe to remote tracks after connection
        // This ensures we receive video/audio tracks from HeyGen
        console.log("[Avatar] Checking for remote tracks...");
        const remoteParticipants = roomRef.current.remoteParticipants;
        for (const [participantId, participant] of remoteParticipants) {
          console.log(`[Avatar] Found remote participant: ${participantId}`);
          for (const [publicationId, publication] of participant.trackPublications) {
            if (publication.kind === "video" || publication.kind === "audio") {
              console.log(`[Avatar] Found ${publication.kind} track: ${publicationId}, subscribed: ${publication.isSubscribed}`);
              // LiveKit auto-subscribes by default, but we can ensure it's subscribed
              if (!publication.isSubscribed) {
                try {
                  if (publication.setSubscribed) {
                    publication.setSubscribed(true);
                  } else if (roomRef.current.setTrackSubscribed) {
                    roomRef.current.setTrackSubscribed(publication.trackSid, true);
                  }
                } catch (err) {
                  console.warn(`[Avatar] Could not subscribe to track (may auto-subscribe):`, err);
                }
              }
            }
          }
        }
        
        // Also listen for new participants joining
        roomRef.current.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log(`[Avatar] New participant connected: ${participant.identity}`);
          // Tracks will be auto-subscribed via TrackPublished event handler above
        });
        
        // Avatar is ready when video track is received (handled in TrackSubscribed event)
        // Don't set avatarReady here - wait for the video track
        console.log("[Avatar] Waiting for video track...");
        
        // Set a timeout for video track - if no track received in 20 seconds, mark as failed
        const videoTrackTimeout = setTimeout(() => {
          if (!avatarReady) {
            console.warn("[Avatar] Video track timeout - no track received after 20 seconds");
            setError("Video stream timeout. Using browser TTS instead.");
            setStatus("Stream timeout");
            setAvatarReady(false);
            if (onAvatarReady) {
              onAvatarReady(false);
            }
          }
        }, 20000); // Increased to 20 seconds
        
        if (!sessionInfoRef.current) {
          sessionInfoRef.current = {};
        }
        sessionInfoRef.current.videoTrackTimeout = videoTrackTimeout;
      } catch (connectError) {
        const errorMsg = connectError.message || 'Failed to connect to avatar room';
        console.error("[Avatar] Error connecting to room:", connectError);
        setError(errorMsg);
        setStatus("Failed to connect");
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to start avatar session';
      console.error("Error starting HeyGen session:", error);
      setStatus(`Failed: ${errorMsg}`);
      setError(errorMsg);
      // Mark avatar as failed so browser TTS can be used
      setAvatarReady(false);
      if (onAvatarReady) {
        onAvatarReady(false);
      }
      throw error;
    }
  };

  // Send text to HeyGen avatar
  const sendTextToAvatar = async (text) => {
    try {
      if (!sessionInfoRef.current) {
        throw new Error("No active avatar session");
      }

      console.log(`Sending text to avatar: "${text}"`);
      setStatus(`Sending text to avatar...`);

      // Use backend proxy endpoint which handles token refresh automatically
      const response = await fetch(`${apiUrl || 'http://localhost:8000'}/api/heygen/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionInfoRef.current.session_id,
          text: text,
          task_type: "repeat"
        }),
      });

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HeyGen API authentication failed (401). The API key may be invalid or expired. Please check backend/.env file. ${errorData.detail || ''}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send text to avatar: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      setStatus(`Text sent to avatar`);
      return await response.json();
    } catch (error) {
      const errorMsg = error.message || 'Failed to send text to avatar';
      console.error("Error sending text to avatar:", error);
      setStatus(`Failed to send text: ${errorMsg}`);
      setError(errorMsg);
      throw error;
    }
  };

  // Function to stop and clean up existing HeyGen session
  const stopExistingSession = async () => {
    try {
      if (sessionInfoRef.current?.session_id) {
        const oldSessionId = sessionInfoRef.current.session_id;
        console.log("[Avatar] Stopping existing HeyGen session:", oldSessionId);
        
        // Try to stop via backend proxy (more reliable)
        try {
          // Backend endpoint expects session_id as query parameter
          const stopUrl = `${apiUrl || 'http://localhost:8000'}/api/heygen/stop?session_id=${encodeURIComponent(oldSessionId)}`;
          const stopResponse = await fetch(stopUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (stopResponse.ok) {
            console.log("[Avatar] Existing session stopped via backend");
          } else {
            const errorText = await stopResponse.text().catch(() => '');
            console.warn("[Avatar] Backend stop returned:", stopResponse.status, errorText.substring(0, 100));
          }
        } catch (err) {
          console.warn("[Avatar] Failed to stop session via backend, trying direct API:", err);
          // Fallback to direct API call
          if (sessionTokenRef.current) {
            await fetch(`${HEYGEN_CONFIG.serverUrl}/v1/streaming.stop`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionTokenRef.current}`,
              },
              body: JSON.stringify({
                session_id: oldSessionId,
              }),
            }).catch(e => console.warn("[Avatar] Direct stop also failed:", e));
          }
        }
      }
      
      // Clean up LiveKit room
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
          console.log("[Avatar] LiveKit room disconnected");
        } catch (e) {
          console.warn("[Avatar] Error disconnecting room:", e);
        }
        roomRef.current = null;
      }
      
      // Clean up media streams
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Clean up WebSocket
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
      
      // Clear session info
      sessionInfoRef.current = null;
      sessionTokenRef.current = null;
      
      console.log("[Avatar] Cleanup complete");
    } catch (error) {
      console.warn("[Avatar] Error during cleanup:", error);
      // Continue anyway - we'll create a new session
    }
  };

  // Initialize avatar when component mounts
  useEffect(() => {
    let isMounted = true;
    let initializationStarted = false;
    
    const initializeAvatar = async () => {
      // Prevent double initialization (React StrictMode mounts twice in dev)
      if (initializationStarted) {
        console.log("[Avatar] Initialization already started, skipping duplicate");
        return;
      }
      initializationStarted = true;
      
      try {
        setError(null); // Clear any previous errors
        setStatus("Initializing avatar...");
        console.log("[Avatar] Starting initialization...");
        
        // IMPORTANT: Stop any existing session BEFORE creating a new one
        // This prevents "Concurrent session limit" errors
        console.log("[Avatar] Step 0: Stopping any existing sessions...");
        await stopExistingSession();
        
        // Also call backend endpoint to ensure all sessions are cleared
        try {
          const stopAllResponse = await fetch(`${apiUrl || 'http://localhost:8000'}/api/heygen/stop-all`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (stopAllResponse.ok) {
            console.log("[Avatar] Backend confirmed ready for new session");
          } else {
            console.warn("[Avatar] Backend stop-all returned:", stopAllResponse.status);
          }
        } catch (err) {
          console.warn("[Avatar] Could not call stop-all endpoint:", err.message);
          // Continue anyway - endpoint might not be available yet
        }
        
        console.log("[Avatar] Step 0: Cleanup complete");
        
        // Wait longer for HeyGen to fully process the stop requests
        // This helps prevent "concurrent session limit" errors
        // Increased to 5 seconds to give HeyGen more time to release the session
        console.log("[Avatar] Waiting 5 seconds for session cleanup to propagate...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        if (!isMounted) {
          console.log("[Avatar] Component unmounted during cleanup wait, stopping initialization");
          return;
        }
        
        // Get fresh session token first
        console.log("[Avatar] Step 1: Getting session token...");
        await getSessionToken();
        console.log("[Avatar] Step 1: Session token obtained");
        
        if (!isMounted) {
          console.log("[Avatar] Component unmounted, stopping initialization");
          return;
        }
        
        // Create session
        console.log("[Avatar] Step 2: Creating HeyGen session...");
        await createHeyGenSession();
        console.log("[Avatar] Step 2: HeyGen session created");
        
        if (!isMounted) {
          console.log("[Avatar] Component unmounted, stopping initialization");
          return;
        }
        
        // LiveKit room will be initialized in createHeyGenSession
        // and startHeyGenSession will be called from there
        console.log("[Avatar] Initialization complete, waiting for video track...");
        
        // Add a check to ensure LiveKit initialization started
        // If it didn't start within 2 seconds, log a warning
        setTimeout(() => {
          if (!roomRef.current && avatarReady === null && !error) {
            console.warn("[Avatar] LiveKit room not initialized after 2 seconds, checking status...");
            // LiveKit is now imported as npm package, so it's always available
            // Check if we have session info to initialize
            if (sessionInfoRef.current && sessionInfoRef.current.url) {
              console.warn("[Avatar] LiveKit client available but room not initialized, attempting to initialize now...");
              initializeLiveKitRoom();
            } else {
              console.error("[Avatar] Cannot initialize LiveKit room: missing session info");
            }
          }
        }, 2000);
      } catch (error) {
        if (!isMounted) {
          console.log("[Avatar] Component unmounted during error handling");
          return;
        }
        const errorMsg = error.message || 'Failed to initialize avatar';
        console.error("[Avatar] Error initializing avatar:", error);
        console.error("[Avatar] Error stack:", error.stack);
        console.error("[Avatar] Error details:", {
          message: error.message,
          name: error.name,
          cause: error.cause
        });
        setStatus("Failed to initialize avatar");
        setError(errorMsg);
        // Mark avatar as failed so browser TTS can be used
        setAvatarReady(false);
        if (onAvatarReady) {
          onAvatarReady(false);
        }
      }
    };

    // Delay initialization slightly to avoid race conditions with StrictMode double-mount
    const initTimer = setTimeout(() => {
      if (isMounted) {
        initializeAvatar();
      }
    }, 100);
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      console.log("[Avatar] Component unmounting, cleaning up...");
      stopExistingSession();
    };
  }, []);

  // Send speech to avatar when speaking
  // This handles both immediate sends (when avatar is ready) and queued messages (when avatar becomes ready)
  useEffect(() => {
    if (isSpeaking && currentSpeech && sessionInfoRef.current) {
      if (avatarReady === true) {
        // Avatar is ready, send immediately
        console.log('Sending text to avatar:', currentSpeech.substring(0, 50) + '...');
        sendTextToAvatar(currentSpeech).catch(err => {
          console.error('Failed to send text to avatar:', err);
        });
      } else if (avatarReady === false) {
        // Avatar failed - don't try to send, browser TTS will handle it
        console.log('Avatar failed - message will be handled by browser TTS');
      } else {
        // Avatar is still loading (null), message is queued in currentSpeech
        // When avatar becomes ready, this useEffect will trigger again and send it
        console.log('Avatar not ready yet, message queued for when avatar loads:', currentSpeech.substring(0, 50) + '...');
      }
    }
  }, [isSpeaking, currentSpeech, avatarReady]);

  return (
    <div className={`avatar ${isSpeaking ? 'avatar--speaking' : ''}`}>
      <div className="avatar__container">
        <div className="avatar__video-wrapper">
          <video
            ref={videoRef}
            className="avatar__video"
            autoPlay
            playsInline
          />
          {error && (
            <div className="avatar__error" style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: 'var(--space-4)', 
              background: error.includes('Concurrent limit') ? 'rgba(217, 119, 6, 0.95)' : 'rgba(220, 38, 38, 0.95)', 
              border: `2px solid ${error.includes('Concurrent limit') ? '#d97706' : '#dc2626'}`, 
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: 'var(--fs-sm)',
              textAlign: 'center',
              zIndex: 1000,
              maxWidth: '90%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <strong style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                {error.includes('Concurrent limit') ? 'ℹ️ HeyGen Plan Limit:' : '⚠️ Avatar Error:'}
              </strong>
              <div style={{ wordBreak: 'break-word' }}>{error}</div>
              {error.includes('Concurrent limit') && (
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--fs-xs)', opacity: 0.9 }}>
                  ✓ Browser TTS is active and working
                </div>
              )}
            </div>
          )}
          {!avatarReady && !error && (
            <div className="avatar__loading">
              <div className="avatar__loading-spinner"></div>
              <p className="avatar__loading-text">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewerAvatar;
